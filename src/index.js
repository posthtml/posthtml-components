'use strict';

const {readFileSync} = require('fs');
const path = require('path');
const {inspect} = require('util');
const {parser} = require('posthtml-parser');
const {render} = require('posthtml-render');
const {match} = require('posthtml/lib/api');
const expressions = require('posthtml-expressions');
const scriptDataLocals = require('posthtml-expressions/lib/locals');
const parseAttrs = require('posthtml-attrs-parser');
const merge = require('deepmerge');
const styleToObject = require('style-to-object');
const findPathFromTagName = require('./find-path');

const debug = false;

const log = (object, what, method) => {
  if (debug === true || method === debug) {
    console.log(what, inspect(object, false, null, true));
  }
};

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

  log(options, 'options', 'init');

  tree = processTree(options)(tree);

  return tree;
};
/* eslint-enable complexity */

/**
 * @param  {Object} options Plugin options
 * @return {Object} PostHTML tree
 */
function processTree(options) {
  // rename to pushes and slots
  const pushedContent = {};
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

      // Process <stack> tag
      processPushes(currentNode, pushedContent, options);

      // log(componentNode, 'componentNode');

      log(`${++processCounter} ${componentPath}`, 'Processing component', 'processTree');

      const nextNode = parser(readFileSync(componentPath, 'utf8'));

      // Set filled slots
      setFilledSlots(currentNode, slotContent, options);

      // Reset previous locals with passed global and keep aware locals
      options.expressions.locals = {...options.locals, ...options.aware};

      const {attributes, locals} = processLocals(currentNode, nextNode, slotContent, options);

      options.expressions.locals = attributes;

      options.expressions.locals.$slots = slotContent;

      // const plugins = [...options.plugins, expressions(options.expressions)];

      log({attributes, locals, slotContent}, 'Processed attributes, locals and slots', 'processTree');

      expressions(options.expressions)(nextNode);

      // Process <stack> tag
      processPushes(nextNode, pushedContent, options);

      // Process <stack> tag
      processStacks(nextNode, pushedContent, options);

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

/**
 * Set filled slots
 *
 * @param  {Object} currentNode PostHTML tree
 * @param  {Object} slots
 * @param  {Object} options Plugin options
 * @return {void}
 */
function setFilledSlots(currentNode, slots, {slot}) {
  match.call(currentNode, {tag: slot}, fillNode => {
    if (!fillNode.attrs) {
      fillNode.attrs = {};
    }

    const name = fillNode.tag.split(':')[1];

    log(name, 'found filled slot', 'setFilledSlots');

    /** @var {Object} locals */
    const locals = Object.fromEntries(Object.entries(fillNode.attrs).filter(([attributeName]) => ![name, 'type'].includes(attributeName)));

    if (locals) {
      Object.keys(locals).forEach(local => {
        try {
          locals[local] = JSON.parse(locals[local]);
        } catch {}
      });
    }

    slots[name] = {
      filled: true,
      rendered: false,
      tag: fillNode.tag,
      attrs: fillNode.attrs,
      content: fillNode.content,
      source: render(fillNode.content),
      locals
    };

    return fillNode;
  });

  log(slots, 'all filled slots found', 'setFilledSlots');
}

/**
 * Process <push> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processPushes(tree, content, {push}) {
  match.call(tree, {tag: push}, pushNode => {
    if (!content[pushNode.attrs.name]) {
      content[pushNode.attrs.name] = [];
    }

    content[pushNode.attrs.name].push(pushNode.content);
    pushNode.tag = false;
    pushNode.content = null;

    return pushNode;
  });

  log(Object.keys(content), 'Found pushes', 'processPushes');
}

/**
 * Process <stack> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processStacks(tree, content, {stack}) {
  log(Object.keys(content), 'Process stacks for this push', 'processStacks');

  match.call(tree, {tag: stack}, stackNode => {
    stackNode.tag = false;
    stackNode.content = content[stackNode.attrs.name];
    return stackNode;
  });
}

/**
 * Process <slot> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processSlotContent(tree, content, {slot}) {
  match.call(tree, {tag: slot}, slotNode => {
    const name = slotNode.tag.split(':')[1];

    if (!content[name]) {
      content[name] = {};
    }

    log(name, 'processing slot', 'processSlotContent');

    content[name].tag = slotNode.tag;
    content[name].attrs = slotNode.attrs;
    content[name].content = slotNode.content;
    content[name].source = render(slotNode.content);
    content[name].rendered = false;

    slotNode.tag = false;
    slotNode.content = null;

    return slotNode;
  });

  log(content, 'Slots processed', 'processSlotContent');
}

/**
 * Process <fill> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processFillContent(tree, content, {fill}) {
  match.call(tree, {tag: fill}, fillNode => {
    const name = fillNode.tag.split(':')[1];

    log(name, 'Processing fill', 'processFillContent');

    fillNode.tag = false;

    if (content[name]?.rendered) {
      fillNode.content = null;
    } else if (fillNode.content && content[name]?.attrs && (typeof content[name]?.attrs.append !== 'undefined' || typeof content[name]?.attrs.prepend !== 'undefined')) {
      fillNode.content = typeof content[name]?.attrs.append === 'undefined' ? content[name]?.content.concat(fillNode.content) : fillNode.content.concat(content[name]?.content);
    } else {
      fillNode.content = content[name]?.content;
    }

    // Set rendered to true so a slot can be output only once,
    //  when not present "aware" attribute
    if (content[name] && (!content[name]?.attrs || typeof content[name].attrs.aware === 'undefined')) {
      content[name].rendered = true;
    }

    return fillNode;
  });

  log(content, 'Processed fill', 'processFillContent');
}

/**
 * Parse locals from attributes, globals and via script
 *
 * @param {Object} currentNode - PostHTML tree
 * @param {Array} nextNode - PostHTML tree
 * @param {Object} slotContent - Slot locals
 * @param {Object} options - Plugin options
 * @return {Object} - Attribute locals and script locals
 */
function processLocals(currentNode, nextNode, slotContent, options) {
  let attributes = {...currentNode.attrs};

  const merged = [];
  const computed = [];
  const aware = [];
  Object.keys(attributes).forEach(attributeName => {
    const newAttributeName = attributeName
      .replace('merge:', '')
      .replace('computed:', '')
      .replace('aware:', '');

    switch (true) {
      case attributeName.startsWith('merge:'):
        log(attributeName, 'merge', 'processLocals');
        attributes[newAttributeName] = attributes[attributeName];
        delete attributes[attributeName];
        merged.push(newAttributeName);

        break;

      case attributeName.startsWith('computed:'):
        log(attributeName, 'computed', 'processLocals');
        attributes[newAttributeName] = attributes[attributeName];
        delete attributes[attributeName];
        computed.push(newAttributeName);
        break;

      case attributeName.startsWith('aware:'):
        log(attributeName, 'aware', 'processLocals');
        attributes[newAttributeName] = attributes[attributeName];
        delete attributes[attributeName];
        aware.push(newAttributeName);
        break;

      default: break;
    }
  });

  // Parse JSON attributes
  Object.keys(attributes).forEach(attributeName => {
    try {
      const parsed = JSON.parse(attributes[attributeName]);
      if (attributeName === 'locals') {
        if (merged.includes(attributeName)) {
          attributes = merge(attributes, parsed);
          merged.splice(merged.indexOf('locals'), 1);
        } else {
          // Override with merge see https://www.npmjs.com/package/deepmerge#arraymerge-example-overwrite-target-array
          Object.assign(attributes, parsed);
        }
      } else {
        attributes[attributeName] = parsed;
      }
    } catch {}
  });

  delete attributes.locals;

  // Merge with global
  attributes = merge(options.expressions.locals, attributes);

  // Retrieve default locals from <script props> and merge with attributes
  const {locals} = scriptDataLocals(nextNode, {localsAttr: options.localsAttr, removeScriptLocals: true, locals: {...attributes, $slots: slotContent}});

  log(locals, 'locals parsed in tag ' + currentNode.tag, 'processLocals');

  // Merge default locals and attributes or overrides props with attributes
  if (locals) {
    if (merged.length > 0) {
      /** @var {Object} mergedAttributes */
      const mergedAttributes = Object.fromEntries(Object.entries(attributes).filter(([attribute]) => merged.includes(attribute)));
      /** @var {Object} mergedAttributes */
      const mergedLocals = Object.fromEntries(Object.entries(locals).filter(([local]) => merged.includes(local)));

      if (Object.keys(mergedLocals).length > 0) {
        merged.forEach(attributeName => {
          attributes[attributeName] = merge(mergedLocals[attributeName], mergedAttributes[attributeName]);
        });
      }
    }

    // Override attributes with props when is computed or attribute is not defined
    Object.keys(locals).forEach(attributeName => {
      if (computed.includes(attributeName) || typeof attributes[attributeName] === 'undefined') {
        attributes[attributeName] = locals[attributeName];
      }
    });
  }

  if (aware.length > 0) {
    options.aware = Object.fromEntries(Object.entries(attributes).filter(([attributeName]) => aware.includes(attributeName)));
  }

  log({locals, attributes}, 'locals and attributes processed for tag ' + currentNode.tag, 'processLocals');

  return {attributes, locals};
}

/**
 * Map component attributes that it's not defined as locals to first element of node
 *
 * @param {Object} currentNode
 * @param {Object} attributes
 * @param {Object} locals
 * @param {Object} options
 * @return {void}
 */
function processAttributes(currentNode, attributes, locals, options) {
  // Find by attribute 'attributes' ??
  const index = currentNode.content.findIndex(content => typeof content === 'object');

  if (index === -1) {
    return;
  }

  const nodeAttrs = parseAttrs(currentNode.content[index].attrs, options.attrsParserRules);

  log(nodeAttrs, 'nodeAttrs in processAttributes', 'processAttributes');
  log(locals, 'locals in processAttributes', 'processAttributes');
  log(options.aware, 'options aware in processAttributes', 'processAttributes');

  Object.keys(attributes).forEach(attr => {
    log(attr, 'processing attribute', 'processAttributes');
    log(typeof locals[attr] === 'undefined', 'not in locals?', 'processAttributes');

    if (typeof locals[attr] === 'undefined' && !Object.keys(options.aware).includes(attr)) {
      if (['class'].includes(attr)) {
        // Merge class
        if (typeof nodeAttrs.class === 'undefined') {
          nodeAttrs.class = [];
        }

        nodeAttrs.class.push(attributes.class);

        delete attributes.class;
      } else if (['override:class'].includes(attr)) {
        // Override class
        nodeAttrs.class = attributes['override:class'];

        delete attributes['override:class'];
      } else if (['style'].includes(attr)) {
        // Merge style
        if (typeof nodeAttrs.style === 'undefined') {
          nodeAttrs.style = {};
        }

        nodeAttrs.style = Object.assign(nodeAttrs.style, styleToObject(attributes.style));

        delete attributes.style;
      } else if (['override:style'].includes(attr)) {
        // Override style
        nodeAttrs.style = attributes['override:style'];
        delete attributes['override:style'];
      } else if (!attr.startsWith('$') && attr !== options.attribute) {
        // Everything that doesn't start with '$' else set as attribute name/value
        nodeAttrs[attr] = attributes[attr];
        delete attributes[attr];
      }
    }
  });

  currentNode.content[index].attrs = nodeAttrs.compose();

  log(currentNode.content[index].attrs, 'after processing attributes', 'processAttributes');
}
