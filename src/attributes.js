'use strict';

const {match} = require('posthtml/lib/api');
const parseAttrs = require('posthtml-attrs-parser');
const styleToObject = require('style-to-object');
const omit = require('lodash/omit');
const keys = require('lodash/keys');
const union = require('lodash/union');
const each = require('lodash/each');
const has = require('lodash/has');
const extend = require('lodash/extend');

/**
 * Map component attributes that it's not defined as locals to first element of node
 *
 * @param {Object} currentNode
 * @param {Object} attributes
 * @param {Object} locals
 * @param {Object} options
 * @return {void}
 */
module.exports = (currentNode, attributes, locals, options) => {
  let mainNode;
  match.call(currentNode, {attrs: {attributes: ''}}, node => {
    delete node.attrs.attributes;
    mainNode = node;

    return node;
  });

  if (!mainNode) {
    const index = currentNode.content.findIndex(content => typeof content === 'object');

    if (index === -1) {
      return;
    }

    mainNode = currentNode.content[index];
  }

  const nodeAttrs = parseAttrs(mainNode.attrs, options.attrsParserRules);

  const mainNodeAttributes = omit(attributes, union(keys(locals), [options.attribute], keys(options.aware), keys(options.locals), ['$slots']));

  each(mainNodeAttributes, (value, key) => {
    if (['class', 'style'].includes(key)) {
      if (!has(nodeAttrs, key)) {
        nodeAttrs[key] = key === 'class' ? [] : {};
      }

      if (key === 'class') {
        nodeAttrs.class.push(attributes.class);
      } else {
        nodeAttrs.style = extend(nodeAttrs.style, styleToObject(attributes.style));
      }
    } else {
      nodeAttrs[key.replace('override:', '')] = attributes[key];
    }

    delete attributes[key];
  });

  mainNode.attrs = nodeAttrs.compose();
};
