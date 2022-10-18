'use strict';

const {match} = require('posthtml/lib/api');
const {render} = require('posthtml-render');

/**
 * Set filled slots
 *
 * @param  {Object} currentNode PostHTML tree
 * @param  {Object} slots
 * @param  {Object} options Plugin options
 * @return {void}
 */
function setFilledSlots(currentNode, slots, {slot}) {
  match.call(currentNode, {tag: slot}, fillNode => {
    if (!fillNode.attrs) {
      fillNode.attrs = {};
    }

    const name = fillNode.tag.split(':')[1];

    /** @var {Object} locals */
    const locals = Object.fromEntries(Object.entries(fillNode.attrs).filter(([attributeName]) => ![name, 'type'].includes(attributeName)));

    if (locals) {
      Object.keys(locals).forEach(local => {
        try {
          locals[local] = JSON.parse(locals[local]);
        } catch {}
      });
    }

    slots[name] = {
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
 * Process <slot> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processSlotContent(tree, content, {slot}) {
  match.call(tree, {tag: slot}, slotNode => {
    const name = slotNode.tag.split(':')[1];

    if (!content[name]) {
      content[name] = {};
    }

    content[name].tag = slotNode.tag;
    content[name].attrs = slotNode.attrs;
    content[name].content = slotNode.content;
    content[name].source = render(slotNode.content);
    content[name].rendered = false;

    slotNode.tag = false;
    slotNode.content = null;

    return slotNode;
  });
}

/**
 * Process <fill> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {Object} options Plugin options
 * @return {void}
 */
function processFillContent(tree, content, {fill}) {
  match.call(tree, {tag: fill}, fillNode => {
    const name = fillNode.tag.split(':')[1];

    fillNode.tag = false;

    if (content[name]?.rendered) {
      fillNode.content = null;
    } else if (fillNode.content && content[name]?.attrs && (typeof content[name]?.attrs.append !== 'undefined' || typeof content[name]?.attrs.prepend !== 'undefined')) {
      fillNode.content = typeof content[name]?.attrs.append === 'undefined' ? content[name]?.content.concat(fillNode.content) : fillNode.content.concat(content[name]?.content);
    } else {
      fillNode.content = content[name]?.content;
    }

    // Set rendered to true so a slot can be output only once,
    //  when not present "aware" attribute
    if (content[name] && (!content[name]?.attrs || typeof content[name].attrs.aware === 'undefined')) {
      content[name].rendered = true;
    }

    return fillNode;
  });
}

module.exports = {
  setFilledSlots,
  processSlotContent,
  processFillContent
};
