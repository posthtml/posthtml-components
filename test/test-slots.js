'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process layout with slots', async t => {
  const actual = `<component src="layouts/base.html"><slot name="content">Content</slot><slot name="footer">Footer</slot></component>`;
  const expected = `<html><head><title>Base Layout</title></head><body><main>Content</main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process the same component multiple times', async t => {
  const actual = `<component src="components/component.html"><slot name="title">Title</slot><slot name="body">Body</slot></component><component src="components/component.html"><slot name="title">Title 2</slot><slot name="body">Body 2</slot></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title 2</div><div>Body 2</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process multiple slots', async t => {
  const actual = `<component src="components/component-multiple-slot.html"><slot name="title">Title</slot><slot name="body">Body</slot></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process append and prepend content to slot', async t => {
  const actual = `<component src="components/component-append-prepend.html"><slot name="title" type="append"> Append</slot><slot name="body" type="prepend">Prepend </slot></component>`;
  const expected = `<div>Title Append</div><div>Prepend Body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
