[![NPM][npm]][npm-url]
[![Coverage][cover]][cover-badge]
[![XO code style][style]][style-url]

<div align="center">
  <img width="300" title="PostHTML" src="http://posthtml.github.io/posthtml/logo.svg">
  <h1>PostHTML Components </h1>
  <p>A PostHTML plugin for create components with HTML-friendly syntax inspired by Laravel Blade. Slots, stack/push, props, custom tag and much more.</p>
</div>

## Installation

```bash
npm i -D posthtml-component
```

## Introduction

This PostHTML plugin provides an HTML-friendly syntax for write components in your templates.
If you are familiar with Blade, React, Vue or similar, you will find familiar syntax as this plugin is inspired by them.
See below a basic example, as code is worth a thousand words.

**See also the first [PostHTML Bootstrap UI](https://github.com/thewebartisan7/posthtml-bootstrap-ui) using this plugin and check also the [starter template here](https://github.com/thewebartisan7/posthtml-bootstrap-ui-starter).**

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

You may notice that the `src/button.html` component has a `type` and `class` attribute, and when we use the component in `src/index.html` we pass `type` and `class` attribute.
The result is that `type` is override, and `class` is merged.

By default `class` and `style` attributes are merged, while all others attribute are override.
You can also override `class` and `style` attributes by prepending `override:` to the class attribute. Example:

```html
<x-button override:class="btn-custom">Submit</x-button>

<!-- Output -->
<button type="button" class="btn-custom">Submit</button>
```

All attributes you pass to the component will be added to the first node of your component or to the node with an attribute names `attributes`,
and only if they are not defined as `props` via `<script props>` or if they are not in the following file
[valid-attributes.js](https://github.com/thewebartisan7/posthtml-components/blob/main/src/valid-attributes.js). 
You can also manage valid attributes via options.
More details on this in [Attributes](#attributes) section.

The `<yield>` tag is where your content will be injected.
In next section you can find all available options and then examples for each feature.

See also the `docs-src` folder where you can find more examples. 
You can run `npm run build` to compile them.

## Options

|          Option          |                    Default                    | Description                                                                                                                   |
|:------------------------:|:---------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------|
|         **root**         |                    `'./'`                     | String value as root path for components lookup.                                                                              |
|       **folders**        |                    `['']`                     | Array of additional multi folders path from `options.root` or any defined namespaces root, fallback or custom.                |
|      **tagPrefix**       |                     `x-`                      | String for tag prefix. The plugin will use RegExp with this string.                                                           |
|         **tag**          |                    `false`                    | String or boolean value for component tag. Use this with `options.attribute`. Boolean only false.                             |
|      **attribute**       |                     `src`                     | String value for component attribute for set path.                                                                            |
|      **namespaces**      |                     `[]`                      | Array of namespace's root path, fallback path and custom path for override.                                                   |
|  **namespaceSeparator**  |                     `::`                      | String value for namespace separator to be used with tag name. Example `<x-namespace::button>`                                |
|    **fileExtension**     |                    `html`                     | String value for file extension of the components used for retrieve x-tag file.                                               |
|        **yield**         |                    `yield`                    | String value for `<yield>` tag name. Where main content of component is injected.                                             |
|         **slot**         |                    `slot`                     | String value for `<slot>` tag name. Used with RegExp by appending `:` (example `<slot:slot-name>`).                           |
|         **fill**         |                    `fill`                     | String value for `<fill>` tag name. Used with RegExp by appending `:` (example `<fill:slot-name>`).                           |
|    **slotSeparator**     |                      `:`                      | String value used for separate `<slot>` and `<fill>` tag from their names.                                                    |
|         **push**         |                    `push`                     | String value for `<push>` tag name.                                                                                           |
|        **stack**         |                    `stack`                    | String value for `<stack>` tag name.                                                                                          |
| **propsScriptAttribute** |                    `props`                    | String value used as attribute in `<script props>` parsed by the plugin to retrieve props of the component.                   |
|     **propsContext**     |                    `props`                    | String value used as object name inside the script to process process before passed to the component.                         |
|    **propsAttribute**    |                    `props`                    | String value for props attribute to define props as JSON.                                                                     |
|      **propsSlot**       |                    `props`                    | String value used to retrieve the props passed to slot via `$slots.slotName.props`.                                           |
|     **parserOptions**    |        `{recognizeSelfClosing: true}`         | Object to configure `posthtml-parser`. By default, it enables support for self-closing component tags.                        |
|     **expressions**      |                     `{}`                      | Object to configure `posthtml-expressions`. You can pre-set locals or customize the delimiters for example.                   |
|       **plugins**        |                     `[]`                      | PostHTML plugins to apply for every parsed components.                                                                        |
|       **matcher**        |         `[{tag: options.tagPrefix}]`          | Array of object used to match the tags.                                                                                       |
|   **attrsParserRules**   |                     `{}`                      | Additional rules for attributes parser plugin.                                                                                |
|        **strict**        |                    `true`                     | Boolean value for enable or disable throw an exception.                                                                       |
|   **mergeCustomizer**    |                  `function`                   | Function callback passed to lodash `mergeWith` for merge `options.expressions.locals` and props passed via attribute `props`. |
|      **utilities**       | `{merge: _.mergeWith, template: _.template}`  | Object of utilities methods to be passed to `<script props>`. By default lodash `mergeWith` and `template`.                   |
|  **elementAttributes**   |                     `{}`                      | An object with tag name and a function modifier of valid-attributes.js.                                                       |
|  **safelistAttributes**  |         `['data-*']`                          | An array of attributes name to be added to default valid attributes.                                                          |
| **blacklistAttributes**  |                     `[]`                      | An array of attributes name to be removed from default valid attributes.                                                      |

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

### Multiple folders

You have full control where to place your components. Once you set the base root path of your components, you can then set multiple folders.
For example let's suppose your main root is `./src` and then you have several folders where you have your components, for example `./src/components` and `./src/layouts`.
You can set up the plugin like below:

```js
// index.js
const options = { 
  root: './src', 
  folders: ['components', 'layouts'] 
};

require('posthtml')(require('posthtml-components')(options))
  .process(/* ... */)
  .then(/* ... */)
```

### Namespaces

With namespaces, you can define a top level root path to your components like shown in below example.
It can be useful for handle custom theme, where you define a specific top level root, with fallback root when component it's not found,
and a custom root for override, something like a child theme.

Thanks to namespace, you can create folders structure like below:

- `src` (base root folder)
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
  // Main root for component without namespace
  root: './src',
  // Folders is always appended in 'root' or any defined namespace's folders (base, fallback or custom)
  folders: ['components', 'layouts'],
  namespaces: [{
    // Namespace name will be prepend to tag name (example <x-theme-dark::button>)
    name: 'theme-dark',
    // Base root of the namespace
    root: './src/theme-dark',
    // Fallback root when a component it's not found in namespace
    fallback: './src',
    // Custom root for override, the lookup happen first here
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

``` html
<!-- src/index.html -->
<html>
<body>
  <x-theme-dark::button>Submit</theme-dark::button>
  <x-theme-light::button>Submit</theme-light::button>
</body>
</html>
```

Of course, you can change this folder structure as you prefer according to your project requirements.

### Slots

Your components can inject code in specific slots you define, and then you can fill this content when you use the component.
Find below a simple example.

Create the component:

```html
<!-- src/modal.html -->
<div class="modal">
  <div class="modal-header">
    <slot:header></slot:header>
  </div>
  <div class="modal-body">
    <slot:body></slot:body>
  </div>
  <div class="modal-footer">
    <slot:footer></slot:footer>
  </div>
</div>
```

Use the component:

```html
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

By default, the content is replaced, but you can also prepend or append the content, or keep the default content by not filling the slot.

Add some default content in the component:

```html
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

```html
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

You can push content to named stacks which can be rendered somewhere else in another place. This can be particularly useful for specifying any JavaScript or CSS required by your components.

First of all define a `<stack>` anywhere in your code, for example:

```html
<!-- src/index.html -->
<html>
<head>
<stack name="styles"></stack>
</head>
<body>

<x-modal>
  <fill:header>Header content</fill:header>
  <fill:body>Body content</fill:body>
  <fill:footer>Footer content</fill:footer>
</x-modal>
  
<stack name="scripts"></stack>
</body>
</html>
```

Then in modal components, or any other child components, you can push content to this stack.

```html
<!-- src/modal.html -->
<div class="modal">
  <div class="modal-header">
    <slot:header></slot:header>
  </div>
  <div class="modal-body">
    <slot:body></slot:body>
  </div>
  <div class="modal-footer">
    <slot:footer></slot:footer>
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

The `once` attribute allows you to push content only once per rendering cycle. For example, if you are rendering a given component within a loop, you may wish to only push the JavaScript and CSS the first time the component is rendered.

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

By default, the content is pushed in the stack in the given order.
If you would like to prepend content onto the beginning of a stack, you should use the `prepend` attribute:

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

Behind the `props` there is powerful [posthtml-expressions](https://github.com/posthtml/posthtml-expressions) plugin, with feature to pass `props` (locals) via attributes and manipulate them via `<script props>`.

Let's see how it works with a few examples starting with a basic one.

Create the component:

```html
<!-- src/my-component.html -->
<script props>
  module.exports = {
    prop: props.prop || 'Default prop value'
  }
</script>
<div>
  {{ prop }}
</div>
```

Use:

```html
<x-my-component prop="Hello world!"></x-my-component>
```

The output will be:

```html
<div>
  Hello world!
</div>
```

Without passing `prop` via attribute then the output would be `Default prop value`, as shown below.

Use component without passing prop:

```html
<x-my-component></x-my-component>
```

The output will be:

```html
<div>
  Default prop value
</div>
```

In the `<script props>` you have access to passed props via object `props`, and you can add any logic you need inside it.

Create the component:

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
<x-modal size="xl" title="My modal title" items='["third", "fourth"]' class="modal-custom"></x-modal>
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

You can also notice how the `class` attribute is merged with `class` attribute of the first node. In the next section you will know more about this.

You can change how attributes are merged with global props defined via options by passing a callback function used by lodash method [mergeWith](https://lodash.com/docs/4.17.15#mergeWith).

By default, all props are scoped to the component, and are not available to nested components. You can however change this accordingly to your need.
Let's see below example.

Create a component:

```html
<!-- src/child.html -->
<script props>
  module.exports = {
    prop: props.prop || 'Default prop value'
  }
</script>
<div>
  Prop in child: {{ prop }}
</div>
```

Create another component that use the first one:


```html
<!-- src/parent.html -->
<script props>
  module.exports = {
    prop: props.prop || 'Default prop value'
  }
</script>
<div>
  Prop in parent: {{ prop }}
  <x-child></x-child>
</div>
```

Use:

```html
<x-parent prop="My prop"></x-parent>
```

The output will be:

```html
<div>
  Prop in parent: My prop
  <div>
    Prop in child: Default prop value
  </div>
</div>
```

As you can see `prop` in `x-child` component are default value and not the one set via `x-parent`. Prepend `aware:` to the attribute name to pass the props to nested components.


```html
<x-parent aware:prop="My prop"></x-parent>
```

The output now will be:

```html
<div>
  Prop in parent: My prop
  <div>
    Prop in child: My prop
  </div>
</div>
```

### Attributes

You can pass any attributes to your components and this will be added to the first node of your component,
or to the node with an attribute named `attributes`. If you are familiar with VueJS this is the same as so called
[fallthrough attribute](https://vuejs.org/guide/components/attrs.html), or with Laravel Blade is
[component-attributes](https://laravel.com/docs/10.x/blade#component-attributes).

By default `class` and `style` are merged with existing `class` and `style` attribute.
All others attributes are override by default.
Only attributes defined in [valid-attributes.js](https://github.com/thewebartisan7/posthtml-components/blob/main/src/valid-attributes.js)
or not defined as `props` in the `<script props>`.

As already seen in basic example:

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
<x-button type="submit" class="btn-primary" label="My button"></x-button>
```

Result:

```html
<!-- dist/index.html -->
<button type="submit" class="btn btn-primary">My button</button>
```

As you may notice the `label` attribute is not added as attribute, since it's defined as a `props`.

As said early, `class` and `style` are merged by default, if you want to override them, just prepend `override:` to the attribute name:

```html
<!-- src/index.html -->
<x-button type="submit" override:class="btn-custom" label="My button"></x-button>
```

Result:

```html
<!-- dist/index.html -->
<button type="submit" class="btn-custom">My button</button>
```

If you want to use another node and not the first one, then you can add the attribute `attributes` like shown below.

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
<x-my-component class="my-class"></x-my-component>
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

You can add custom rules how attributes are parsed, as behind the scene it's used [posthtml-attrs-parser](https://github.com/posthtml/posthtml-attrs-parser) plugin.

### Advanced attributes configurations

If default configurations for valid attributes are not right for you, then you can configure them as explained below.

```js
// index.js
const { readFileSync, writeFileSync } = require('fs')

const posthtml = require('posthtml')
const components = require('posthtml-components')

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
  blacklistAttributes: [
    'role'
  ]
}

posthtml(components(options))
  .process(readFileSync('src/index.html', 'utf8'))
  .then((result) => writeFileSync('dist/index.html', result.html, 'utf8'))
```

## Examples

You can work with `<slot>` and `<fill>` or you can create component for each block of your component, and you can also support both of them.
You can find an example of this inside `docs-src/components/modal`. Below is a short explanation about the both approach.

### Using slots

Let's suppose we want to create a component for [bootstrap modal](https://getbootstrap.com/docs/5.2/components/modal/). The code required is:

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
So we could create our component with three slot like below:

```html
<!-- Modal component -->
<div class="modal fade" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <slot:header></slot:header>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <slot:body></slot:body>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <slot:footer></slot:footer>
      </div>
    </div>
  </div>
</div>
```

In this case we can use it like:

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

Another way is to split the component in small component, my preferred way, because you can pass attributes to each of them.
So we create the component with a main component and then three different small component:

```html
<!-- Main modal component -->
<div class="modal fade" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <yield></yield>
    </div>
  </div>
</div>
```

```html
<!-- Header modal component -->
<div class="modal-header">
  <yield></yield>
</div>
```

```html
<!-- Body modal component -->
<div class="modal-body">
  <yield></yield>
</div>
```

```html
<!-- Footer modal component -->
<div class="modal-footer">
  <yield></yield>
</div>
```

And then you can use it like below example:

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

You can also combine both way, and then use them with slots or with small component:

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
            <slot:header></slot:header>
          </x-modal.header>
      </if>
      <if condition="$slots.body?.filled">
          <x-modal.body>
              <slot:body></slot:body>
          </x-modal.body>
      </if>
      <if condition="$slots.footer?.filled">
          <x-modal.footer close="{{ $slots.footer?.props.close }}">
              <slot:footer></slot:footer>
          </x-modal.footer>
      </if>
      <yield></yield>
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

[npm]: https://img.shields.io/npm/v/posthtml-component.svg
[npm-url]: https://www.npmjs.com/package/posthtml-component

[style]: https://img.shields.io/badge/code_style-XO-5ed9c7.svg
[style-url]: https://github.com/sindresorhus/xo

[cover]: https://coveralls.io/repos/thewebartisan7/posthtml-components/badge.svg?branch=main
[cover-badge]: https://coveralls.io/r/thewebartisan7/posthtml-components?branch=main

## Credits

Thanks to all PostHTML contributors and especially to `posthtml-extend` and `posthtml-modules` contributors, as part of code are ~~stolen~~ inspired from these plugins.
Huge thanks also to Laravel Blade template engine.
