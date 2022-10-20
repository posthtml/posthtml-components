[![NPM][npm]][npm-url]
[![Coverage][cover]][cover-badge]
[![XO code style][style]][style-url]

<div align="center">
  <img width="300" title="PostHTML" src="http://posthtml.github.io/posthtml/logo.svg">
  <h1>PostHTML Components </h1>
  <p>HTML-friendly syntax component with slots, attributes as locals and more!</p>
</div>

## Installation

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

See also the `examples` folder. You can run `npm run build-examples` to compile them.

## Options

|         Option         |           Default            | Description                                                                                                    |
|:----------------------:|:----------------------------:|:---------------------------------------------------------------------------------------------------------------|
|        **root**        |            `'./'`            | String value as root path for components lookup.                                                               |
|      **folders**       |            `['']`            | Array of additional multi folders path from `options.root` or any defined namespaces root, fallback or custom. |
|     **tagPrefix**      |             `x-`             | String for tag prefix. The plugin will use RegExp with this string.                                            |
|        **tag**         |           `false`            | String or boolean value for component tag. Use this with `options.attribute`. Boolean only false.              |
|     **attribute**      |            `src`             | String value for component attribute for set path.                                                             |
|     **namespaces**     |             `[]`             | Array of namespace's root path, fallback path and custom path for override.                                    |
| **namespaceSeparator** |             `::`             | String value for namespace separator to be used with tag name. Example `<x-namespace::button>`                 |
|   **fileExtension**    |            `html`            | String value for file extension of the components used for retrieve x-tag file.                                |
|       **yield**        |           `yield`            | String value for `<yield>` tag name. Where main content of component is injected.                              |
|        **slot**        |            `slot`            | String value for `<slot>` tag name. Used with RegExp by appending `:` (example `<slot:slot-name>`).            |
|        **fill**        |            `fill`            | String value for `<fill>` tag name. Used with RegExp by appending `:` (example `<fill:slot-name>`).            |
|        **push**        |            `push`            | String value for `<push>` tag name.                                                                            |
|       **stack**        |           `stack`            | String value for `<stack>` tag name.                                                                           |
|     **localsAttr**     |           `props`            | String value used in `<script props>` parsed by the plugin to retrieve locals in the components.               |
|    **expressions**     |             `{}`             | Object to configure `posthtml-expressions`. You can pre-set locals or customize the delimiters for example.    |
|      **plugins**       |             `[]`             | PostHTML plugins to apply for every parsed components.                                                         |
|      **matcher**       | `[{tag: options.tagPrefix}]` | Array of object used to match the tags.                                                                        |
|  **attrsParserRules**  |             `{}`             | Additional rules for attributes parser plugin.                                                                 |
|       **strict**       |            `true`            | Boolean value for enable or disable throw an exception.                                                        |

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
You can setup the plugin like below:

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

With namespaces you can define a top level root path to your components like shown in below example.
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

By default the content is replaced, but you can also prepend or append the content, or keep the default content by not filling the slot.

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

By default the content is pushed in the stack in the given order.
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

Behind the `props` there is powerful [posthtml-expressions](https://github.com/posthtml/posthtml-expressions) plugin, with feature to pass `props` via attributes, define default via `<script props>`, merge with default and use `<script props>` as computed.

Let's see how it works with an example.

Create the component:

```html
<!-- src/modal.html -->
<script props>
  module.exports = {
    title: 'Default title',
    size: locals.size ? `modal-${locals.size}` : '',
    items: ['first', 'second']
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
<x-modal computed:size="xl" title="My modal title" merge:items='["third", "fourth"]' class="modal-custom"></x-modal>
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

So the prop `size` is not override since we prepend `computed:` to the attribute, while the prop `title` is override.
And the prop `items` is merged and not override. 

### Attributes

Your can pass any attributes to your components and this will be added to the first element of your component.
By default `class` and `style` are merged with existing `class` and `style` attribute of the first element of your component.
All others attributes are override by default.
Only attribute not defined as `props` will be processed.

As already seen in basic example:

```html
<!-- src/button.html -->
<script props>
  module.exports = {
    label: 'A button'
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

If you are familiar with Laravel Blade, this is also how Blade handle this.

As said early, class and style are merged by default, if you want to override them, just prepend `override:` to the attributes:

```html
<!-- src/index.html -->
<x-button type="submit" override:class="btn-custom" label="My button"></x-button>
```

Result:

```html
<!-- dist/index.html -->
<button type="submit" class="btn-custom">My button</button>
```

You can add custom rules how attributes are parsed, as behind the scene it's used [posthtml-attrs-parser](https://github.com/posthtml/posthtml-attrs-parser) plugin.

## Tips and tricks

You can work with `<slot>` and `<fill>` or you can create component for each "block" of your component, and you can also support both of them.
You can find an example of this inside `examples/components/modal`. Below is a short explanation about the both approach.

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
          <x-modal.footer close="{{ $slots.footer?.locals.close }}">
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

If you are migrating from `posthtml-extend` and/or `posthtml-modules` then you can continue to keep them until you migrate all of your components.
For continue to use current code with this plugin without changing it, at the moment it's not yet fully supported, but it maybe comes in near future.
This because the new version has different logic to handle slots and locals, as well the yield content.

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
Huge thanks also to Laravel Blade template engine.
