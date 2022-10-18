'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process component with x-tag', async t => {
  const actual = `<x-modal></x-modal>`;
  const expected = `<div>Modal</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process component with namespace', async t => {
  const actual = `<x-dark::button>My button</x-dark::button>`;
  const expected = `<button class="bg-dark text-light">My button</button>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process component with namespace using index file', async t => {
  const actual = `<x-dark::label></x-dark::label>`;
  const expected = `<label class="bg-dark text-light">My Dark Label</label>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test(`Must process component with namespace's fallback path`, async t => {
  const actual = `<x-dark::modal></x-dark::modal>`;
  const expected = `<div>Modal</div>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components', fallback: './test/templates/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test(`Must process component with namespace's fallback path using index file`, async t => {
  const actual = `<x-dark::form></x-dark::form>`;
  const expected = `<form>My Form</form>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components', fallback: './test/templates/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test(`Must process component with namespace's custom path`, async t => {
  const actual = `<x-dark::button>My button</x-dark::button>`;
  const expected = `<button class="bg-dark-custom text-light-custom">My button</button>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components', custom: './test/templates/custom/dark/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test(`Must process component with namespace's custom path using index file`, async t => {
  const actual = `<x-dark::label></x-dark::label>`;
  const expected = `<label>My Label</label>`;

  const html = await posthtml([plugin({root: './test/templates', namespaces: [{name: 'dark', root: './test/templates/dark/components', custom: './test/templates/custom/dark/components'}]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
