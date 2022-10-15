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

|          Option          |          Default          | Description                                                                                                    |
|:------------------------:|:-------------------------:|:---------------------------------------------------------------------------------------------------------------|
|         **root**         |          `'./'`           | String value as root path for components lookup.                                                               |
|        **roots**         |           `''`            | Array of additional multi roots path from `options.root`.                                                      |
|      **namespaces**      |           `[]`            | Array of namespace's root path, fallback path and custom path for override.                                    |
|  **namespaceSeparator**  |           `::`            | String value for namespace separator to be used with tag name. Example `<x-namespace::button>`                 |
|  **namespaceFallback**   |          `false`          | Boolean value for use fallback path to defined roots in `options.roots`.                                       |
|    **fileExtension**     |          `html`           | String value for file extension of the components used for retrieve x-tag file.                                |
|      **tagPrefix**       |           `x-`            | String for tag prefix.                                                                                         |
|      **tagRegExp**       | `new RegExp('^x-'), 'i')` | Object for regex used to match x-tag. Set only `options.tagPrefix` to keep default.                            |
|     **slotTagName**      |          `slot`           | String value for slot tag name.                                                                                |
| **fallbackSlotTagName**  |          `false`          | Boolean or string value used to support posthtml-modules slot. Set to true to use `<content>` or set a string. |
|       **tagName**        |        `component`        | String value for component tag.                                                                                |
|       **tagNames**       |           `[]`            | Array of additional component tag. Useful if you are migrating from extend and modules.                        |
|      **attribute**       |           `src`           | String value for component attribute for set path.                                                             |
|      **attributes**      |           `[]`            | Array of additional component path to be used for migrating from extend and modules.                           |
|     **expressions**      |           `{}`            | Object to configure `posthtml-expressions`. You can pre-set locals or customize the delimiters for example.    |
|       **plugins**        |           `[]`            | PostHTML plugins to apply for every parsed components.                                                         |
|       **encoding**       |          `utf8`           | String value for the encoding of the component.                                                                |
| **scriptLocalAttribute** |          `props`          | String value for set custom attribute parsed by the plugin to retrieve locals in the components.               |
|       **matcher**        |           `[]`            | Array of object used to match the tags. Useful if you are migrating from extend and modules.                   |
|        **strict**        |          `true`           | Boolean value for enable or disable throw an exception.                                                        |

## Features

### Tag names and x-tags

You can use the components in multiple ways, or also a combination of them.
Like with `posthtml-extend` and `posthtml-modules` you can define a tag name or multiples tag name in combination with an attribute name or multiple attributes name for set the path to the components.

For example for the same button component `src/button.html` in the basic example we can define the tag name and attribute name and then use it in this way:

``` html
<!-- src/index.html -->
<html>
<body>
  <component src="button.html">Submit</component>
</body>
</html>
```

Init PostHTML:

```js
// index.js
const { readFileSync, writeFileSync } = require('fs')

const posthtml = require('posthtml')
const components = require('posthtml-components')

posthtml(components({ root: './src', tagName: 'component', attribute: 'src' }))
  .process(readFileSync('src/index.html', 'utf8'))
  .then((result) => writeFileSync('dist/index.html', result.html, 'utf8'))
```

We can also set multiple tag names by passing an array of component name and an array of attribute name, this is useful if you need to migrate from `posthtml-extend` and `posthtml-modules` where you are using different tag name.

Init PostHTML with multiple tag names and attributes:

``` html
<!-- src/index.html -->
<html>
<body>
  <extends src="button.html">Submit</extends>
  <module href="button.html">Submit</module>
</body>
</html>
```

```js
// index.js

const options = { 
  root: './src', 
  tagNames: ['extends', 'module'], 
  attribute: ['src', 'href']
};

require('posthtml')(require('posthtml-components')(options))
  .process(/* ... */)
  .then(/* ... */)
```

If you need more control over how to match the tags, you can pass directly an array of matcher or single object via `options.matcher` like shown in below example:

```js
// index.js

const options = { 
  root: './src', 
  matcher: [{tag: 'a-tag'}, {tag: 'another-one'}, {tag: new RegExp(`^app-`, 'i')}] 
};

require('posthtml')(require('posthtml-components')(options))
  .process(/* ... */)
  .then(/* ... */)
```

With `posthtml-components` you don't need to specify the path name when you are using `x-tag-name` syntax. See below example.

Setup PostHTML:

```js
// index.js

const options = { 
  root: './src', 
  tagPrefix: 'x-'
};

require('posthtml')(require('posthtml-components')(options))
  .process(/* ... */)
  .then(/* ... */)
```

Use:

``` html
<!-- src/index.html -->
<html>
<body>
  <x-button>Submit</x-button>
</body>
</html>
```

If your components are in a subfolder then you can use `dot` to access it, example:

``` html
<!-- Supposing your button component is located in ./src/components/forms/button.html -->
<x-forms.button>Submit</x-forms.button>
```

If your components are in a sub-folder with multiple files, then for avoid to type the main file you can use `index.html` without specify it.
Please see below example to understand better.

``` html
<!-- Supposing your modal component is located in ./src/components/modals/index.html -->
<x-modal.index>Submit</x-modal.index>

<!-- You can omit "index" part since the file is named "index.html" -->
<x-modal>Submit</x-modal>
```

### Multiple roots

You have full control where to place your components. Once you set the main root path of your components, you can then set multiple roots.
For example let's suppose your main root is `./src` and then you have several folders where you have your components, for example `./src/components` and `./src/layouts`.
You can setup the plugin like below:

```js
// index.js

const options = { 
  root: './src', 
  roots: ['components', 'layouts'] 
};

require('posthtml')(require('posthtml-components')(options))
  .process(/* ... */)
  .then(/* ... */)
```

### Namespaces

With namespaces you can define a top level root path to your components like shown in below example:

``` html
<!-- src/index.html -->
<html>
<body>
  <x-theme-dark::button>Submit</theme-dark::button>
  <x-theme-light::button>Submit</theme-light::button>
</body>
</html>
```

### Slots

### Props

### Matcher

## Migration from posthtml-extend and posthtml-modules

## Contributing

See [PostHTML Guidelines](https://github.com/posthtml/posthtml/tree/master/docs) and [contribution guide](CONTRIBUTING.md).

[npm]: https://img.shields.io/npm/v/PLUGIN_NAME.svg
[npm-url]: https://npmjs.com/package/PLUGIN_NAME

[style]: https://img.shields.io/badge/code_style-XO-5ed9c7.svg
[style-url]: https://github.com/sindresorhus/xo

[cover]: https://coveralls.io/repos/USER_NAME/PLUGIN_NAME/badge.svg?branch=master
[cover-badge]: https://coveralls.io/r/USER_NAME/PLUGIN_NAME?branch=master

## Credits

Thanks to all PostHTML contributors and especially to `posthtml-extend` and `posthtml-modules` contributors, as part of code are ~~stolen~~ borrowed from these plugins.
