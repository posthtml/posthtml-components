import { test, expect } from 'vitest'
import plugin from '../src/index.js';
import posthtml from 'posthtml';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process all nested component to html', async () => {
  const actual = `<div><x-nested-one></x-nested-one></div>`;
  const expected = `<div><div class="nested-one"><div class="nested-two"><div class="nested-three">Nested works!</div></div></div></div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process all nested component with slots to html', async () => {
  const actual = `<x-nested-one-slot><x-nested-two-slot>yield content<fill:before2>nested-two before</fill:before2><fill:after2>nested-two after</fill:after2></x-nested-two-slot><fill:before>nested-one before</fill:before><fill:after>nested-one after</fill:after></x-nested-one-slot>`;
  const expected = `<div class="nested-one"><div class="nested-one-before">nested-one before</div><div class="nested-one-yield"><div class="nested-two"><div class="nested-two-before">nested-two before</div><div class="nested-two-yield">yield content</div><div class="nested-two-after">nested-two after</div></div></div><div class="nested-one-after">nested-one after</div></div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});
