'use strict';

const {match} = require('posthtml/lib/api');
const {render} = require('posthtml-render');

/**
 * Set filled slots
 *
 * @param  {Object} currentNode PostHTML tree
 * @param  {Object} filledSlots
 * @param  {Object} options Plugin options
 * @return {void}
 */
function setFilledSlots(currentNode, filledSlots, {fill}) {
  match.call(currentNode, {tag: fill}, fillNode => {
    if (!fillNode.attrs) {
      fillNode.attrs = {};
    }

    const name = fillNode.tag.split(':')[1];

    /** @var {Object} locals - NOT YET TESTED */
    const locals = Object.fromEntries(Object.entries(fillNode.attrs).filter(([attributeName]) => ![name, 'type'].includes(attributeName)));

    if (locals) {
      Object.keys(locals).forEach(local => {
        try {
          locals[local] = JSON.parse(locals[local]);
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
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processFillContent(tree, filledSlots, {fill}) {
  match.call(tree, {tag: fill}, fillNode => {
    const name = fillNode.tag.split(':')[1];

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
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processSlotContent(tree, filledSlots, {slot}) {
  match.call(tree, {tag: slot}, slotNode => {
    const name = slotNode.tag.split(':')[1];

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
