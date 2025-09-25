const {readFileSync, existsSync} = require('node:fs');
const path = require('node:path');
const {parser} = require('posthtml-parser');
const {match, walk} = require('posthtml/lib/api');
const expressions = require('posthtml-expressions');
const findPathFromTag = require('./find-path');
const processProps = require('./process-props');
const processAttributes = require('./process-attributes');
const {processPushes, processStacks} = require('./process-stacks');
const {setFilledSlots, processSlotContent, processFillContent} = require('./process-slots');
const log = require('./log');
const each = require('lodash/each');
const defaults = require('lodash/defaults');
const assignWith = require('lodash/assignWith');
const mergeWith = require('lodash/mergeWith');
const template = require('lodash/template');
const get = require('lodash/get');
const has = require('lodash/has');
const isObjectLike = require('lodash/isObjectLike');
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const isBoolean = require('lodash/isBoolean');
const isUndefined = require('lodash/isUndefined'); // value === undefined
const isNull = require('lodash/isNull'); // value === null
const isNil = require('lodash/isNil'); // value == null
const uniqueId = require('lodash/uniqueId');
const transform = require('lodash/transform');
const assign = require('lodash/assign');
const isPlainObject = require('lodash/isPlainObject');

/* eslint-disable complexity */
module.exports = (options = {}) => tree => {
  options.root = path.resolve(options.root || './');
  options.folders = options.folders || [''];
  options.tagPrefix = options.tagPrefix || 'x-';
  options.tag = options.tag || false;
  options.attribute = options.attribute || 'src';
  options.namespaces = options.namespaces || [];
  options.namespaceSeparator = options.namespaceSeparator || '::';
  options.fileExtension = options.fileExtension || 'html';
  options.yield = options.yield || 'yield';
  options.slot = options.slot || 'slot';
  options.fill = options.fill || 'fill';
  options.slotSeparator = options.slotSeparator || ':';
  options.push = options.push || 'push';
  options.stack = options.stack || 'stack';
  options.propsScriptAttribute = options.propsScriptAttribute || 'props';
  options.propsContext = options.propsContext || 'props';
  options.propsAttribute = options.propsAttribute || 'props';
  options.propsSlot = options.propsSlot || 'props';
  options.parserOptions = options.parserOptions || {recognizeSelfClosing: true};
  options.expressions = options.expressions || {};
  options.plugins = options.plugins || [];
  options.attrsParserRules = options.attrsParserRules || {};
  options.strict = typeof options.strict === 'undefined' ? true : options.strict;
  options.utilities = options.utilities || {
    each,
    defaults,
    assign: assignWith,
    merge: mergeWith,
    template,
    get,
    has,
    isPlainObject,
    isObject: isObjectLike,
    isArray,
    isEmpty,
    isBoolean,
    isUndefined,
    isNull,
    isNil,
    uniqueId,
    isEnabled: prop => prop === true || prop === ''
  };

  /**
   * Additional element attributes. If they already exist in valid-attributes.js,
   * it will replace all attributes. It should be an object with tag name as
   * the key and a function modifier as the value, which will receive the
   * default attributes and return an array of attributes.
   *
   * Example:
   * { TAG: (attributes) => { attributes[] = 'attribute-name'; return attributes; } }
   */
  options.elementAttributes = isPlainObject(options.elementAttributes) ? options.elementAttributes : {};
  options.safelistAttributes = Array.isArray(options.safelistAttributes) ? options.safelistAttributes : [];
  options.blocklistAttributes = Array.isArray(options.blocklistAttributes) ? options.blocklistAttributes : [];

  /**
   * Merge customizer callback passed to `lodash.mergeWith` for merging
   * attribute `props` and all attributes starting with `merge:`.
   *
   * @see {@link https://lodash.com/docs/4.17.15#mergeWith|Lodash}
   */
  options.mergeCustomizer = options.mergeCustomizer || ((objectValue, sourceValue) => {
    if (Array.isArray(objectValue)) {
      return objectValue.concat(sourceValue);
    }
  });

  if (!(options.slot instanceof RegExp)) {
    options.slot = new RegExp(`^${options.slot}${options.slotSeparator}`, 'i');
  }

  if (!(options.fill instanceof RegExp)) {
    options.fill = new RegExp(`^${options.fill}${options.slotSeparator}`, 'i');
  }

  if (!(options.tagPrefix instanceof RegExp)) {
    options.tagPrefix = new RegExp(`^${options.tagPrefix}`, 'i');
  }

  if (!Array.isArray(options.matcher)) {
    options.matcher = [];

    if (options.tagPrefix) {
      options.matcher.push({tag: options.tagPrefix});
    }

    if (options.tag) {
      options.matcher.push({tag: options.tag});
    }
  }

  options.folders = Array.isArray(options.folders) ? options.folders : [options.folders];
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

  options.props = {...options.expressions.locals};
  options.aware = {};

  const pushedContent = {};

  log('Start of processing..', 'init', 'success');

  return processStacks(
    processPushes(
      processTree(options)(
        expressions(options.expressions)(tree), tree.messages
      ),
      pushedContent,
      options.push
    ),
    pushedContent,
    options.stack
  );
};
/* eslint-enable complexity */

// Used to reset aware props
let processCounter = 0;

/**
 * @param  {Object} options Plugin options
 * @return {Object} PostHTML tree
 */
function processTree(options) {
  return (tree, messages) => {
    log(`Processing tree number ${processCounter}..`, 'processTree');

    if (options.plugins.length > 0) {
      tree = applyPluginsToTree(tree, options.plugins);
    }

    match.call(tree, options.matcher, currentNode => {
      const filledSlots = {};

      log(`Match found for tag "${currentNode.tag}"..`, 'processTree');

      if (!currentNode.attrs) {
        currentNode.attrs = {};
      }

      const componentPath = getComponentPath(currentNode, options);

      if (messages) {
        messages.push({
          type: 'dependency',
          file: componentPath
        });
      }

      if (!componentPath) {
        return currentNode;
      }

      log(`${++processCounter}) Processing "${currentNode.tag}" from "${componentPath}"`, 'processTree');

      let nextNode = parser(
        readFileSync(componentPath, 'utf8'),
        mergeWith({recognizeSelfClosing: true}, options.parserOptions)
      );

      // Set filled slots
      setFilledSlots(currentNode, filledSlots, options);

      const aware = transform(options.aware, (result, value) => {
        assign(result, value);
      }, {});

      // Reset options.expressions.locals and keep aware locals
      options.expressions.locals = {...options.props, ...aware};

      const {attributes, props} = processProps(currentNode, nextNode, filledSlots, options, componentPath, processCounter);

      options.expressions.locals = attributes;
      options.expressions.locals.$slots = filledSlots;
      // const plugins = [...options.plugins, expressions(options.expressions)];
      nextNode = expressions(options.expressions)(nextNode);

      if (options.plugins.length > 0) {
        nextNode = applyPluginsToTree(nextNode, options.plugins);
      }

      // Process <yield> tag
      const content = match.call(nextNode, {tag: options.yield}, nextNode => {
        // Fill <yield> with current node content or default <yield>
        return currentNode.content || nextNode.content;
      });

      // Process <slot> tags
      processSlotContent(nextNode, filledSlots, options);

      nextNode = processTree(options)(nextNode, messages);

      // Process <fill> tags
      processFillContent(nextNode, filledSlots, options);

      // Remove component tag and replace content with <yield>
      currentNode.tag = false;
      currentNode.content = content;

      processAttributes(currentNode, attributes, props, options, aware);

      /**
       * Remove attributes when value is 'null' or 'undefined' so we can
       * conditionally add an attribute by setting the value to
       * 'undefined' or 'null'.
       */
      walk.call(currentNode, node => {
        if (node?.attrs) {
          for (const key in node.attrs) {
            if (node.attrs[key] === 'undefined' || node.attrs[key] === 'null') {
              delete node.attrs[key];
            }
          }
        }

        return node;
      });

      log(`Done processing number ${processCounter}.`, 'processTree', 'success');

      // Reset options.aware for current processCounter
      delete options.aware[processCounter];

      // Decrement counter
      processCounter--;

      return currentNode;
    });

    if (processCounter === 0) {
      log('End of processing', 'processTree', 'success');
    }

    return tree;
  };
}

function getComponentPath(currentNode, options) {
  const componentFile = currentNode.attrs[options.attribute];

  if (componentFile) {
    const componentPath = path.join(options.root, componentFile);

    if (!existsSync(componentPath)) {
      if (options.strict) {
        throw new Error(`[components] The component was not found in ${componentPath}.`);
      }

      return false;
    }

    // Delete attribute used as path
    delete currentNode.attrs[options.attribute];

    return componentPath;
  }

  return findPathFromTag(currentNode.tag, options);
}

function applyPluginsToTree(tree, plugins) {
  return plugins.reduce((tree, plugin) => {
    tree = plugin(tree);
    return tree;
  }, tree);
}
