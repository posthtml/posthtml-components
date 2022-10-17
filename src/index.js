'use strict';

const fs = require('fs');
const path = require('path');
const {inspect} = require('util');
const {sha256} = require('js-sha256');
const styleToObject = require('style-to-object');
const expressions = require('posthtml-expressions');
const scriptDataLocals = require('posthtml-expressions/lib/locals');
const {parser: parseToPostHtml} = require('posthtml-parser');
const parseAttrs = require('posthtml-attrs-parser');
// const matchHelper = require('posthtml-match-helper');
const {match} = require('posthtml/lib/api');
const merge = require('deepmerge');
const findPathFromTagName = require('./find-path');
// const posthtml = require('posthtml');

const debug = true;

const log = (object, what) => {
  if (debug) {
    console.log(what, inspect(object, false, null, true));
  }
};

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

    options.expressions.locals = {...options.locals, ...options.aware};

    const defaultSlotName = sha256(filePath);
    const slotsLocals = parseSlotsLocals(options.fillTagName, html, node.content, defaultSlotName);
    const {attributes, locals} = parseLocals(options, slotsLocals, node, html);

    options.expressions.locals = attributes;
    options.expressions.locals.$slots = slotsLocals;

    const plugins = [...options.plugins, expressions(options.expressions)];

    const layoutTree = processNodes(applyPluginsToTree(html, plugins), options, messages);

    node.tag = false;
    node.content = mergeSlots(layoutTree, node, options, defaultSlotName);

    parseAttributes(node, attributes, locals, options);

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
 * @param {Object} options - Plugin options
 * @param {Object} slotsLocals - Slot locals
 * @param {Object} tree - PostHTML Node
 * @param {Array} html - PostHTML Tree Nodes
 * @return {Object} - Merged locals and default
 */
function parseLocals(options, slotsLocals, {attrs}, html) {
  let attributes = {...attrs};

  // Handle attributes to be merged with default
  //  only for Array or Objects
  const mergeAttributeWithDefault = [];
  const computedAttributes = [];
  const awareAttributes = [];
  Object.keys(attributes).forEach(attribute => {
    if (attribute.startsWith('merge:')) {
      const newAttributeName = attribute.replace('merge:', '');
      attributes[newAttributeName] = attributes[attribute];
      delete attributes[attribute];
      mergeAttributeWithDefault.push(newAttributeName);
    } else if (attribute.startsWith('computed:')) {
      const newAttributeName = attribute.replace('computed:', '');
      attributes[newAttributeName] = attributes[attribute];
      delete attributes[attribute];
      computedAttributes.push(newAttributeName);
    } else if (attribute.startsWith('aware:')) {
      const newAttributeName = attribute.replace('aware:', '');
      attributes[newAttributeName] = attributes[attribute];
      delete attributes[attribute];
      awareAttributes.push(newAttributeName);
    }
  });

  // Parse JSON attributes
  Object.keys(attributes).forEach(attribute => {
    try {
      // Use merge() ?
      const parsed = JSON.parse(attributes[attribute]);
      if (attribute === 'locals') {
        if (mergeAttributeWithDefault.includes(attribute)) {
          attributes = merge(attributes, parsed);
          mergeAttributeWithDefault.splice(mergeAttributeWithDefault.indexOf('locals'), 1);
        } else {
          Object.assign(attributes, parsed);
        }
      } else {
        attributes[attribute] = parsed;
      }
    } catch {}
  });

  delete attributes.locals;

  // Merge with global
  attributes = merge(options.expressions.locals, attributes);

  // Retrieve default locals from <script props> and merge with attributes
  const {locals} = scriptDataLocals(html, {localsAttr: options.scriptLocalAttribute, removeScriptLocals: true, locals: {...attributes, $slots: slotsLocals}});

  // Merge default locals and attributes
  //  or overrides locals with attributes
  if (locals) {
    if (mergeAttributeWithDefault.length > 0) {
      const attributesToBeMerged = Object.fromEntries(Object.entries(attributes).filter(([attribute]) => mergeAttributeWithDefault.includes(attribute)));
      const localsToBeMerged = Object.fromEntries(Object.entries(locals).filter(([local]) => mergeAttributeWithDefault.includes(local)));
      if (Object.keys(localsToBeMerged).length > 0) {
        mergeAttributeWithDefault.forEach(attribute => {
          attributes[attribute] = merge(localsToBeMerged[attribute], attributesToBeMerged[attribute]);
        });
      }
    }

    Object.keys(locals).forEach(local => {
      if (computedAttributes.includes(local) || typeof attributes[local] === 'undefined') {
        attributes[local] = locals[local];
      }
    });
  }

  if (awareAttributes.length > 0) {
    options.aware = Object.fromEntries(Object.entries(attributes).filter(([attribute]) => awareAttributes.includes(attribute)));
  }

  return {attributes, locals};
}

/**
 * Parse slots locals and set which one is filled
 * @param {String} tag
 * @param html
 * @param {Object} content
 * @param {String} defaultSlotName
 * @return {Object}
 */
function parseSlotsLocals(tag, html, content, defaultSlotName) {
  const slots = {};

  const getNodeName = node => {
    if (!node.attrs) {
      node.attrs = {};
    }

    let {name} = node.attrs;

    if (!name) {
      name = Object.keys({...node.attrs}).find(name => !Object.keys(slotTypes).includes(name) && name !== 'type' && name !== defaultSlotType);

      if (!name) {
        name = defaultSlotName;
      }
    }

    return name;
  };

  match.call(html, {tag}, node => {
    const name = getNodeName(node);

    slots[name] = {
      filled: false
    };

    return node;
  });

  match.call(content, {tag}, node => {
    const name = getNodeName(node);

    const locals = Object.fromEntries(Object.entries(node.attrs).filter(([attribute]) => ![name, 'type'].includes(attribute)));

    if (locals) {
      // Parse JSON locals
      Object.keys(locals).forEach(local => {
        try {
          locals[local] = JSON.parse(locals[local]);
        } catch {}
      });
    }

    slots[name] = {
      filled: true,
      locals
    };

    return node;
  });

  return slots;
}

/**
 * Map component attributes that it's not defined as locals to first element of node
 * @param {Object} node
 * @param {Object} attributes
 * @param {Object} locals
 * @param {Object} options
 * @return {void}
 */
function parseAttributes(node, attributes, locals, options) {
  const index = node.content.findIndex(content => typeof content === 'object');

  if (index !== -1) {
    const nodeAttrs = parseAttrs(node.content[index].attrs, options.attrsParserRules);

    Object.keys(attributes).forEach(attr => {
      if (typeof locals[attr] === 'undefined') {
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
        }
      }
    });

    node.content[index].attrs = nodeAttrs.compose();
  }
}

/**
 * Merge slots content
 * @param {Object} tree
 * @param {Object} node
 * @param {Boolean} strict
 * @param {String} slotTagName
 * @param {String} fillTagName
 * @param {Boolean|String} fallbackSlotTagName
 * @param defaultSlotName
 * @return {Object} tree
 */
function mergeSlots(tree, node, {strict, slotTagName, fillTagName, fallbackSlotTagName}, defaultSlotName) {
  const slots = getSlots(slotTagName, tree, defaultSlotName, fallbackSlotTagName); // Slot in component.html
  const fillSlots = getSlots(fillTagName, node.content, defaultSlotName); // Slot in page.html
  const clean = content => content.replace(/(\n|\t)/g, '').trim();

  // Retrieve main content, means everything that is not inside slots
  if (node.content) {
    const contentOutsideSlots = node.content.filter(content => (content.tag !== fillTagName));
    if (contentOutsideSlots.filter(c => typeof c !== 'string' || clean(c) !== '').length > 0) {
      fillSlots[defaultSlotName] = [{tag: fillTagName, attrs: {name: defaultSlotName}, content: [...contentOutsideSlots]}];
    }

    // Replace <content> with <block>
    //  required only when using extend + module syntax
    if (fallbackSlotTagName && slots[defaultSlotName]) {
      slots[defaultSlotName].map(slot => {
        if (slot.tag === (fallbackSlotTagName === true ? 'content' : fallbackSlotTagName)) {
          slot.tag = slotTagName;
        }

        return slot;
      });
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
 * @param defaultSlotName
 * @param {Boolean|String} fallbackSlotTagName
 * @return {Object}
 */
function getSlots(tag, content, defaultSlotName, fallbackSlotTagName = false) {
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

// function processWithPostHtml(html, options = {}, plugins = []) {
//   return posthtml(plugins)
//     .process(html, options)
//     .then(result => result.tree);
// }

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
      fillTagName: 'slot',
      // Used for compatibility with modules plugin <content> slot, set to true only if you have migrated from modules plugin
      fallbackSlotTagName: false,
      tagName: 'component',
      tagNames: [],
      attribute: 'src',
      attributes: [],
      expressions: {},
      plugins: [],
      encoding: 'utf8',
      scriptLocalAttribute: 'props',
      matcher: [],
      strict: true,
      attrsParserRules: {}
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

  options.locals = {...options.expressions.locals};
  options.aware = {};

  // options.locals.$isUndefined = value => value === void 0

  log(debug, 'Debug enabled?');

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
