'use strict';

const path = require('path');
const {existsSync} = require('fs');

const folderSeparator = '.';

/**
 * Find component path from tag name
 *
 * @param  {String} tag Tag name
 * @param  {Object} options Plugin options
 * @return {String|boolean} Full path or boolean false
 */
module.exports = (tag, options) => {
  const fileNameFromTag = tag
    .replace(options.tagPrefix, '')
    .split(folderSeparator)
    .join(path.sep)
    .concat(folderSeparator, options.fileExtension);

  try {
    return tag.includes(options.namespaceSeparator) ?
      searchInNamespaces(tag, fileNameFromTag.split(options.namespaceSeparator), options) :
      searchInFolders(tag, fileNameFromTag, options);
  } catch (error) {
    if (options.strict) {
      throw new Error(error.message);
    }
  }

  return false;
};

/**
 * Search component file in root
 *
 * @param  {String} tag [tag name]
 * @param  {String} fileNameFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function searchInFolders(tag, fileNameFromTag, options) {
  const componentPath = search(options.root, options.folders, fileNameFromTag, options.fileExtension);

  if (!componentPath) {
    throw new Error(`[components] For the tag ${tag} was not found any template in defined root path ${options.folders.join(', ')}`);
  }

  return componentPath;
}

/**
 * Search component file within all defined namespaces
 *
 * @param  {String} tag [tag name with namespace]
 * @param  {String} namespace [tag's namespace]
 * @param  {String} fileNameFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function searchInNamespaces(tag, [namespace, fileNameFromTag], options) {
  const namespaceOption = options.namespaces.find(n => n.name === namespace.replace(options.tagPrefix, ''));

  if (!namespaceOption) {
    throw new Error(`[components] Unknown component namespace ${namespace}.`);
  }

  let componentPath;

  // 1) Check in custom root
  if (namespaceOption.custom) {
    componentPath = search(namespaceOption.custom, options.folders, fileNameFromTag, options.fileExtension);
  }

  // 2) Check in base root
  if (!componentPath) {
    componentPath = search(namespaceOption.root, options.folders, fileNameFromTag, options.fileExtension);
  }

  // 3) Check in fallback root
  if (!componentPath && namespaceOption.fallback) {
    componentPath = search(namespaceOption.fallback, options.folders, fileNameFromTag, options.fileExtension);
  }

  if (!componentPath && options.strict) {
    throw new Error(`[components] For the tag ${tag} was not found any template in the defined namespace's base path ${namespaceOption.root}.`);
  }

  return componentPath;
}

/**
 * Main search component file function
 *
 * @param  {String} root Base root or namespace root from options
 * @param  {Array} folders Folders from options
 * @param  {String} fileName Filename converted from tag name
 * @param  {String} extension File extension from options
 * @return {String|boolean} [custom tag root where the module is found]
 */
function search(root, folders, fileName, extension) {
  let componentPath;

  let componentFound = folders.some(folder => {
    componentPath = path.join(path.resolve(root, folder), fileName);
    return existsSync(componentPath);
  });

  if (!componentFound) {
    fileName = fileName.replace(`.${extension}`, `${path.sep}index.${extension}`);
    componentFound = folders.some(folder => {
      componentPath = path.join(path.resolve(root, folder), fileName);
      return existsSync(componentPath);
    });
  }

  return componentFound ? componentPath : false;
}
