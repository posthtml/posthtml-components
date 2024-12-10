import { test, expect } from 'vitest';
import { process } from './process.js';

test('Throws if namespace is unknown', async () => {
  await expect(() => process(
    `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`,
    { root: './test/templates', strict: true }
  )).rejects.toThrow();
});

test('Throws when push tag missing name attribute', async () => {
  await expect(() => process(
    `<div><push></push></div>`,
    {
      root: './test/templates',
      strict: true
    }
  )).rejects.toThrow();
});

test('Throws when push tag missing name attribute value', async () => {
  await expect(() => process(
    `<div><push name></push></div>`,
    { root: './test/templates', strict: true }
  )).rejects.toThrow();
});

test('Throws when component is not found (strict mode enabled)', async () => {
  await expect(() => process(
    `<div><component src="not-found.html">Submit</component></div>`,
    {
      root: './test/templates/empty-root',
      tag: 'component',
      strict: true,
    }
  )).rejects.toThrow();
});

test('Throws when component is not found in namespace (strict mode enabled)', async () => {
  await expect(() => process(
    `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`,
    {
      root: './test/templates',
      strict: true,
      namespaces: [
        {
          name: 'empty-namespace',
          root: './test/templates/empty-namespace',
        }
      ]
    }
  )).rejects.toThrow();
});

test('Returns node as-is when namespace is unknown (strict mode disabled)', async () => {
  const actual = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;

  process(actual, { root: './test/templates', strict: false })
    .then(html => {
      expect(html).toBe(actual);
    });
});

test('Returns node as-is when namespace is empty (strict mode disabled)', async () => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  process(actual,
    {
      root: './test/templates',
      strict: false,
      namespaces: [
        {
          name: 'empty-namespace',
          root: './test/templates/empty-namespace',
        }
      ]
    }
  )
    .then(html => {
      expect(html).toBe(actual);
    });
});

test('Returns node as-is when x-tag is not found (strict mode disabled)', async () => {
  const actual = `<div><x-button>Submit</x-button></div>`;

  process(actual, { root: './test/templates/empty-root', strict: false })
    .then(html => {
      expect(html).toBe(actual);
    });
});

test('Returns node as-is when component is not found (strict mode disabled)', async () => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`;

  process(actual, { tag: 'component', strict: false })
    .then(html => {
      expect(html).toBe(actual);
    });
});
