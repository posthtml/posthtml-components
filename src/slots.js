'use strict';

const {match} = require('posthtml/lib/api');
const {render} = require('posthtml-render');
const {each, omit} = require('underscore');

/**
 * Set filled slots
 *
 * @param  {Object} currentNode PostHTML tree
 * @param  {Object} filledSlots
 * @param  {String} fill Fill tag name
 * @param  {String} slotSeparator Slot separator
 * @return {void}
 */
function setFilledSlots(currentNode, filledSlots, {fill, slotSeparator}) {
  match.call(currentNode, {tag: fill}, fillNode => {
    if (!fillNode.attrs) {
      fillNode.attrs = {};
    }

    const name = fillNode.tag.split(slotSeparator)[1];

    const locals = omit(fillNode.attrs, [name, 'type', 'append', 'prepend', 'aware']);

    if (locals) {
      each(locals, (value, key, attrs) => {
        try {
          attrs[key] = JSON.parse(value);
        } catch {}
      });
    }

    filledSlots[name] = {
      filled: true,
      rendered: false,
      tag: fillNode.tag,
      attrs: fillNode.attrs,
      content: fillNode.content,
      source: render(fillNode.content),
      locals
    };

    return fillNode;
  });
}

/**
 * Process <fill> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} filledSlots Filled slots content
 * @param  {String} fill Fill tag name
 * @param  {String} slotSeparator Slot separator
 * @return {void}
 */
function processFillContent(tree, filledSlots, {fill, slotSeparator}) {
  match.call(tree, {tag: fill}, fillNode => {
    const name = fillNode.tag.split(slotSeparator)[1];

    if (!filledSlots[name]) {
      filledSlots[name] = {};
    }

    filledSlots[name].tag = fillNode.tag;
    filledSlots[name].attrs = fillNode.attrs;
    filledSlots[name].content = fillNode.content;
    filledSlots[name].source = render(fillNode.content);
    filledSlots[name].rendered = false;

    fillNode.tag = false;
    fillNode.content = null;

    return fillNode;
  });
}

/**
 * Process <slot> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} filledSlots Filled slots content
 * @param  {String} slot Slot tag name
 * @param  {String} slotSeparator Slot separator
 * @return {void}
 */
function processSlotContent(tree, filledSlots, {slot, slotSeparator}) {
  match.call(tree, {tag: slot}, slotNode => {
    const name = slotNode.tag.split(slotSeparator)[1];

    slotNode.tag = false;

    if (filledSlots[name]?.rendered) {
      slotNode.content = null;
    } else if (slotNode.content && filledSlots[name]?.attrs && (typeof filledSlots[name]?.attrs.append !== 'undefined' || typeof filledSlots[name]?.attrs.prepend !== 'undefined')) {
      slotNode.content = typeof filledSlots[name]?.attrs.append === 'undefined' ? filledSlots[name]?.content.concat(slotNode.content) : slotNode.content.concat(filledSlots[name]?.content);
    } else {
      slotNode.content = filledSlots[name]?.content;
    }

    // Set rendered to true so a slot can be output only once,
    //  when not present "aware" attribute
    if (filledSlots[name] && (!filledSlots[name]?.attrs || typeof filledSlots[name].attrs.aware === 'undefined')) {
      filledSlots[name].rendered = true;
    }

    return slotNode;
  });
}

module.exports = {
  setFilledSlots,
  processFillContent,
  processSlotContent
};
