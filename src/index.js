'use strict';

const fs = require('fs');
const path = require('path');
const expressions = require('posthtml-expressions');
const scriptDataLocals = require('posthtml-expressions/lib/locals');
const {parser: parseToPostHtml} = require('posthtml-parser');
const parseAttrs = require('posthtml-attrs-parser');
const {match} = require('posthtml/lib/api');
const merge = require('deepmerge');
const findPathFromTagName = require('./find-path');

function processNodes(tree, options, messages) {
  tree = applyPluginsToTree(tree, options.plugins);

  match.call(tree, [{tag: options.tagName}, {tag: options.tagRegExp}], node => {
    if (!node.attrs) {
      node.attrs = {};
    }

    const filePath = node.attrs.src || findPathFromTagName(node, options);

    // Return node as-is when strict mode is disabled
    //  otherwise raise error happen in find-path.js
    if (!filePath) {
      return node;
    }

    delete node.attrs.src;

    const layoutPath = path.resolve(options.root, filePath);

    const html = parseToPostHtml(fs.readFileSync(layoutPath, options.encoding));

    const {attributes, defaultLocals} = parseLocals(options, node, html);

    options.expressions.locals = attributes;

    const plugins = [...options.plugins, expressions(options.expressions)];

    const layoutTree = processNodes(applyPluginsToTree(html, plugins), options, messages);

    node.tag = false;
    node.content = mergeSlots(layoutTree, node, options.strict, options.slotTagName);

    const index = node.content.findIndex(content => typeof content === 'object');

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

    messages.push({
      type: 'dependency',
      file: layoutPath,
      from: options.from
    });

    return node;
  });

  return tree;
}

function parseLocals(options, {attrs}, html) {
  let attributes = {...attrs};

  Object.keys(attributes).forEach(attribute => {
    try {
      // Use merge()
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

function mergeSlots(tree, component, strict, slotTagName) {
  const slots = getSlots(slotTagName, tree); // Slot in component.html
  const fillSlots = getSlots(slotTagName, component.content); // Slot in page.html

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

    const slotType = ['replace', 'prepend', 'append'].includes(((slotNode.attrs && slotNode.attrs.type) || '').toLowerCase()) ?
      ((slotNode.attrs && slotNode.attrs.type) || '').toLowerCase() :
      'replace';

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

function mergeContent(slotContent, defaultContent, slotType) {
  slotContent = slotContent || [];
  defaultContent = defaultContent || [];

  if (!['append', 'prepend'].includes(slotType)) {
    return slotContent;
  }

  return slotType === 'prepend' ?
    slotContent.concat(defaultContent) :
    defaultContent.concat(slotContent);
}

function getSlots(tag, content = []) {
  const slots = {};

  match.call(content, {tag}, node => {
    if (!node.attrs || !node.attrs.name) {
      throw new Error('[components] Missing slot name');
    }

    const {name} = node.attrs;

    if (Array.isArray(slots[name])) {
      slots[name].push(node);
    } else {
      slots[name] = [node];
    }

    return node;
  });

  return slots;
}

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
      tagName: 'component',
      locals: {},
      expressions: {},
      plugins: [],
      encoding: 'utf8',
      strict: true,
      scriptLocalAttribute: 'defaultLocals'
    },
    ...options
  };

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

  return function (tree) {
    tree = processNodes(tree, options, tree.messages);

    const slots = getSlots(options.slotTagName, tree);

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
