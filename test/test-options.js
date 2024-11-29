import { test, expect } from 'vitest'
import { process } from './process.js';

test('`fileExtension` as string', async () => {
  process(
    `<x-md-layout>test</x-md-layout>`,
    {
      root: './test/templates',
      folders: ['layouts'],
      fileExtension: 'md'
    }).then(html => {
    expect(html).toBe('test');
  })
});

test('`fileExtension` as array', async () => {
  process(
    `<x-md-layout>test</x-md-layout>`,
    {
      root: './test/templates',
      folders: ['layouts'],
      fileExtension: ['html', 'md']
    }).then(html => {
    expect(html).toBe('test');
  })
});
