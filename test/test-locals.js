'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process layout with locals', async t => {
  const actual = `<component src="layouts/base-locals.html" locals='{ "title": "My Page" }'><slot name="content">Content</slot><slot name="footer">Footer</slot></component>`;
  const expected = `<html><head><title>My Page</title></head><body><main>Content</main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process attributes as locals', async t => {
  const actual = `<component src="components/component-locals.html" title="My Component Title" body="Content"><slot name="body" type="prepend">Body </slot></component>`;
  const expected = `<div><h1>My Component Title</h1></div><div>Body Content</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process default attributes and map style and class for the first node', async t => {
  const actual = `<component src="components/component-mapped-attributes.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component>`;
  const expected = `<div class="text-dark m-3 bg-light p-2" style="display: flex; font-size: 20px">My Title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process component with locals as JSON and string', async t => {
  const actual = `<component src="components/component-locals-json-and-string.html"
                    subsomething2='{"items": [{"one": "First", "two": "Second", "three": "Third"}]}'
                    merge:titles='{ "suptitle": "This is custom suptitle" }'
                    something='["one", "two", "three"]'
                    something2='{"one": "First", "two": "Second", "three": "Third"}'
                    title="Custom title from JSON and String"
                    items='["another item", "yet another"]'
                    merge:locals='{ "items": ["first item", "second item"] }'></component>`;
  const expected = `<div><h1>Custom title from JSON and String</h1></div><div><span>another item</span><span>yet another</span><span>first item</span><span>second item</span></div><div><span>title: This is default main title</span><span>subtitle: This is default subtitle</span><span>suptitle: This is custom suptitle</span></div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process parent and child locals via component', async t => {
  const actual = `<x-parent aString="I am custom aString for PARENT via component (1)"><x-child></x-child></x-parent>`;
  const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>  CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: My String  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process parent and child locals via slots', async t => {
  const actual = `<x-parent aString="I am custom aString for PARENT via component (1)"><slot name="child"></slot></x-parent>`;
  const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>  CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must has access to $slots in script locals', async t => {
  const actual = `<x-script-locals><slot first>first slot content...</slot></x-script-locals>`;
  const expected = `{"first":{"filled":true,"locals":{}},"second":{"filled":false}}object{"first":{"filled":true,"locals":{}},"second":{"filled":false}}object<div>first slot content...</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must pass locals from parent to child via aware', async t => {
  const actual = `<x-parent aware:aString="I am custom aString for PARENT via component (1)"><x-child></x-child></x-parent>`;
  const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>  CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
