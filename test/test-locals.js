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
