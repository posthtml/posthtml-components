'use strict';

const path = require('path');
const {existsSync} = require('fs');

/**
 * Find component file within all defined roots path
 *
 * @param  {String} tag [tag name]
 * @param  {String} fileNameFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function findPathInRoots(tag, fileNameFromTag, options) {
  let root = options.roots.find(root => existsSync(path.resolve(root, fileNameFromTag)));

  if (!root) {
    // Check if module exist in folder `tag-name/index.html`
    fileNameFromTag = fileNameFromTag
      .replace(`.${options.fileExtension}`, '')
      .concat(path.sep, 'index.', options.fileExtension);

    root = options.roots.find(root => existsSync(path.resolve(root, fileNameFromTag)));
  }

  if (!root) {
    if (options.strict) {
      throw new Error(`[components] For the tag ${tag} was not found the template in any defined root path ${options.roots.join(', ')}`);
    } else {
      return false;
    }
  }

  return path.resolve(root, fileNameFromTag);
}

module.exports = (tag, fileNameFromTag, options) => findPathInRoots(tag, fileNameFromTag, options);
