// const {match} = require('posthtml/lib/api');
import { match } from 'posthtml/lib/api'
// const parseAttrs = require('posthtml-attrs-parser');
import parseAttrs from 'posthtml-attrs-parser'
// const styleToObject = require('style-to-object').default;
import styleToObject from 'style-to-object'
// const validAttributes = require('./valid-attributes');
import validAttributes from './valid-attributes.js'
// const keys = require('lodash/keys');
// const union = require('lodash/union');
// const pick = require('lodash/pick');
// const difference = require('lodash/difference');
// const each = require('lodash/each');
// const has = require('lodash/has');
// const extend = require('lodash/extend');
// const isString = require('lodash/isString');
// const isObject = require('lodash/isObject');
// const isEmpty = require('lodash/isEmpty');
import keys from 'lodash-es/keys'
import union from 'lodash-es/union'
import pick from 'lodash-es/pick'
import difference from 'lodash-es/difference'
import each from 'lodash-es/each'
import has from 'lodash-es/has'
import extend from 'lodash-es/extend'
import isString from 'lodash-es/isString'
import isObject from 'lodash-es/isObject'
import isEmpty from 'lodash-es/isEmpty'

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
export default function processAttributes(currentNode, attributes, props, options, aware) {
  let mainNode

  match.call(currentNode, {attrs: {attributes: ''}}, node => {
    delete node.attrs.attributes
    mainNode = node

    return node
  })

  if (!mainNode) {
    const index = currentNode.content.findIndex(content => typeof content === 'object')

    if (index === -1) {
      return
    }

    mainNode = currentNode.content[index]
  }

  const nodeAttrs = parseAttrs(mainNode.attrs, options.attrsParserRules)

  // Merge elementAttributes and blacklistAttributes with options provided
  validAttributes.blacklistAttributes = union(validAttributes.blacklistAttributes, options.blacklistAttributes)
  validAttributes.safelistAttributes = union(validAttributes.safelistAttributes, options.safelistAttributes)

  // Merge or override elementAttributes from options provided
  if (!isEmpty(options.elementAttributes)) {
    each(options.elementAttributes, (modifier, tagName) => {
      if (typeof modifier === 'function' && isString(tagName)) {
        tagName = tagName.toUpperCase()
        const attributes = modifier(validAttributes.elementAttributes[tagName])
        if (Array.isArray(attributes)) {
          validAttributes.elementAttributes[tagName] = attributes
        }
      }
    })
  }

  // Attributes to be excluded
  const excludeAttributes = union(
    validAttributes.blacklistAttributes,
    keys(props),
    keys(aware),
    keys(options.props),
    ['$slots']
  )

  // All valid HTML attributes for the main element
  const allValidElementAttributes = isString(mainNode.tag) && has(validAttributes.elementAttributes, mainNode.tag.toUpperCase())
    ? validAttributes.elementAttributes[mainNode.tag.toUpperCase()]
    : []

  // Valid HTML attributes without the excluded
  const validElementAttributes = difference(allValidElementAttributes, excludeAttributes)

  // Add override attributes
  validElementAttributes.push('override:style')
  validElementAttributes.push('override:class')

  // Pick valid attributes from passed
  const mainNodeAttributes = pick(attributes, validElementAttributes)

  // Get additional specified attributes
  each(attributes, (value, attr) => {
    each(validAttributes.safelistAttributes, additionalAttr => {
      if (additionalAttr === attr || (additionalAttr.endsWith('*') && attr.startsWith(additionalAttr.replace('*', '')))) {
        mainNodeAttributes[attr] = value
      }
    })
  })

  each(mainNodeAttributes, (value, key) => {
    if (['class', 'style'].includes(key)) {
      if (!has(nodeAttrs, key)) {
        nodeAttrs[key] = key === 'class' ? [] : {}
      }

      if (key === 'class') {
        nodeAttrs.class.push(attributes.class)
      } else {
        nodeAttrs.style = extend(nodeAttrs.style, styleToObject(attributes.style))
      }
    } else {
      nodeAttrs[key.replace('override:', '')] = attributes[key]
    }

    delete attributes[key]
  })

  // The plugin posthtml-attrs-parser compose() method expects a string,
  //  but since we are JSON parsing, values like "-1" become number -1.
  //  So below we convert non string values to string.
  each(nodeAttrs, (value, key) => {
    if (key !== 'compose' && !isObject(nodeAttrs[key]) && !isString(nodeAttrs[key])) {
      nodeAttrs[key] = nodeAttrs[key].toString()
    }
  })

  mainNode.attrs = nodeAttrs.compose()
}
