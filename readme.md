[![NPM][npm]][npm-url]
[![Coverage][cover]][cover-badge]
[![XO code style][style]][style-url]

<div align="center">
  <img width="300" title="PostHTML" src="http://posthtml.github.io/posthtml/logo.svg">
  <h1>PostHTML Components </h1>
  <p>HTML-friendly syntax component with slots, attributes as locals and more!</p>
</div>

## Install

```bash
npm i -D posthtml-components
```

## Introduction

This PostHTML plugin provides an HTML-friendly syntax for write components in your templates.
If you are familiar with Blade, you will find similar syntax as this plugin was inspired by it.
See below a basic example, as code is worth a thousand words.

## Basic example

Create the component:

``` html
<!-- src/button.html -->
<button class="btn btn-primary">
  <slot></slot>
</button>
```

Use the component:

``` html
<!-- src/index.html -->
<html>
<body>
  <x-button>Submit</x-button>
</body>
</html>
```

Init PostHTML:

```js
// index.js
const { readFileSync, writeFileSync } = require('fs')

const posthtml = require('posthtml')
const components = require('posthtml-components')

posthtml(components({ root: './src' }))
  .process(readFileSync('src/index.html', 'utf8'))
  .then((result) => writeFileSync('dist/index.html', result.html, 'utf8'))
```

Result:

``` html
<!-- dist/index.html -->
<html>
<body>
  <button class="btn btn-primary">Submit</button>
</body>
</html>
```

## Options

|          Option          |              Default              | Description                                                                                                 |
|:------------------------:|:---------------------------------:|:------------------------------------------------------------------------------------------------------------|
|         **root**         |              `'./'`               | String value as root path for components lookup.                                                            |
|        **roots**         |               `''`                | Array of additional multi roots path from `options.root`.                                                   |
|      **namespaces**      |               `[]`                | Array of namespace's root path, fallback path and custom path for override.                                 |
|  **namespaceSeparator**  |               `::`                | String value for namespace separator to be used with tag name. Example `<x-namespace::button>`              |
|  **namespaceFallback**   |              `false`              | Boolean value for use fallback path to defined roots in `options.roots`.                                    |
|    **fileExtension**     |              `html`               | String value for file extension of the components used for retrieve x-tag file.                             |
|      **tagPrefix**       |               `x-`                | String for tag prefix.                                                                                      |
|      **tagRegExp**       |     `new RegExp('^x-'), 'i')`     | Object for regex used to match x-tag. Set only `options.tagPrefix` to keep default.                         |
|     **slotTagName**      |              `slot`               | String value for slot tag name.                                                                             |
| **fallbackSlotTagName**  |              `false`              | Boolean value used to support posthtml-modules slot `<content>`.                                            |
|       **tagName**        |            `component`            | String value for component tag.                                                                             |
|       **tagNames**       |               `[]`                | Array of additional component tag. Useful if you are migrating from extend and modules.                     |
|      **attribute**       |               `src`               | String value for component attribute for set path.                                                          |
|      **attributes**      |               `[]`                | Array of additional component path to be used for migrating from extend and modules.                        |
|     **expressions**      |               `{}`                | Object to configure `posthtml-expressions`. You can pre-set locals or customize the delimiters for example. |
|       **plugins**        |               `[]`                | PostHTML plugins to apply for every parsed components.                                                      |
|       **encoding**       |              `utf8`               | String value for the encoding of the component.                                                             |
| **scriptLocalAttribute** |          `defaultLocals`          | String value for set custom attribute parsed by the plugin to retrieve default locals in the components.    |
|       **matcher**        |               `[]`                | Array of object used to match the tags. Useful if you are migrating from extend and modules.                |
|        **strict**        |              `true`               | Boolean value for enable or disable throw an exception.                                                     |

## Feature

TODO...

## Contributing

See [PostHTML Guidelines](https://github.com/posthtml/posthtml/tree/master/docs) and [contribution guide](CONTRIBUTING.md).

[npm]: https://img.shields.io/npm/v/PLUGIN_NAME.svg
[npm-url]: https://npmjs.com/package/PLUGIN_NAME

[style]: https://img.shields.io/badge/code_style-XO-5ed9c7.svg
[style-url]: https://github.com/sindresorhus/xo

[cover]: https://coveralls.io/repos/USER_NAME/PLUGIN_NAME/badge.svg?branch=master
[cover-badge]: https://coveralls.io/r/USER_NAME/PLUGIN_NAME?branch=master
