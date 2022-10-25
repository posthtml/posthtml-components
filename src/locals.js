'use strict';

const scriptDataLocals = require('posthtml-expressions/lib/locals');
const pick = require('lodash/pick');
const keys = require('lodash/keys');
const defaults = require('lodash/defaults');
const each = require('lodash/each');
const extend = require('lodash/extend');
const mergeWith = require('lodash/mergeWith');

const attributeTypes = ['merge', 'computed', 'aware'];

/**
 * Parse locals from attributes, globals and via script
 *
 * @param {Object} currentNode - PostHTML tree
 * @param {Array} nextNode - PostHTML tree
 * @param {Object} filledSlots - Slot locals
 * @param {Object} options - Plugin options
 * @return {Object} - Attribute locals and script locals
 */
module.exports = (currentNode, nextNode, filledSlots, options) => {
  let attributes = {...currentNode.attrs};

  const attributesByTypeName = {};
  each(attributeTypes, type => {
    attributesByTypeName[type] = [];
  });

  each(attributes, (value, key, attrs) => {
    let newKey = key;
    each(attributeTypes, type => {
      if (key.startsWith(`${type}:`)) {
        newKey = newKey.replace(`${type}:`, '');
        attributesByTypeName[type].push(newKey);
      }
    });

    if (newKey !== key) {
      attrs[newKey] = value;
      delete attrs[key];
    }
  });

  // Parse JSON attributes
  each(attributes, (value, key, attrs) => {
    try {
      attrs[key] = JSON.parse(value);
    } catch {}
  });

  // Merge or extend attribute locals
  if (attributes.locals) {
    if (attributesByTypeName.merge.includes('locals')) {
      attributesByTypeName.merge.splice(attributesByTypeName.merge.indexOf('locals'), 1);
      mergeWith(attributes, attributes.locals, options.mergeCustomizer);
    } else {
      extend(attributes, attributes.locals);
    }

    delete attributes.locals;
  }

  // Merge with global
  attributes = mergeWith(options.expressions.locals, attributes, options.mergeCustomizer);

  // There is no way to know here what are locals
  //  and what attributes passed to component

  // Convert attribute names to camelCase
  // each(attributes, (value, key, attrs) => {
  //   attrs[camelCase(key)] = value;
  // });

  // Retrieve default locals from <script props> and merge with attributes
  const {locals} = scriptDataLocals(nextNode, {localsAttr: options.localsAttr, removeScriptLocals: true, locals: {...attributes, $slots: filledSlots}});

  if (locals) {
    // Merge attributes
    if (attributesByTypeName.merge.length > 0) {
      extend(attributes, mergeWith(pick(locals, attributesByTypeName.merge), pick(attributes, attributesByTypeName.merge), options.mergeCustomizer));
    }

    // Override attributes with computed locals
    if (attributesByTypeName.computed.length > 0) {
      extend(attributes, pick(locals, keys(pick(attributes, attributesByTypeName.computed))));
    }

    // Set attributes not defined
    defaults(attributes, locals);
  }

  // Set aware attributes
  if (attributesByTypeName.aware.length > 0) {
    options.aware = pick(attributes, attributesByTypeName.aware);
  }

  return {attributes, locals};
};
