'use strict';

const {readFileSync} = require('fs');
const path = require('path');
// const {inspect} = require('util');
const {parser} = require('posthtml-parser');
const {match} = require('posthtml/lib/api');
const expressions = require('posthtml-expressions');
const findPathFromTagName = require('./find-path');
const processLocals = require('./locals');
const processAttributes = require('./attributes');
const {processPushes, processStacks} = require('./stacks');
const {setFilledSlots, processSlotContent, processFillContent} = require('./slots');

// const debug = false;
//
// const log = (object, what, method) => {
//   if (debug === true || method === debug) {
//     console.log(what, inspect(object, false, null, true));
//   }
// };

/* eslint-disable complexity */
module.exports = (options = {}) => tree => {
  options.root = path.resolve(options.root || './');
  options.roots = options.roots || [''];
  options.tagPrefix = options.tagPrefix || 'x-';
  options.namespaces = options.namespaces || [];
  options.namespaceSeparator = options.namespaceSeparator || '::';
  options.namespaceFallback = options.namespaceFallback || false;
  options.fileExtension = options.fileExtension || 'html';
  options.tag = options.tag || 'component';
  options.attribute = options.attribute || 'src';
  options.yield = options.yield || 'yield';
  options.slot = options.slot || 'slot';
  options.fill = options.fill || 'fill';
  options.push = options.push || 'push';
  options.stack = options.stack || 'stack';
  options.localsAttr = options.localsAttr || 'props';
  options.expressions = options.expressions || {};
  options.plugins = options.plugins || [];
  options.strict = typeof options.strict === 'undefined' ? true : options.strict;
  options.attrsParserRules = options.attrsParserRules || {};
  options.slot = new RegExp(`^${options.slot}:`, 'i');
  options.fill = new RegExp(`^${options.fill}:`, 'i');
  options.tagPrefix = new RegExp(`^${options.tagPrefix}`, 'i');
  options.matcher = options.matcher || [{tag: options.tag}, {tag: options.tagPrefix}];
  options.roots = Array.isArray(options.roots) ? options.roots : [options.roots];
  options.roots.forEach((root, index) => {
    options.roots[index] = path.join(options.root, root);
  });
  options.namespaces = Array.isArray(options.namespaces) ? options.namespaces : [options.namespaces];
  options.namespaces.forEach((namespace, index) => {
    options.namespaces[index].root = path.resolve(namespace.root);
    if (namespace.fallback) {
      options.namespaces[index].fallback = path.resolve(namespace.fallback);
    }

    if (namespace.custom) {
      options.namespaces[index].custom = path.resolve(namespace.custom);
    }
  });

  options.locals = {...options.expressions.locals};
  options.aware = {};

  const pushedContent = {};

  return processStacks(
    processPushes(
      processTree(options)(
        expressions(options.expressions)(tree)
      ),
      pushedContent,
      options.push
    ),
    pushedContent,
    options.stack
  );
};
/* eslint-enable complexity */

/**
 * @param  {Object} options Plugin options
 * @return {Object} PostHTML tree
 */
function processTree(options) {
  // rename to pushes and slots
  const slotContent = {};

  let processCounter = 0;

  return function (tree) {
    match.call(tree, options.matcher, currentNode => {
      if (!currentNode.attrs) {
        currentNode.attrs = {};
      }

      const componentFile = currentNode.attrs[options.attribute] || findPathFromTagName(currentNode, options);

      if (!componentFile) {
        return currentNode;
      }

      const componentPath = path.isAbsolute(componentFile) && componentFile !== currentNode.attrs[options.attribute] ?
        componentFile :
        path.join(options.root, componentFile);

      if (!componentPath) {
        return currentNode;
      }

      console.log(`${++processCounter}) Processing component ${componentPath}`);

      let nextNode = parser(readFileSync(componentPath, 'utf8'));

      // Set filled slots
      setFilledSlots(currentNode, slotContent, options);

      // Reset previous locals with passed global and keep aware locals
      options.expressions.locals = {...options.locals, ...options.aware};

      const {attributes, locals} = processLocals(currentNode, nextNode, slotContent, options);

      options.expressions.locals = attributes;
      options.expressions.locals.$slots = slotContent;
      // const plugins = [...options.plugins, expressions(options.expressions)];
      nextNode = expressions(options.expressions)(nextNode);

      // Process <yield> tag
      const content = match.call(nextNode, {tag: options.yield}, nextNode => {
        // Fill <yield> with current node content or default <yield> content or empty
        return currentNode.content || nextNode.content || '';
      });

      // Process <slot> tags
      processSlotContent(nextNode, slotContent, options);

      // Process <fill> tags
      processFillContent(nextNode, slotContent, options);

      // Remove component tag and replace content with <yield>
      currentNode.tag = false;
      currentNode.content = content;

      processAttributes(currentNode, attributes, locals, options);

      // log(currentNode, 'currentNode', 'currentNode')
      // currentNode.attrs.counter = processCounter;
      // currentNode.attrs.data = JSON.stringify({ attributes, locals });

      // messages.push({
      //   type: 'dependency',
      //   file: componentPath,
      //   from: options.root
      // });

      return currentNode;
    });

    return tree;
  };
}
