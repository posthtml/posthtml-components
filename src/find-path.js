'use strict';

const path = require('path');
const fs = require('fs');

const folderSeparator = '.';

/**
 * Find path from tag name
 *
 * @param  {Object} node [posthtml element object]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean}
 */
function findPathFromTagName(node, options) {
  if (!node.attrs) {
    node.attrs = {};
  }

  const {tag} = node;

  // Get module filename from tag name
  //  remove prefix "x-"
  //  replace dot "." with slash "/"
  //  append file extension
  const fileNameFromTag = tag
    .replace(options.tagPrefix, '')
    .split(folderSeparator)
    .join(path.sep)
    .concat(folderSeparator, options.fileExtension);

  // Find module by defined namespace in options.namespaces
  //  or by defined roots in options.roots
  return tag.includes(options.namespaceSeparator) ?
    findPathByNamespace(tag, fileNameFromTag.split(options.namespaceSeparator), options) :
    findPathByRoot(tag, fileNameFromTag, options);
}

/**
 * Search for module file within namespace path
 *
 * @param  {String} tag [tag name with namespace]
 * @param  {String} namespace [tag's namespace]
 * @param  {String} fileNameFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function findPathByNamespace(tag, [namespace, fileNameFromTag], options) {
  const customTagNamespace = options.namespaces.find(n => n.name === namespace.replace(options.tagPrefix, ''));

  if (!customTagNamespace) {
    if (options.strict) {
      throw new Error(`[components] Unknown module namespace ${namespace}.`);
    } else {
      return false;
    }
  }

  // Used to check module by index.html
  const indexFileNameFromTag = fileNameFromTag
    .replace(`.${options.fileExtension}`, '')
    .concat(path.sep, 'index.', options.fileExtension);

  // First check in defined namespace's custom root if module was overridden
  let foundByIndexFile = false;
  if (customTagNamespace.custom && (fs.existsSync(path.join(customTagNamespace.custom, fileNameFromTag)) || (foundByIndexFile = fs.existsSync(path.join(customTagNamespace.custom, indexFileNameFromTag))))) {
    customTagNamespace.root = customTagNamespace.custom;
    if (foundByIndexFile) {
      fileNameFromTag = indexFileNameFromTag;
    }
    // Then check in defined namespace's or fallback path
  } else if (!fs.existsSync(path.join(customTagNamespace.root, fileNameFromTag))) {
    if (fs.existsSync(path.join(customTagNamespace.root, indexFileNameFromTag))) {
      // Module found in folder `tag-name/index.html`
      fileNameFromTag = indexFileNameFromTag;
    } else if (customTagNamespace.fallback && (fs.existsSync(path.join(customTagNamespace.fallback, fileNameFromTag)) || (foundByIndexFile = fs.existsSync(path.join(customTagNamespace.fallback, indexFileNameFromTag))))) {
      // Module found in defined namespace fallback
      customTagNamespace.root = customTagNamespace.fallback;
      if (foundByIndexFile) {
        fileNameFromTag = indexFileNameFromTag;
      }
    } else if (options.namespaceFallback) {
      // Last resort: try to find module by defined roots as fallback
      try {
        // Passing tag name without namespace, although it's only used
        // for error message which in this case it's not even used.
        // But passing it correctly in case in future we do something
        // with tag name inside findModuleByRoot()
        return findPathByRoot(tag.replace(namespace, '').replace(options.namespaceSeparator, ''), fileNameFromTag, options);
      } catch {
        // With disabled strict mode we will never enter here as findPathByRoot() return false
        //  so we don't need to check if options.strict is true
        throw new Error(`[components] For the tag ${tag} was not found the template in the defined namespace's root ${customTagNamespace.root} nor in any defined custom tag roots.`);
      }
    } else if (options.strict) {
      throw new Error(`[components] For the tag ${tag} was not found the template in the defined namespace's path ${customTagNamespace.root}.`);
    } else {
      return false;
    }
  }

  // Set root to namespace root
  options.root = customTagNamespace.root;
  return fileNameFromTag;
}

/**
 * Search for module file within all roots
 *
 * @param  {String} tag [tag name]
 * @param  {String} fileNameFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function findPathByRoot(tag, fileNameFromTag, options) {
  let root = options.roots.find(root => fs.existsSync(path.join(root, fileNameFromTag)));

  if (!root) {
    // Check if module exist in folder `tag-name/index.html`
    fileNameFromTag = fileNameFromTag
      .replace(`.${options.fileExtension}`, '')
      .concat(path.sep, 'index.', options.fileExtension);

    root = options.roots.find(root => fs.existsSync(path.join(root, fileNameFromTag)));
  }

  if (!root) {
    if (options.strict) {
      throw new Error(`[components] For the tag ${tag} was not found the template in any defined root path ${options.roots.join(', ')}`);
    } else {
      return false;
    }
  }

  return path.join(root, fileNameFromTag);
}

module.exports = (node, options) => findPathFromTagName(node, options);
