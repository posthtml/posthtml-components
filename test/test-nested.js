import { test, expect } from 'vitest';
import { process } from './process.js';

test('Nested components', async () => {
  process(
    `<div><x-nested-one></x-nested-one></div>`,
    { root: './test/templates/components' }
  ).then(html => {
    expect(html).toBe(`<div><div class="nested-one"><div class="nested-two"><div class="nested-three">Nested works!</div></div></div></div>`);
  });
});

test('Nested component with slots', async () => {
  process(
    `<x-nested-one-slot><x-nested-two-slot>yield content<fill:before2>nested-two before</fill:before2><fill:after2>nested-two after</fill:after2></x-nested-two-slot><fill:before>nested-one before</fill:before><fill:after>nested-one after</fill:after></x-nested-one-slot>`,
    {
      root: './test/templates/components',
    }
  ).then(html => {
    expect(html).toBe(`<div class="nested-one"><div class="nested-one-before">nested-one before</div><div class="nested-one-yield"><div class="nested-two"><div class="nested-two-before">nested-two before</div><div class="nested-two-yield">yield content</div><div class="nested-two-after">nested-two after</div></div></div><div class="nested-one-after">nested-one after</div></div>`);
  });
});
