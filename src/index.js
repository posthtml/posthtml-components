'use strict';

const fs = require('fs');
const path = require('path');
const expressions = require('posthtml-expressions');
const scriptDataLocals = require('posthtml-expressions/lib/locals');
const {parser: parseToPostHtml} = require('posthtml-parser');
const parseAttrs = require('posthtml-attrs-parser');
// const matchHelper = require('posthtml-match-helper');
const {match} = require('posthtml/lib/api');
const merge = require('deepmerge');
const findPathFromTagName = require('./find-path');

// Used for slot without name
const defaultSlotName = '__default-slot';

const defaultSlotType = 'replace';

const slotTypes = {
  append: 'append',
  prepend: 'prepend'
};

/**
 * Process tree's nodes
 * @param {Object} tree - posthtml tree
 * @param {Object} options - plugin options
 * @param {Object} messages - posthtml tree messages
 */
function processNodes(tree, options, messages) {
  tree = applyPluginsToTree(tree, options.plugins);

  match.call(tree, options.matcher, node => {
    if (!node.attrs) {
      node.attrs = {};
    }

    // For compatibility with extends and modules plugins
    //  we want to support multiple attributes for define path
    const attributePath = (options.attributes.length > 0 && options.attributes.find(attribute => node.attrs[attribute])) || options.attribute;

    let filePath = node.attrs[attributePath] || findPathFromTagName(node, options);

    // Return node as-is when strict mode is disabled
    //  otherwise raise error happen in find-path.js
    if (!filePath) {
      return node;
    }

    delete node.attrs[attributePath];

    filePath = path.resolve(options.root, filePath);

    const html = parseToPostHtml(fs.readFileSync(filePath, options.encoding));

    const {attributes, defaultLocals} = parseLocals(options, node, html);

    options.expressions.locals = attributes;

    options.expressions.locals.slots = getFilledSlotNames(options.slotTagName, node.content);

    const plugins = [...options.plugins, expressions(options.expressions)];

    const layoutTree = processNodes(applyPluginsToTree(html, plugins), options, messages);

    node.tag = false;
    node.content = mergeSlots(layoutTree, node, options.strict, options);

    const index = node.content.findIndex(content => typeof content === 'object');

    if (index !== -1) {
      // Map component attributes that it's not defined
      //  as locals to first element of node
      //  for now only class and style
      const nodeAttrs = parseAttrs(node.content[index].attrs);

      Object.keys(attributes).forEach(attr => {
        if (typeof defaultLocals[attr] === 'undefined') {
          if (['class'].includes(attr)) {
            nodeAttrs[attr].push(attributes[attr]);
          } else if (['style'].includes(attr)) {
            nodeAttrs[attr] = attributes[attr];
          }
        }
      });

      node.content[index].attrs = nodeAttrs.compose();
    }

    messages.push({
      type: 'dependency',
      file: filePath,
      from: options.from
    });

    return node;
  });

  return tree;
}

/**
 * Parse locals from attributes, globals and via script
 * @param {Object} options - plugin options
 * @param {Object} tree - PostHTML Node
 * @param {Array} html - PostHTML Tree Nodes
 * @return {Object} merged locals and default
 */
function parseLocals(options, {attrs}, html) {
  let attributes = {...attrs};

  Object.keys(attributes).forEach(attribute => {
    try {
      // Use merge() ?
      attributes = {...attributes, ...JSON.parse(attributes[attribute])};
    } catch {}
  });

  delete attributes.locals;

  attributes = merge(options.expressions.locals, attributes);

  // Retrieve default locals from <script defaultLocals> and merge with attributes
  const {locals: defaultLocals} = scriptDataLocals(html, {localsAttr: options.scriptLocalAttribute, removeScriptLocals: true, locals: attributes});

  // Merge default locals and attributes
  if (defaultLocals) {
    attributes = merge(defaultLocals, attributes);
  }

  return {attributes, defaultLocals};
}

/**
 * Merge slots content
 * @param {Object} tree
 * @param {Object} node
 * @param {Boolean} strict
 * @param {String} slotTagName
 * @param {Boolean|String} fallbackSlotTagName
 * @return {Object} tree
 */
function mergeSlots(tree, node, strict, {slotTagName, fallbackSlotTagName}) {
  const slots = getSlots(slotTagName, tree, fallbackSlotTagName); // Slot in component.html
  const fillSlots = getSlots(slotTagName, node.content); // Slot in page.html

  // Retrieve main content, means everything that is not inside slots
  if (node.content) {
    const contentOutsideSlots = node.content.filter(content => content.tag !== slotTagName);
    if (contentOutsideSlots.length > 0) {
      fillSlots[defaultSlotName] = [{tag: slotTagName, attrs: {name: defaultSlotName}, content: [...contentOutsideSlots]}];
    }
  }

  for (const slotName of Object.keys(slots)) {
    const fillSlotNodes = fillSlots[slotName];

    if (!fillSlotNodes) {
      continue;
    }

    // Pick up the last block node if multiple blocks are declared in `component` node
    const slotNode = fillSlotNodes[fillSlotNodes.length - 1];

    if (!slotNode) {
      continue;
    }

    if (!slotNode.attrs) {
      slotNode.attrs = {
        type: defaultSlotType
      };
    }

    let slotType = slotTypes[(slotNode.attrs.type || defaultSlotType).toLowerCase()] || defaultSlotType;
    slotType = typeof slotNode.attrs.append === 'undefined' ? (typeof slotNode.attrs.prepend === 'undefined' ? slotType : slotTypes.prepend) : slotTypes.append;

    const layoutBlockNodeList = slots[slotName];
    for (const layoutBlockNode of layoutBlockNodeList) {
      layoutBlockNode.content = mergeContent(
        slotNode.content,
        layoutBlockNode.content,
        slotType
      );
    }

    delete fillSlots[slotName];
  }

  if (strict) {
    const unexpectedSlots = [];

    for (const fillSlotName of Object.keys(fillSlots)) {
      unexpectedSlots.push(fillSlotName);
    }

    if (unexpectedSlots.length > 0) {
      throw new Error(`[components] Unexpected slot: ${unexpectedSlots.join(', ')}.`);
    }
  }

  return tree;
}

/**
 * Prepend, append or replace slot content
 * @param {Object} slotContent
 * @param {Object} defaultContent
 * @param {String} slotType
 * @return {Object}
 */
function mergeContent(slotContent, defaultContent, slotType) {
  slotContent = slotContent || [];
  defaultContent = defaultContent || [];

  // Replace
  if (!Object.keys(slotTypes).includes(slotType)) {
    return slotContent;
  }

  // Prepend or append
  return slotType === slotTypes.prepend ?
    slotContent.concat(defaultContent) :
    defaultContent.concat(slotContent);
}

/**
 * Get all slots from content
 * @param {String} tag
 * @param {Object} content
 * @param {Boolean|String} fallbackSlotTagName
 * @return {Object}
 */
function getSlots(tag, content = [], fallbackSlotTagName = false) {
  const slots = {};

  // For compatibility with module slot name <content>
  const matcher = fallbackSlotTagName === false ? {tag} : [{tag}, {tag: fallbackSlotTagName === true ? 'content' : fallbackSlotTagName}];

  match.call(content, matcher, node => {
    if (!node.attrs) {
      node.attrs = {};
    }

    // When missing name try to retrieve from attribute
    //  so slot name can be shorthands like <slot content> => <slot name="content">
    if (!node.attrs.name) {
      node.attrs.name = Object.keys({...node.attrs}).find(name => !Object.keys(slotTypes).includes(name) && name !== 'type' && name !== defaultSlotType);

      if (!node.attrs.name) {
        node.attrs.name = defaultSlotName;
      }
    }

    const {name} = node.attrs;

    if (!Array.isArray(slots[name])) {
      slots[name] = [];
    }

    slots[name].push(node);

    return node;
  });

  return slots;
}

/**
 * Get all filled slots names so we can
 * pass as locals to check if slot is filled
 * @param {String} tag
 * @param {Object} content
 * @return {Object}
 */
function getFilledSlotNames(tag, content = []) {
  const slotNames = [];

  match.call(content, {tag}, node => {
    let name = node.attrs && node.attrs.name;

    if (!name) {
      name = Object.keys({...node.attrs}).find(name => !Object.keys(slotTypes).includes(name) && name !== 'type' && name !== defaultSlotType);

      if (!name) {
        name = defaultSlotName;
      }
    }

    slotNames[name] = true;

    return node;
  });

  return slotNames;
}

/**
 * Apply plugins to tree
 * @param {Object} tree
 * @param {Array} plugins
 * @return {Object}
 */
function applyPluginsToTree(tree, plugins) {
  return plugins.reduce((tree, plugin) => {
    tree = plugin(tree);
    return tree;
  }, tree);
}

module.exports = (options = {}) => {
  options = {
    ...{
      root: './',
      roots: '',
      namespaces: [], // Array of namespaces path or single namespaces as object
      namespaceSeparator: '::',
      namespaceFallback: false,
      fileExtension: 'html',
      tagPrefix: 'x-',
      tagRegExp: new RegExp(`^${options.tagPrefix || 'x-'}`, 'i'),
      slotTagName: 'slot',
      // Used for compatibility with modules plugin <content> slot, set to true only if you have migrated from modules plugin
      fallbackSlotTagName: false,
      tagName: 'component',
      tagNames: [],
      attribute: 'src',
      attributes: [],
      expressions: {},
      plugins: [],
      encoding: 'utf8',
      scriptLocalAttribute: 'defaultLocals',
      matcher: [],
      strict: true
    },
    ...options
  };

  /** Set root, roots and namespace's roots */
  options.root = path.resolve(options.root);

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

  if (!Array.isArray(options.attributes)) {
    options.attributes = [];
  }

  if (!Array.isArray(options.matcher)) {
    options.matcher = options.matcher ? [options.matcher] : [];
  }

  if (!Array.isArray(options.tagNames)) {
    options.tagNames = [];
  }

  /** Set one or multiple matcher */
  if (options.matcher.length === 0) {
    if (options.tagRegExp) {
      options.matcher.push({tag: options.tagRegExp});
    }

    if (options.tagNames.length > 0) {
      options.tagNames.forEach(tagName => {
        options.matcher.push({tag: tagName});
      });
    } else if (options.tagName) {
      options.matcher.push({tag: options.tagName});
    }

    if (options.matcher.length === 0) {
      throw new Error('[components] No matcher found in options. Please to define almost one.');
    }
  }

  return function (tree) {
    tree = processNodes(tree, options, tree.messages);

    const slots = getSlots(options.slotTagName, tree, options.fallbackSlotTagName);

    for (const slotName of Object.keys(slots)) {
      const nodes = slots[slotName];

      for (const node of nodes) {
        node.tag = false;
        node.content = node.content || [];
      }

      slots[slotName] = nodes;
    }

    return tree;
  };
};
