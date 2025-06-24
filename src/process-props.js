const pick = require('lodash/pick');
const assign = require('lodash/assign');
const mergeWith = require('lodash/mergeWith');
const processScript = require('./process-script');

const attributeTypes = ['aware', 'merge'];

/**
 * Parse props from attributes, globals and via script
 *
 * @param {Object} currentNode - PostHTML tree
 * @param {Array} nextNode - PostHTML tree
 * @param {Object} filledSlots - Filled slots
 * @param {Object} options - Plugin options
 * @param {string} componentPath - Component path
 * @param {number} processCounter
 * @return {Object} - Attribute props and script props
 */
module.exports = (currentNode, nextNode, filledSlots, options, componentPath, processCounter) => {
  let attributes = {...currentNode.attrs};

  const attributesByTypeName = {};
  for (const type of attributeTypes) {
    attributesByTypeName[type] = [];
  }

  for (const key in attributes) {
    let newKey = key;
    for (const type of attributeTypes) {
      if (key.startsWith(`${type}:`)) {
        newKey = newKey.replace(`${type}:`, '');
        attributesByTypeName[type].push(newKey);
      }
    }

    if (newKey !== key) {
      attributes[newKey] = attributes[key];
      delete attributes[key];
    }
  }

  // Parse JSON attributes
  for (const key in attributes) {
    try {
      attributes[key] = JSON.parse(attributes[key]);
    } catch {}
  }

  // Merge or extend attribute props
  if (attributes[options.propsAttribute]) {
    if (attributesByTypeName.merge.includes(options.propsAttribute)) {
      attributesByTypeName.merge.splice(attributesByTypeName.merge.indexOf(options.propsAttribute), 1);
      mergeWith(attributes, attributes[options.propsAttribute], options.mergeCustomizer);
    } else {
      assign(attributes, attributes[options.propsAttribute]);
    }

    delete attributes[options.propsAttribute];
  }

  // Merge with global
  attributes = mergeWith({}, options.expressions.locals, attributes, options.mergeCustomizer);

  // Process props from <script props>
  const {props} = processScript(
    nextNode,
    {
      props: {...attributes},
      $slots: filledSlots,
      propsScriptAttribute: options.propsScriptAttribute,
      propsContext: options.propsContext,
      utilities: options.utilities
    },
    componentPath.replace(`.${options.fileExtension}`, '.js')
  );

  if (props) {
    assign(attributes, props);
    // if (attributesByTypeName.merge.length > 0) {
    //   assign(attributes, mergeWith(pick(locals, attributesByTypeName.merge), pick(attributes, attributesByTypeName.merge), options.mergeCustomizer));
    // }
  }

  // Set aware attributes
  if (attributesByTypeName.aware.length > 0) {
    options.aware[processCounter] = pick(attributes, attributesByTypeName.aware);
  }

  return {attributes, props};
};
