'use strict';

const path = require('path');
const findPathInRoots = require('./find-path-in-roots');
const findPathInNamespaces = require('./find-path-in-namespaces');

const folderSeparator = '.';

/**
 * Find path from tag name
 *
 * @param  {Object} node [posthtml element object]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean}
 */
module.exports = ({tag}, options) => {
  // Get module filename from tag name
  //  remove prefix "x-"
  //  replace dot "." with slash "/"
  //  append file extension
  const fileNameFromTag = tag
    .replace(options.tagPrefix, '')
    .split(folderSeparator)
    .join(path.sep)
    .concat(folderSeparator, options.fileExtension);

  // Find module by defined namespace in options.namespaces when tag has '::'
  //  otherwise by defined roots in options.roots
  return tag.includes(options.namespaceSeparator) ?
    findPathInNamespaces(tag, fileNameFromTag.split(options.namespaceSeparator), options) :
    findPathInRoots(tag, fileNameFromTag, options);
};
