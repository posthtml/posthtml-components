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

> This plugin is still in early stage of development and the current API may change.

## Basic example

Create the component:

``` html
<!-- src/button.html -->
<button type="button" class="btn">
  <yield></yield>
</button>
```

Use the component:

``` html
<!-- src/index.html -->
<html>
<body>
  <x-button type="submit" class="btn-primary">Submit</x-button>
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
  <button type="submit" class="btn btn-primary">Submit</button>
</body>
</html>
```

You may ask yourself many questions about this basic examples, and you will find most if not all answers in this readme. In case is missing something, feel free to ask via discussions.

But I want to explain a few things now.

First you may notice that our `src/button.html` component has a `type` and `class` attribute, and when we use the component in `src/index.html` we add type and class attribute. The result is that `type` is override, and `class` is merged. 

By default `class` and `style` attributes are merged, while all others attribute are override. You can also override class and style attribute by prepending `override:` to the class attribute. Example:

```html
<x-button override:class="btn-custom">Submit</x-button>

<!-- Output -->
<button type="button" class="btn-custom">Submit</button>
```

All attributes you pass to the component will be added to the first root element of your component, and only if they are not defined as `props` via `<script props>`. More details on this later.

Second you may notice a `<yield>` tag.

This is where your content will be injected.

In next section you can find all available options and then more examples.

## Options

|         Option         |           Default            | Description                                                                                                 |
|:----------------------:|:----------------------------:|:------------------------------------------------------------------------------------------------------------|
|        **root**        |            `'./'`            | String value as root path for components lookup.                                                            |
|       **roots**        |            `['']`            | Array of additional multi roots path from `options.root`.                                                   |
|     **tagPrefix**      |             `x-`             | String for tag prefix.                                                                                      |
|        **tag**         |           `false`            | String or boolean value for component tag. Use this with `options.attribute`. Boolean only false.           |
|     **attribute**      |            `src`             | String value for component attribute for set path.                                                          |
|     **namespaces**     |             `[]`             | Array of namespace's root path, fallback path and custom path for override.                                 |
| **namespaceSeparator** |             `::`             | String value for namespace separator to be used with tag name. Example `<x-namespace::button>`              |
| **namespaceFallback**  |           `false`            | Boolean value for use fallback path to defined roots in `options.roots`.                                    |
|   **fileExtension**    |            `html`            | String value for file extension of the components used for retrieve x-tag file.                             |
|       **yield**        |           `yield`            | String value for `<yield>` tag name. Where main content of component is injected.                           |
|        **slot**        |            `slot`            | String value for `<slot>` tag name.                                                                         |
|        **fill**        |            `fill`            | String value for `<fill>` tag name.                                                                         |
|        **push**        |            `push`            | String value for `<push>` tag name.                                                                         |
|       **stack**        |           `stack`            | String value for `<stack>` tag name.                                                                        |
|     **localsAttr**     |           `props`            | String value used in `<script props>` parsed by the plugin to retrieve locals in the components.            |
|    **expressions**     |             `{}`             | Object to configure `posthtml-expressions`. You can pre-set locals or customize the delimiters for example. |
|      **plugins**       |             `[]`             | PostHTML plugins to apply for every parsed components.                                                      |
|      **matcher**       | `[{tag: options.tagPrefix}]` | Array of object used to match the tags.                                                                     |
|  **attrsParserRules**  |             `{}`             | Additional rules for attributes parser plugin.                                                              |
|       **strict**       |            `true`            | Boolean value for enable or disable throw an exception.                                                     |

## Features

### Tag names and x-tags

You can use the components in multiple ways, or also a combination of them.
Like with `posthtml-extend` and `posthtml-modules` you can define a tag name in combination with an attribute name for set the path of the components.

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

require('posthtml')(require('posthtml-components')({ root: './src', tagName: 'component', attribute: 'src' }))
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

If your components are in a sub-folder with multiple files, then for avoid typing the main file you can use `index.html` without specify it.
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

### Stacks

### Props

### Attributes

## Migration

## Contributing

See [PostHTML Guidelines](https://github.com/posthtml/posthtml/tree/master/docs) and [contribution guide](CONTRIBUTING.md).

[npm]: https://img.shields.io/npm/v/PLUGIN_NAME.svg
[npm-url]: https://npmjs.com/package/PLUGIN_NAME

[style]: https://img.shields.io/badge/code_style-XO-5ed9c7.svg
[style-url]: https://github.com/sindresorhus/xo

[cover]: https://coveralls.io/repos/USER_NAME/PLUGIN_NAME/badge.svg?branch=master
[cover-badge]: https://coveralls.io/r/USER_NAME/PLUGIN_NAME?branch=master

## Credits

Thanks to all PostHTML contributors and especially to `posthtml-extend` and `posthtml-modules` contributors, as part of code are ~~stolen~~ inspired from these plugins.
Huge thanks also to Laravel Blade template engine!
