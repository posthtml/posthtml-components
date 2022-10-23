'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must fail when namespace is unknown', async t => {
  const actual = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;

  await t.throwsAsync(async () => posthtml([plugin({root: './test/templates', strict: true})]).process(actual).then(result => clean(result.html)));
});

test('Must return node as-is when namespace is unknown with strict mode disabled', async t => {
  const actual = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;
  const expected = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;

  const html = await posthtml([plugin({root: './test/templates', strict: false})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must return node as-is when namespace is empty with strict mode disabled', async t => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;
  const expected = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  const html = await posthtml([plugin({root: './test/templates', strict: false, namespaces: {name: 'empty-namespace', root: './test/templates/empty-namespace'}})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must return node as-is when x-tag is not found with strict mode disabled', async t => {
  const actual = `<div><x-button>Submit</x-button></div>`;
  const expected = `<div><x-button>Submit</x-button></div>`;

  const html = await posthtml([plugin({root: './test/templates/empty-root', strict: false})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must return node as-is when component is not found with strict mode disabled', async t => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`;
  const expected = `<div><component src="not-found.html">Submit</component></div>`;

  const html = await posthtml([plugin({tag: 'component', strict: false})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must fail when component is not found with strict mode enabled', async t => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`;

  await t.throwsAsync(async () => posthtml([plugin({root: './test/templates/empty-root', tag: 'component', strict: true})]).process(actual).then(result => clean(result.html)));
});

test('Must fail when component is not found in defined namespace with strict mode enabled', async t => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  await t.throwsAsync(async () => posthtml([plugin({root: './test/templates', strict: true, namespaces: [{name: 'empty-namespace', root: './test/templates/empty-namespace'}]})]).process(actual).then(result => clean(result.html)));
});

test('Must fail when push tag missing name', async t => {
  const actual = `<div><push></push></div>`;

  await t.throwsAsync(async () => posthtml([plugin({root: './test/templates', strict: true})]).process(actual).then(result => clean(result.html)));
});
