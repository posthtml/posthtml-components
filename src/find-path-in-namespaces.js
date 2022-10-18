'use strict';

const path = require('path');
const {existsSync} = require('fs');
const findPathInRoots = require('./find-path-in-roots');

/**
 * Find component file within all defined namespaces path
 *
 * @param  {String} tag [tag name with namespace]
 * @param  {String} namespace [tag's namespace]
 * @param  {String} fileNameFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function findPathInNamespaces(tag, [namespace, fileNameFromTag], options) {
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
  if (customTagNamespace.custom && (existsSync(path.join(customTagNamespace.custom, fileNameFromTag)) || (foundByIndexFile = existsSync(path.join(customTagNamespace.custom, indexFileNameFromTag))))) {
    customTagNamespace.root = customTagNamespace.custom;
    if (foundByIndexFile) {
      fileNameFromTag = indexFileNameFromTag;
    }
    // Then check in defined namespace's or fallback path
  } else if (!existsSync(path.join(customTagNamespace.root, fileNameFromTag))) {
    if (existsSync(path.join(customTagNamespace.root, indexFileNameFromTag))) {
      // Module found in folder `tag-name/index.html`
      fileNameFromTag = indexFileNameFromTag;
    } else if (customTagNamespace.fallback && (existsSync(path.join(customTagNamespace.fallback, fileNameFromTag)) || (foundByIndexFile = existsSync(path.join(customTagNamespace.fallback, indexFileNameFromTag))))) {
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
        return findPathInRoots(tag.replace(namespace, '').replace(options.namespaceSeparator, ''), fileNameFromTag, options);
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

module.exports = (tag, [namespace, fileNameFromTag], options) => findPathInNamespaces(tag, [namespace, fileNameFromTag], options);
