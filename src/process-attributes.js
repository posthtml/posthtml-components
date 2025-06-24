const {match} = require('posthtml/lib/api');
const parseAttrs = require('posthtml-attrs-parser');
const styleToObject = require('style-to-object').default;
const validAttributes = require('./valid-attributes');
const keys = require('lodash/keys');
const union = require('lodash/union');
const pick = require('lodash/pick');
const difference = require('lodash/difference');
const has = require('lodash/has');
const extend = require('lodash/extend');
const isString = require('lodash/isString');
const isObject = require('lodash/isObject');
const isEmpty = require('lodash/isEmpty');

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

  // Merge elementAttributes and blocklistAttributes with options provided
  validAttributes.blocklistAttributes = union(validAttributes.blocklistAttributes, options.blocklistAttributes);
  validAttributes.safelistAttributes = union(validAttributes.safelistAttributes, options.safelistAttributes);

  // Merge or override elementAttributes from options provided
  if (!isEmpty(options.elementAttributes)) {
    for (const tagName in options.elementAttributes) {
      const modifier = options.elementAttributes[tagName];
      if (typeof modifier === 'function' && isString(tagName)) {
        const upperTagName = tagName.toUpperCase();
        const attributes = modifier(validAttributes.elementAttributes[upperTagName]);
        if (Array.isArray(attributes)) {
          validAttributes.elementAttributes[upperTagName] = attributes;
        }
      }
    }
  }

  // Attributes to be excluded
  const excludeAttributes = union(validAttributes.blocklistAttributes, keys(props), keys(aware), keys(options.props), ['$slots']);
  // All valid HTML attributes for the main element
  const allValidElementAttributes = isString(mainNode.tag) && has(validAttributes.elementAttributes, mainNode.tag.toUpperCase()) ? validAttributes.elementAttributes[mainNode.tag.toUpperCase()] : [];
  // Valid HTML attributes without the excluded
  const validElementAttributes = difference(allValidElementAttributes, excludeAttributes);
  // Add override attributes
  validElementAttributes.push('override:style');
  validElementAttributes.push('override:class');
  // Pick valid attributes from passed
  const mainNodeAttributes = pick(attributes, validElementAttributes);

  // Get additional specified attributes
  for (const attr in attributes) {
    for (const additionalAttr of validAttributes.safelistAttributes) {
      if (
        additionalAttr === attr
        || (additionalAttr.endsWith('*') && attr.startsWith(additionalAttr.replace('*', '')))
      ) {
        mainNodeAttributes[attr] = attributes[attr];
      }
    }
  }

  for (const key in mainNodeAttributes) {
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
  }

  // The plugin posthtml-attrs-parser compose() method expects a string,
  //  but since we are JSON parsing, values like "-1" become number -1.
  //  So below we convert non string values to string.
  for (const key in nodeAttrs) {
    if (key !== 'compose' && !isObject(nodeAttrs[key]) && !isString(nodeAttrs[key])) {
      nodeAttrs[key] = nodeAttrs[key].toString();
    }
  }

  mainNode.attrs = nodeAttrs.compose();
};
