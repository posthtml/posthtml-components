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
  const actual = `<component src="components/component-mapped-attributes.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px;"></component>`;
  const expected = `<div class="text-dark m-3 bg-light p-2" style="display: flex; font-size: 20px;">My Title Default body</div>`;

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
