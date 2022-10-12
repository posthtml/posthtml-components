'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must fail when namespace path is not found without fallback root', async t => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  await t.throwsAsync(async () => posthtml([plugin({root: './test/templates', namespaces: [{name: 'empty-namespace', root: './test/templates/empty-namespace'}]})]).process(actual).then(result => clean(result.html)));
});

test('Must fail when namespace path is not found with fallback root', async t => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  await t.throwsAsync(async () => posthtml([plugin({root: './test/templates', namespaces: [{name: 'empty-namespace', root: './test/templates/empty-namespace'}]})]).process(actual).then(result => clean(result.html)));
});
