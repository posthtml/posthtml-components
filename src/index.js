'use strict';

const fs = require('fs');
const path = require('path');
const expressions = require('posthtml-expressions');
const {parser: parseToPostHtml} = require('posthtml-parser');
const {match} = require('posthtml/lib/api');
const merge = require('deepmerge');
const findPathFromTagName = require('./find-path');

function processNodes(tree, options, messages) {
  tree = applyPluginsToTree(tree, options.plugins);

  match.call(tree, [{tag: options.tagName}, {tag: options.tagRegExp}], node => {
    if (!node.attrs || !node.attrs.src) {
      const path = findPathFromTagName(node, options);

      if (path !== false) {
        node.attrs.src = path;
      }
    }

    let attributes = {...node.attrs};

    delete attributes.src;

    Object.keys(attributes).forEach(attribute => {
      try {
        attributes = {...attributes, ...JSON.parse(attributes[attribute])};
      } catch {}
    });

    delete attributes.locals;

    options.expressions.locals = merge(options.expressions.locals, attributes);
    const plugins = [...options.plugins, expressions(options.expressions)];

    const layoutPath = path.resolve(options.root, node.attrs.src);
    const layoutHtml = fs.readFileSync(layoutPath, options.encoding);
    const layoutTree = processNodes(applyPluginsToTree(parseToPostHtml(layoutHtml), plugins), options, messages);

    node.tag = false;
    node.content = mergeSlots(layoutTree, node, options.strict, options.slotTagName);

    messages.push({
      type: 'dependency',
      file: layoutPath,
      from: options.from
    });

    return node;
  });

  return tree;
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
    let errors = '';

    for (const fillSlotName of Object.keys(fillSlots)) {
      errors += `Unexpected slot "${fillSlotName}". `;
    }

    if (errors) {
      throw new Error(errors);
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
      throw new Error('Missing slot name');
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
      roots: '/',
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
      strict: false
    },
    ...options
  };

  options.roots = Array.isArray(options.roots) ? options.roots : [options.roots];

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
