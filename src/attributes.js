'use strict';

const parseAttrs = require('posthtml-attrs-parser');
const styleToObject = require('style-to-object');

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
  // Find by attribute 'attributes' ??
  const index = currentNode.content.findIndex(content => typeof content === 'object');

  if (index === -1) {
    return;
  }

  const nodeAttrs = parseAttrs(currentNode.content[index].attrs, options.attrsParserRules);

  Object.keys(attributes).forEach(attr => {
    if (typeof locals[attr] === 'undefined' && !attr.startsWith('$') && attr !== options.attribute && !Object.keys(options.aware).includes(attr) && !Object.keys(options.locals).includes(attr)) {
      if (['class'].includes(attr)) {
        if (typeof nodeAttrs.class === 'undefined') {
          nodeAttrs.class = [];
        }

        nodeAttrs.class.push(attributes.class);
        delete attributes.class;
      } else if (['override:class'].includes(attr)) {
        nodeAttrs.class = attributes['override:class'];
        delete attributes['override:class'];
      } else if (['style'].includes(attr)) {
        if (typeof nodeAttrs.style === 'undefined') {
          nodeAttrs.style = {};
        }

        nodeAttrs.style = Object.assign(nodeAttrs.style, styleToObject(attributes.style));
        delete attributes.style;
      } else if (['override:style'].includes(attr)) {
        nodeAttrs.style = attributes['override:style'];
        delete attributes['override:style'];
      } else {
        nodeAttrs[attr] = attributes[attr];
        delete attributes[attr];
      }
    }
  });

  currentNode.content[index].attrs = nodeAttrs.compose();
};
