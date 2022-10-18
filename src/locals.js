'use strict';

const merge = require('deepmerge');
const scriptDataLocals = require('posthtml-expressions/lib/locals');

/**
 * Parse locals from attributes, globals and via script
 *
 * @param {Object} currentNode - PostHTML tree
 * @param {Array} nextNode - PostHTML tree
 * @param {Object} slotContent - Slot locals
 * @param {Object} options - Plugin options
 * @return {Object} - Attribute locals and script locals
 */
module.exports = (currentNode, nextNode, slotContent, options) => {
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
        attributes[newAttributeName] = attributes[attributeName];
        delete attributes[attributeName];
        merged.push(newAttributeName);
        break;

      case attributeName.startsWith('computed:'):
        attributes[newAttributeName] = attributes[attributeName];
        delete attributes[attributeName];
        computed.push(newAttributeName);
        break;

      case attributeName.startsWith('aware:'):
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

  return {attributes, locals};
};
