'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process all nested component to html', async t => {
  const actual = `<div><x-nested-one></x-nested-one></div>`;
  const expected = `<div><div class="nested-one"><div class="nested-two"><div class="nested-three">Nested works!</div></div></div></div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process all nested component with slots to html', async t => {
  const actual = `<div><x-nested-one-slot><x-nested-two-slot>nested-two content<slot before>nested-two before</slot><slot after>nested-two after</slot></x-nested-two-slot><slot before>nested-one before</slot><slot after>nested-one after</slot></x-nested-one-slot></div>`;
  const expected = `<div><div class="nested-one">  nested-one before  <div>  nested-two before  nested-two content  nested-two after</div>  nested-one after</div></div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
