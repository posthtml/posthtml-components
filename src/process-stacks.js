const {match} = require('posthtml/lib/api');
const {render} = require('posthtml-render');
const get = require('lodash/get');

/**
 * Process <push> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {String} push Push tag name
 * @return {Object} tree
 */
function processPushes(tree, content, push) {
  match.call(tree, {tag: push}, pushNode => {
    if (get(pushNode, 'attrs.name') === '') {
      throw new Error(`[components] <${push}> tag requires a value for the "name" attribute.`);
    }

    if (!pushNode.attrs || !pushNode.attrs.name) {
      throw new Error(`[components] <${push}> tag requires a "name" attribute.`);
    }

    if (!content[pushNode.attrs.name]) {
      content[pushNode.attrs.name] = [];
    }

    const pushContent = render(pushNode.content);

    // Review as rendered content is not anymore processable by others plugin
    if (typeof pushNode.attrs.once === 'undefined' || !content[pushNode.attrs.name].includes(pushContent)) {
      if (typeof pushNode.attrs.prepend === 'undefined') {
        content[pushNode.attrs.name].push(pushContent);
      } else {
        content[pushNode.attrs.name].unshift(pushContent);
      }
    }

    pushNode.tag = false;
    pushNode.content = null;

    return pushNode;
  });

  return tree;
}

/**
 * Process <stack> tag
 *
 * @param  {Object} tree PostHTML tree
 * @param  {Object} content Content pushed by stack name
 * @param  {String} stack Stack tag name
 * @return {Object} tree
 */
function processStacks(tree, content, stack) {
  match.call(tree, {tag: stack}, stackNode => {
    stackNode.tag = false;
    stackNode.content = content[stackNode.attrs.name];
    return stackNode;
  });

  return tree;
}

module.exports = {
  processPushes,
  processStacks
};
