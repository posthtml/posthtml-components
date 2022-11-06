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
const isString = require('lodash/isString');
const isObject = require('lodash/isObject');

/**
 * Map component attributes that it's not defined as props to first element of node
 *
 * @param {Object} currentNode
 * @param {Object} attributes
 * @param {Object} props
 * @param {Object} options
 * @param {Object} aware
 * @return {void}
 */
module.exports = (currentNode, attributes, props, options, aware) => {
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

  const mainNodeAttributes = omit(attributes, union(keys(props), [options.attribute], keys(aware), keys(options.props), ['$slots']));

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

  // The plugin posthtml-attrs-parser compose() method expects a string,
  //  but since we are JSON parsing, values like "-1" become number -1.
  //  So below we convert non string values to string.
  each(nodeAttrs, (value, key) => {
    if (key !== 'compose' && !isObject(nodeAttrs[key]) && !isString(nodeAttrs[key])) {
      nodeAttrs[key] = nodeAttrs[key].toString();
    }
  });

  mainNode.attrs = nodeAttrs.compose();
};
