const path = require('node:path');
const {existsSync} = require('node:fs');

const folderSeparator = '.';

/**
 * Find component path from tag name
 *
 * @param  {String} tag Tag name
 * @param  {Object} options Plugin options
 * @return {String|boolean} Full path or boolean false
 */
module.exports = (tag, options) => {
  const extensions = Array.isArray(options.fileExtension) ? options.fileExtension : [options.fileExtension];

  const fileNamesFromTag = extensions.map(ext =>
    tag
      .replace(options.tagPrefix, '')
      .split(folderSeparator)
      .join(path.sep)
      .concat(folderSeparator, ext)
  )

  try {
    return tag.includes(options.namespaceSeparator)
      ? searchInNamespaces(tag, fileNamesFromTag, options)
      : searchInFolders(tag, fileNamesFromTag, options);
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
 * @param  {Array} fileNamesFromTag [filename converted from tag name]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function searchInFolders(tag, fileNamesFromTag, options) {
  const componentPath = search(options.root, options.folders, fileNamesFromTag, options.fileExtension);

  if (!componentPath) {
    throw new Error(
      `[components] <${tag}> could not find ${fileNamesFromTag} in the defined root paths (${options.folders.join(', ')})`
    );
  }

  return componentPath;
}

/**
 * Search component file within all defined namespaces
 *
 * @param  {String} tag [tag name with namespace]
 * @param  {Array} namespaceAndFileNames Array of [namespace]::[filename]
 * @param  {Object} options [posthtml options]
 * @return {String|boolean} [custom tag root where the module is found]
 */
function searchInNamespaces(tag, namespaceAndFileNames, options) {
  let result = '';

  for (const namespaceAndFileName of namespaceAndFileNames) {
    const [namespace, fileNameFromTag] = namespaceAndFileName.split('::');

    const namespaceOption = options.namespaces.find(n => n.name === namespace.replace(options.tagPrefix, ''));

    if (!namespaceOption) {
      throw new Error(`[components] Unknown component namespace: ${namespace}.`);
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

    if (!componentPath) {
      throw new Error(`[components] <${tag}> could not find ${fileNameFromTag} in the defined namespace paths.`);
    }

    result = componentPath;
  }

  return result;
}

/**
 * Main component file search function
 *
 * @param  {String} root Base root or namespace root from `options`
 * @param  {Array} folders Folders to search in from `options`
 * @param  {Array} fileNames Filenames converted from tag name
 * @param  {Array} extensions File extension(s) from `options`
 * @return {String|boolean} [custom tag root where the module is found]
 */
function search(root, folders, fileNames, extensions) {
  let componentPath;
  let componentFound = false;

  fileNames = Array.isArray(fileNames) ? fileNames : [fileNames];

  for (const fileName of fileNames) {
    componentFound = folders.some(folder => {
      componentPath = path.join(path.resolve(root, folder), fileName);

      return existsSync(componentPath);
    });

    if (componentFound) break;
  }

  if (!componentFound) {
    for (const extension of extensions) {
      for (const fileName of fileNames) {
        const newFileName = fileName.replace(`.${extension}`, `${path.sep}index.${extension}`);

        componentFound = folders.some(folder => {
          componentPath = path.join(path.resolve(root, folder), newFileName);
          return existsSync(componentPath);
        });

        if (componentFound) break;
      }

      if (componentFound) break;
    }
  }

  return componentFound ? componentPath : false;
}
