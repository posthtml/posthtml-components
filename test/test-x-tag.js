'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process component to html', async t => {
  const actual = `<x-modal></x-modal>`;
  const expected = `<div>Modal</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process all nested component to html', async t => {
  const actual = `<div><x-nested-one></x-nested-one></div>`;
  const expected = `<div><div class="nested-one"><div class="nested-two"><div class="nested-three">Nested works!</div></div></div></div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process component with namespace to html', async t => {
  const actual = `<x-dark::button><slot name="content">My button</slot></x-dark::button>`;
  const expected = `<button class="bg-dark text-light">My button</button>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test(`Must process component with namespace's fallback path`, async t => {
  const actual = `<x-dark::modal></x-dark::modal>`;
  const expected = `<div>Modal</div>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components', fallback: './test/templates/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test(`Must process component with namespace's custom path`, async t => {
  const actual = `<x-dark::button><slot name="content">My button</slot></x-dark::button>`;
  const expected = `<button class="bg-dark-custom text-light-custom">My button</button>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components', custom: './test/templates/custom/dark/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
