'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process layout with locals', async t => {
  const actual = `<component src="layouts/base-locals.html" locals='{ "title": "My Page" }'><div>Content</div><slot:footer>Footer</slot:footer></component>`;
  const expected = `<html><head><title>My Page</title></head><body><main><div>Content</div></main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process attributes as locals', async t => {
  const actual = `<component src="components/component-locals.html" title="My Component Title" body="Content"><slot:body prepend><span>Body</span></slot:body></component>`;
  const expected = `<div><h1>My Component Title</h1></div><div><span>Body</span>Content</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process default attributes and map attributes not locals to first node', async t => {
  const actual = `<component src="components/component-mapped-attributes.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component>`;
  const expected = `<div class="text-dark m-3 bg-light p-2" style="display: flex; font-size: 20px">My Title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process component with locals as JSON and string', async t => {
  const actual = `<component src="components/component-locals-json-and-string.html"
                    merge:titles='{ "suptitle": "This is custom suptitle" }'
                    title="Custom title from JSON and String"
                    items='["another item", "yet another"]'
                    computed:mycomputed="true"
                    merge:locals='{ "items": ["first item", "second item"] }'></component>`;
  const expected = `<div><div>Computed is true</div><div><h1>Custom title from JSON and String</h1></div><div><span>another item</span><span>yet another</span><span>first item</span><span>second item</span></div><div><span>title: This is default main title</span><span>subtitle: This is default subtitle</span><span>suptitle: This is custom suptitle</span></div></div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process parent and child locals via component', async t => {
  const actual = `<x-parent aString="I am custom aString for PARENT via component (1)"><x-child></x-child></x-parent>`;
  const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: My String Child  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must has access to $slots in script locals', async t => {
  const actual = `<x-script-locals><slot:filled>filled slot content...</slot:filled></x-script-locals>`;
  const expected = `<div>{"filled":{"filled":true,"rendered":false,"tag":"slot:filled","attrs":{},"content":["filled slot content..."],"source":"filled slot content...","locals":{}}}</div><div><h1>Default title</h1></div><div>filled slot content...</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

// test('Must pass locals from parent to child via aware', async t => {
//   const actual = `<x-parent aware:aString="I am custom aString for PARENT via component (1)"><x-child></x-child></x-parent>`;
//   const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>  CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;
//
//   const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));
//
//   t.is(html, expected);
// });
