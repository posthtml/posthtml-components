[npm]: https://www.npmjs.com/package/posthtml-component
[npm-version-shield]: https://img.shields.io/npm/v/posthtml-component.svg
[npm-stats]: http://npm-stat.com/charts.html?package=posthtml-component
[npm-stats-shield]: https://img.shields.io/npm/dt/posthtml-component.svg
[github-ci]: https://github.com/posthtml/posthtml-components/actions/workflows/build.yml
[github-ci-shield]: https://github.com/posthtml/posthtml-components/actions/workflows/build.yml/badge.svg
[license]: ./LICENSE
[license-shield]: https://img.shields.io/npm/l/posthtml-component.svg

<div align="center">
  <img width="150" height="150" alt="PostHTML" src="https://posthtml.github.io/posthtml/logo.svg">
  <h1>PostHTML Components</h1>
  <p>Laravel Blade-inspired components for PostHTML</p>

  [![Version][npm-version-shield]][npm]
  [![Build][github-ci-shield]][github-ci]
  [![License][license-shield]][license]
  [![Downloads][npm-stats-shield]][npm-stats]
</div>

## Installation

```bash
npm i -D posthtml-component
```

## Introduction

This PostHTML plugin provides an HTML-friendly syntax for using components in your HTML templates.
If you are familiar with Blade, React, Vue or similar, you will find the syntax to be familiar, as this plugin is inspired by them.

**See also the first [PostHTML Bootstrap UI](https://github.com/thewebartisan7/posthtml-bootstrap-ui) using this plugin and check also the [starter template here](https://github.com/thewebartisan7/posthtml-bootstrap-ui-starter).**

## Options

| Name                     | Type               | Default                                      | Description                                                                      |
|--------------------------|--------------------|----------------------------------------------|----------------------------------------------------------------------------------|
| **root**                 | `String`           | `'./'`                                       | Root path where to look for components.                                          |
| **folders**              | `String[]`         | `['']`                                       | Array of paths relative to `options.root` or defined namespaces.                 |
| **fileExtension**        | `String\|String[]` | `'html'`                                     | Component file extensions to look for.                                           |
| **tagPrefix**            | `String`           | `'x-'`                                       | Tag prefix.                                                                      |
| **tag**                  | `String\|Boolean`  | `false`                                      | Component tag. Use with `options.attribute`. Boolean only `false`.               |
| **attribute**            | `String`           | `'src'`                                      | Attribute to use for defining path to component file.                            |
| **namespaces**           | `String[]`         | `[]`                                         | Array of namespace root paths, fallback paths, and custom override paths.        |
| **namespaceSeparator**   | `String`           | `'::'`                                       | Namespace separator for tag names.                                               |
| **yield**                | `String`           | `'yield'`                                    | Tag name for injecting main component content.                                   |
| **slot**                 | `String`           | `'slot'`                                     | Tag name for [slots](#slots)                                                     |
| **fill**                 | `String`           | `'fill'`                                     | Tag name for filling slots.                                                      |
| **slotSeparator**        | `String`           | `':'`                                        | Name separator for `<slot>` and `<fill>` tags.                                   |
| **stack**                | `String`           | `'stack'`                                    | Tag name for [`<stack>`](#stacks).                                               |
| **push**                 | `String`           | `'push'`                                     | Tag name for `<push>`.                                                           |
| **propsScriptAttribute** | `String`           | `'props'`                                    | Attribute in `<script props>` for retrieving [component props](#props).          |
| **propsContext**         | `String`           | `'props'`                                    | Name of the object inside the script for processing props.                       |
| **propsAttribute**       | `String`           | `'props'`                                    | Attribute name to define props as JSON on a component tag.                       |
| **propsSlot**            | `String`           | `'props'`                                    | Used to retrieve props passed to slot via `$slots.slotName.props`.               |
| **parserOptions**        | `Object`           | `{recognizeSelfClosing: true}`               | Pass options to `posthtml-parser`.                                               |
| **expressions**          | `Object`           | `{}`                                         | Pass options to `posthtml-expressions`.                                          |
| **plugins**              | `Array`            | `[]`                                         | PostHTML plugins to apply to every parsed component.                             |
| **matcher**              | `Object`           | `[{tag: options.tagPrefix}]`                 | Array of objects used to match tags.                                             |
| **attrsParserRules**     | `Object`           | `{}`                                         | Additional rules for attributes parser plugin.                                   |
| **strict**               | `Boolean`          | `true`                                       | Toggle exception throwing.                                                       |
| **mergeCustomizer**      | `Function`         | `function`                                   | Callback for lodash `mergeWith` to merge `options.expressions.locals` and props. |
| **utilities**            | `Object`           | `{merge: _.mergeWith, template: _.template}` | Utility methods passed to `<script props>`.                                      |
| **elementAttributes**    | `Object`           | `{}`                                         | Object with tag names and function modifiers of `valid-attributes.js`.           |
| **safelistAttributes**   | `String[]`         | `['data-*']`                                 | Array of attribute names to add to default valid attributes.                     |
| **blocklistAttributes**  | `String[]`         | `[]`                                         | Array of attribute names to remove from default valid attributes.                |

## Basic example

Create the component:

``` html
<!-- src/button.html -->
<button type="button" class="btn">
  <yield></yield>
</button>
```

Use it:

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
const posthtml = require('posthtml')
const components = require('posthtml-component')
const { readFileSync, writeFileSync } = require('node:fs')

posthtml([
  components({ root: './src' })
])
  .process(readFileSync('src/index.html', 'utf8'))
  .then(result => writeFileSync('dist/index.html', result.html, 'utf8'))
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

You might have noticed that the `src/button.html` component contains `type` and `class` attributes, and that we also passed those attributes when we used it in `src/index.html`.

The result is that `type` was overridden, and `class` was merged.

By default, `class` and `style` attributes are merged, while all others attribute are overridden. You can also override `class` and `style` attributes by prepending `override:` to the class attribute. 

For example:

```html
<x-button override:class="btn-custom">Submit</x-button>

<!-- Output -->
<button type="button" class="btn-custom">Submit</button>
```

All attributes that you pass to the component will be added to the first node of your component or to the node with an attribute named `attributes`, _only_ if they are not defined as `props` via `<script props>` or if they are not "known attributes" (see
[valid-attributes.js](https://github.com/thewebartisan7/posthtml-components/blob/main/src/valid-attributes.js)). 

You can also define which attributes are considered to be valid, via the plugin's options.

More details on this in [Attributes](#attributes) section.

### yield

The `<yield>` tag is where content that you pass to a component will be injected.

The plugin configures the PostHTML parser to recognize self-closing tags, so you can also just write is as `<yield />`.

For brevity, we will use self-closing tags in the examples.

### fileExtension

By default, the plugin looks for components with the `.html` extension. You can change this by passing an array of extensions to the `fileExtension` option.

When using an array, if two files with the same name match both extensions, the file matching the first extension in the array will be used.

```js
const posthtml = require('posthtml')
const components = require('posthtml-component')

posthtml([
  components({ 
    root: './src', // contains layout.html and layout.md
    fileExtension: ['html', 'md']
  })
])
  .process(`<x-layout />`)
  .then(result => console.log(result.html)) // layout.html content
```

### More examples

See also the `docs-src` folder where you can find more examples. 

You can clone this repo and run `npm run build` to compile them.

## Features

### Tag names and x-tags

You can use the components in multiple ways, or also a combination of them.

If you want to use components as 'includes', you can define tag and `src` attribute names.

Using our previous button component example, we can define the tag and attribute names and then use it like this:

```hbs
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

require('posthtml')(
  require('posthtml-component')({ 
    root: './src', 
    tag: 'component', 
    attribute: 'src' 
  }))
  .process(/* ... */)
  .then(/* ... */)
```

If you need more control over tag matching, you may pass an array of matcher or single object via `options.matcher`:

```js
// index.js
const options = { 
  root: './src', 
  matcher: [
    {tag: 'a-tag'}, 
    {tag: 'another-one'}, 
    {tag: new RegExp(`^app-`, 'i')},
  ] 
};

require('posthtml')(require('posthtml-component')(options))
  .process(/* ... */)
  .then(/* ... */)
```

With `posthtml-components` you don't need to specify the path name when you are using `x-tag-name` syntax.

Setup PostHTML:

```js
// index.js
const options = { 
  root: './src', 
  tagPrefix: 'x-'
};

require('posthtml')(require('posthtml-component')(options))
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

If your components are in a subfolder then you can use `dot` to access it:

``` html
<!-- src/components/forms/button.html -->
<x-forms.button>Submit</x-forms.button>
```

If your components are in a sub-folder with multiple files, then in order to avoid writing out the main file name you can use `index.html` without specifying it.

Here's an example:

``` html
<!-- src/components/modals/index.html -->
<x-modal.index>Submit</x-modal.index>

<!-- You may omit "index" part since the file is named "index.html" -->
<x-modal>Submit</x-modal>
```

#### Parser options

You may pass options to `posthtml-parser` via `options.parserOptions`.

```js
// index.js
const options = { 
  root: './src', 
  parserOptions: { decodeEntities: true } 
};

require('posthtml')(require('posthtml-component')(options))
  .process('some HTML', options.parserOptions)
  .then(/* ... */)
```

> [!IMPORTANT]
> The `parserOptions` that you pass to the plugin must also be passed in the `process` method in your code, otherwise your PostHTML build will use `posthtml-parser` defaults and will override anything you've passed to `posthtml-component`.

#### Self-closing tags

The plugin supports self-closing tags by default, but you need to make sure to enable them in the `process` method in your code too, by passing `recognizeSelfClosing: true` in the options object:

```js
// index.js
require('posthtml')(require('posthtml-component')({root: './src'}))
  .process('your HTML...', {recognizeSelfClosing: true})
  .then(/* ... */)
```

If you don't add this to `process`, PostHTML will use `posthtml-parser` defaults and will not support self-closing component tags. This will result in everything after a self-closing tag not being output.

### Multiple folders

You have full control over where your component files exist. Once you set the base root path of your components, you can then set multiple folders.

For example if your root is `./src` and then you have several folders where you have your components, for example `./src/components` and `./src/layouts`, you can set up the plugin like below:

```js
// index.js
const options = { 
  root: './src', 
  folders: ['components', 'layouts'] 
};

require('posthtml')(require('posthtml-component')(options))
  .process(/* ... */)
  .then(/* ... */)
```

### Namespaces

With namespaces, you can define a top level root path to your components.

It can be useful for handling custom themes, where you define a specific top level root with a fallback root for when a component is not found, and a custom root for overriding.

This makes it possible to create folder structures like this:

- `src` (root folder)
  - `components` (folder for components like modal, button, etc.)
  - `layouts` (folder for layout components like base layout, header, footer, etc.)
  - `theme-dark` (namespace folder for theme-dark)
    - `components` (folder for components for theme dark)
    - `layouts` (folder for layout components for dark theme)
  - `theme-light` (namespace folder for theme-light)
    - `components` (folder for components for light theme)
    - `layouts` (folder for layout components for dark theme)
  - `custom` (custom folder for override your namespace themes)
    - `theme-dark` (custom folder for override dark theme)
      - `components` (folder for override components of theme dark)
      - `layouts` (folder for override layout components of dark theme)
    - `theme-light` (custom folder for override light theme)
      - `components` (folder for override components of theme dark)
      - `layouts` (folder for override layout components of dark theme)

And the options would be like:

```js
// index.js
const options = {
  // Root for component without namespace
  root: './src',
  // Folders is always appended in 'root' or any defined namespace's folders (base, fallback or custom)
  folders: ['components', 'layouts'],
  namespaces: [{
    // Namespace name will be prepended to tag name (example <x-theme-dark::button>)
    name: 'theme-dark',
    // Root of the namespace
    root: './src/theme-dark',
    // Fallback root when a component is not found in namespace
    fallback: './src',
    // Custom root for overriding, the lookup happens here first
    custom: './src/custom/theme-dark'
  }, {
    // Light theme
    name: 'theme-light',
    root: './src/theme-light',
    fallback: './src',
    custom: './src/custom/theme-light'
  }, {
    /* ... */
  }]
};
```

Use the component namespace:

```xml
<!-- src/index.html -->
<html>
<body>
  <x-theme-dark::button>Submit</theme-dark::button>
  <x-theme-light::button>Submit</theme-light::button>
</body>
</html>
```

### Slots

Components may define slots that can be filled with content when used.

For example:

```xml
<!-- src/modal.html -->
<div class="modal">
  <div class="modal-header">
    <slot:header />
  </div>
  <div class="modal-body">
    <slot:body />
  </div>
  <div class="modal-footer">
    <slot:footer />
  </div>
</div>
```

Use the component:

```xml
<!-- src/index.html -->
<x-modal>
  <fill:header>Header content</fill:header>
  <fill:body>Body content</fill:body>
  <fill:footer>Footer content</fill:footer>
</x-modal>
```

Result:

```html
<!-- dist/index.html -->
<div class="modal">
  <div class="modal-header">
    Header content
  </div>
  <div class="modal-body">
    Body content
  </div>
  <div class="modal-footer">
    Footer content
  </div>
</div>
```

By default, the slot content is replaced, but you can also prepend or append the content, or keep the default content by not filling the slot.

Add some default content in the component:

```xml
<!-- src/modal.html -->
<div class="modal">
  <div class="modal-header">
    <slot:header>Default header</slot:header>
  </div>
  <div class="modal-body">
    <slot:body>content</slot:body>
  </div>
  <div class="modal-footer">
    <slot:footer>Footer</slot:footer>
  </div>
</div>
```

```xml
<!-- src/index.html -->
<x-modal>
  <fill:body prepend>Prepend body</fill:body>
  <fill:footer append>content</fill:footer>
</x-modal>
```

Result:

```html
<!-- dist/index.html -->
<div class="modal">
  <div class="modal-header">
    Default header
  </div>
  <div class="modal-body">
    Prepend body content
  </div>
  <div class="modal-footer">
    Footer content
  </div>
</div>
```

### Stacks

You may push content to named stacks which can be rendered somewhere else, like in another component. This can be particularly useful for specifying any JavaScript or CSS required by your components.

First, add a `<stack>` tag to your HTML:

```diff
<!-- src/index.html -->
<html>
  <head>
+    <stack name="styles" />
  </head>
<body>
  <x-modal>
    <fill:header>Header content</fill:header>
    <fill:body>Body content</fill:body>
    <fill:footer>Footer content</fill:footer>
  </x-modal>
  
+  <stack name="scripts" />
</body>
</html>
```

Then, in modal components or any other child components, you can push content to this stack:

```xml
<!-- src/modal.html -->
<div class="modal">
  <div class="modal-header">
    <slot:header />
  </div>
  <div class="modal-body">
    <slot:body />
  </div>
  <div class="modal-footer">
    <slot:footer />
  </div>
</div>

<push name="styles">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet">
</push>

<push name="scripts">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"></script>
</push>
```

The output will be:

```html
<!-- dist/index.html -->
<html>
<head>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="modal">
  <div class="modal-header">
    Header content
  </div>
  <div class="modal-body">
    Body content
  </div>
  <div class="modal-footer">
    Footer content
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

The `once` attribute allows you to push content only once per rendering cycle. 

For example, if you are rendering a given component within a loop, you may wish to only push the JavaScript and CSS the first time the component is rendered.

Example.

```html
<!-- src/modal.html -->
<div class="modal">
  <!-- ... -->
</div>

<!-- The push content will be pushed only once in the stack -->

<push name="styles" once>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet">
</push>

<push name="scripts" once>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"></script>
</push>
```

By default, the content is pushed in the stack in the given order. If you would like to prepend content onto the beginning of a stack, you may use the `prepend` attribute:

```html
<push name="scripts">
  <!-- This will be second -->
  <script src="/example.js"></script>
</push>

<!-- Later... -->
<push name="scripts" prepend>
  <!-- This will be first -->
  <script src="/example-2.js"></script>
</push>
```

### Props

`props` can be passed to components in HTML attributes. To use them in a component, they must be defined in the component's `<script props>` tag.

For example:

```html
<!-- src/alert.html -->
<script props>
  module.exports = {
    title: props.title || 'Default title'
  }
</script>
<div>
  {{ title }}
</div>
```

Use:

```html
<x-alert title="Hello world!" />
```

The output will be:

```html
<div>
  Hello world!
</div>
```

If no `title` attribute is passed to the component, the default value will be used.

```html
<x-my-alert />
```

The output will be:

```html
<div>
  Default title
</div>
```

Inside `<script props>` you have access to passed props via an object named `props`.

Here's an example of what you can do with it:

```html
<!-- src/modal.html -->
<script props>
  module.exports = {
    title: props.title || 'Default title', 
    size: props.size ? `modal-${props.size}` : '', 
    items: Array.isArray(props.items) ? props.items.concat(['first', 'second']) : ['first', 'second']
  }
</script>
<div class="modal {{ size }}">
  <div class="modal-header">
    {{ title }}
  </div>
  <div class="modal-body">
    <each loop="item in items"><span>{{ item }}</span></each>
  </div>
</div>
```

Use:

```html
<x-modal 
  size="xl" 
  title="My modal title" 
  items='["third", "fourth"]' 
  class="modal-custom" 
/>
```

The output will be:

```html
<div class="modal modal-custom modal-xl">
  <div class="modal-header">
    My modal title
  </div>
  <div class="modal-body">
    <span>first</span>
    <span>second</span>
    <span>third</span>
    <span>fourth</span>
  </div>
</div>
```

Notice how the `class` attribute that we passed to the component is merged with `class` attribute value of the first node inside of it.

You can change how attributes are merged with global props defined via options, by passing a callback function.

By default, all props are scoped to the component, and are not available to nested components. You can however change this accordingly to your need.

Create a component:

```html
<!-- src/child.html -->
<script props>
  module.exports = {
    title: props.title || 'Default title'
  }
</script>
<div>
  Prop in child: {{ title }}
</div>
```

Create a `<x-parent>` component that uses `<x-child>`:

```html
<!-- src/parent.html -->
<script props>
  module.exports = {
    title: props.title || 'Default title'
  }
</script>
<div>
  Prop in parent: {{ title }}
  <x-child />
</div>
```

Use it:

```html
<x-parent title="My title" />
```

The output will be:

```html
<div>
  Prop in parent: My title
  <div>
    Prop in child: Default title
  </div>
</div>
```

As you can see, `title` in `<x-child>` component renders the default value and not the one set via `<x-parent>`. 

To change this, we must prepend `aware:` to the attribute name in order to pass the props to nested components.

```html
<x-parent aware:title="My title" />
```

The output now will be:

```html
<div>
  Prop in parent: My title
  <div>
    Prop in child: My title
  </div>
</div>
```

### Attributes

You can pass any attributes to your components and they will be added to the first node of your component,
or to the node with an attribute named `attributes`. 

If you are familiar with Vue.js, this is the same as so-called
[fallthrough attribute](https://vuejs.org/guide/components/attrs.html). Or, with Laravel Blade, it's
[component-attributes](https://laravel.com/docs/11.x/blade#component-attributes).

By default, `class` and `style` are merged with existing `class` and `style` attribute. All other attributes are overridden by default.

If you pass an attribute that is defined as a `prop`, it will not be added to the component's node.

Here's an example:

```html
<!-- src/button.html -->
<script props>
  module.exports = {
    label: props.label || 'A button'
  }
</script>
<button type="button" class="btn">
  {{ label }}
</button>
```

Use the component:

```html
<!-- src/index.html -->
<x-button type="submit" class="btn-primary" label="My button" />
```

Result:

```html
<!-- dist/index.html -->
<button type="submit" class="btn btn-primary">My button</button>
```

If you need to override `class` and `style` attribute values (instead of merging them), just prepend `override:` to the attribute name:

```html
<!-- src/index.html -->
<x-button type="submit" override:class="btn-custom" label="My button" />
```

Result:

```html
<!-- dist/index.html -->
<button type="submit" class="btn-custom">My button</button>
```

If you want the attributes to be passed to a certain node, use the `attributes` attribute:

```html
<!-- src/my-component.html -->
<div class="first-node">
  <div class="second-node" attributes>
    Hello world!
  </div>
</div>
```

Use the component:

```html
<!-- src/index.html -->
<x-my-component class="my-class" />
```

Result:

```html
<!-- dist/index.html -->
<div class="first-node">
  <div class="second-node my-class">
    Hello world!
  </div>
</div>
```

You can add custom rules to define how attributes are parsed - we use [posthtml-attrs-parser](https://github.com/posthtml/posthtml-attrs-parser) to handle them.

### Advanced attributes configurations

If default configurations for valid attributes are not right for you, you may configure them as explained below.

```js
// index.js
const { readFileSync, writeFileSync } = require('fs')

const posthtml = require('posthtml')
const components = require('posthtml-component')

const options = {
  root: './src',  
  // Add attributes to specific tag or override defaults
  elementAttributes: {
    DIV: (defaultAttributes) => {
      /* Add new one */
      defaultAttributes.push('custom-attribute-name');

      return defaultAttributes;
    },
    DIV: (defaultAttributes) => {
      /* Override all */
      defaultAttributes = ['custom-attribute-name', 'another-one'];

      return defaultAttributes;
    },
  },
  
  // Add attributes to all tags, use '*' as wildcard for attribute name that starts with
  safelistAttributes: [
    'custom-attribute-name',
    'attribute-name-start-with-*'
  ],

  // Remove attributes from all tags that support it
  blocklistAttributes: [
    'role'
  ]
}

posthtml(components(options))
  .process(readFileSync('src/index.html', 'utf8'))
  .then(result => writeFileSync('dist/index.html', result.html, 'utf8'))
```

## Examples

You can work with `<slot>` and `<fill>` or you can create component for each block of your component, and you can also support both of them.

You can find an example of this inside `docs-src/components/modal`. Following is a short explanation of both approaches.

### Using slots

Let's suppose we want to create a component for [bootstrap modal](https://getbootstrap.com/docs/5.2/components/modal/). 

The code required is:

```html
<!-- Modal HTML -->
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        ...
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
```

There is almost three block of code: the header, the body and the footer.

So we could create a component with three slots:

```diff
<!-- Modal component -->
<div class="modal fade" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
-        <h1 class="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
+        <slot:header />
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
+        <slot:body />
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
+        <slot:footer />
-        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
```

We can then use it like this:

```html
 <x-modal
  id="exampleModal"
  aria-labelledby="exampleModalLabel"
>
  <slot:header>
    <h5 class="modal-title" id="exampleModalLabel">My modal</h5>
  </slot:header>

  <slot:body>
    Modal body content goes here...
  </slot:body>

  <slot:footer close="false">
    <button type="button" class="btn btn-primary">Confirm</button>
  </slot:footer>
</x-modal>
```

### Splitting component in small component

Another approach is to split the component in smaller components, passing attributes to each of them.

So we create a main component and then three different smaller components:

```html
<!-- Main modal component -->
<div class="modal fade" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <yield />
    </div>
  </div>
</div>
```

```html
<!-- Header modal component -->
<div class="modal-header">
  <yield />
</div>
```

```html
<!-- Body modal component -->
<div class="modal-body">
  <yield />
</div>
```

```html
<!-- Footer modal component -->
<div class="modal-footer">
  <yield />
</div>
```

And then you can use it like this:

```html
<x-modal
  id="exampleModal"
  aria-labelledby="exampleModalLabel"
>
  <x-modal.header>
    <h5 class="modal-title" id="exampleModalLabel">My modal</h5>
  </x-modal.header>

  <x-modal.body>
    Modal body content goes here...
  </x-modal.body>

  <x-modal.footer>
    <button type="button" class="btn btn-primary">Confirm</button>
  </x-modal.footer>
</x-modal>
```

As said in this way you can pass attributes to each of them, without defining props.

### Combine slots and small component

You can also combine both approaches, and then use them with slots or with small components:

```html

<!-- Modal -->
<div
  class="modal fade"
  tabindex="-1"
  aria-hidden="true"
  aria-modal="true"
  role="dialog"
>
  <div class="modal-dialog">
    <div class="modal-content">
      <if condition="$slots.header?.filled">
          <x-modal.header>
            <slot:header />
          </x-modal.header>
      </if>
      <if condition="$slots.body?.filled">
          <x-modal.body>
              <slot:body />
          </x-modal.body>
      </if>
      <if condition="$slots.footer?.filled">
          <x-modal.footer close="{{ $slots.footer?.props.close }}">
              <slot:footer />
          </x-modal.footer>
      </if>
      <yield />
    </div>
  </div><!-- /.modal-dialog -->
</div><!-- /.modal -->
```

Now you can use your component with slots or with small components.

As you may notice, by using slots, you already can use also your small components, and so you can also pass props
via `$slots` which has all the `props` passed via slot, and as well check if slot is filled.

## Migration

If you are migrating from `posthtml-extend` and/or `posthtml-modules` please to follow updates here:
[posthtml-components/issues/16](https://github.com/thewebartisan7/posthtml-components/issues/16).

## Contributing

See [PostHTML Guidelines](https://github.com/posthtml/posthtml/tree/master/docs) and [contribution guide](CONTRIBUTING.md).

## Credits

Thanks to all PostHTML contributors and especially to `posthtml-extend` and `posthtml-modules` contributors, as part of code is ~~stolen~~ inspired from these plugins.
Huge thanks also to Laravel Blade template engine.
