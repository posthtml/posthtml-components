'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must output html of a component', async t => {
  const actual = `<component src="layouts/base.html"><slot name="content">Content</slot><slot name="footer">Footer</slot></component>`;
  const expected = `<html><head><title>Base Layout</title></head><body><main>Content</main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output html of component with locals', async t => {
  const actual = `<component src="layouts/base-locals.html" locals='{ "title": "My Page" }'><slot name="content">Content</slot><slot name="footer">Footer</slot></component>`;
  const expected = `<html><head><title>My Page</title></head><body><main>Content</main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output html of multiple component', async t => {
  const actual = `<component src="components/component.html"><slot name="title">Title</slot><slot name="body">Body</slot></component><component src="components/component.html"><slot name="title">Title 2</slot><slot name="body">Body 2</slot></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title 2</div><div>Body 2</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output html of the same multiple block in a component', async t => {
  const actual = `<component src="components/component-multiple-slot.html"><slot name="title">Title</slot><slot name="body">Body</slot></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output append and prepend content to slot', async t => {
  const actual = `<component src="components/component-append-prepend.html"><slot name="title" type="append"> Append</slot><slot name="body" type="prepend">Prepend </slot></component>`;
  const expected = `<div>Title Append</div><div>Prepend Body</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output html of component with attribute as locals', async t => {
  const actual = `<component src="components/component-locals.html" title="My Component Title" body="Content"><slot name="body" type="prepend">Body </slot></component>`;
  const expected = `<div><h1>My Component Title</h1></div><div>Body Content</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output html of component with custom tag', async t => {
  const actual = `<x-modal></x-modal>`;
  const expected = `<div>Modal</div>`;

  const html = await posthtml([plugin({root: './test/templates/', roots: 'components/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must output html of component with mapped attributes', async t => {
  const actual = `<component src="components/component-mapped-attributes.html" class="bg-light p-2" title="My Title"></component>`;
  const expected = `<div class="text-dark m-3" $attributes="">My Title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates/', roots: 'components/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
