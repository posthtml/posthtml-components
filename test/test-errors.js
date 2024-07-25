import { test, expect } from 'vitest'
import plugin from '../src/index.js';
import posthtml from 'posthtml';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must fail when namespace is unknown', async () => {
  const actual = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;

  await expect(() => posthtml([plugin({ root: './test/templates', strict: true })]).process(actual).then(result => clean(result.html)))
    .rejects.toThrow()
});

test('Must return node as-is when namespace is unknown with strict mode disabled', async () => {
  const actual = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;
  const expected = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`;

  const html = await posthtml([plugin({root: './test/templates', strict: false})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must return node as-is when namespace is empty with strict mode disabled', async () => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;
  const expected = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  const html = await posthtml([plugin({root: './test/templates', strict: false, namespaces: {name: 'empty-namespace', root: './test/templates/empty-namespace'}})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must return node as-is when x-tag is not found with strict mode disabled', async () => {
  const actual = `<div><x-button>Submit</x-button></div>`;
  const expected = `<div><x-button>Submit</x-button></div>`;

  const html = await posthtml([plugin({root: './test/templates/empty-root', strict: false})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must return node as-is when component is not found with strict mode disabled', async () => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`;
  const expected = `<div><component src="not-found.html">Submit</component></div>`;

  const html = await posthtml([plugin({tag: 'component', strict: false})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must fail when component is not found with strict mode enabled', async () => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`;

  await expect(() => posthtml([plugin({ root: './test/templates/empty-root', tag: 'component', strict: true })]).process(actual).then(result => clean(result.html)))
    .rejects.toThrow()
});

test('Must fail when component is not found in defined namespace with strict mode enabled', async () => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`;

  await expect(() => posthtml([
    plugin({root: './test/templates', strict: true, namespaces: [{name: 'empty-namespace', root: './test/templates/empty-namespace'}]})
  ])
    .process(actual)
    .then(result => clean(result.html))
  ).rejects.toThrow()
});

test('Must fail when push tag missing name attribute', async () => {
  const actual = `<div><push></push></div>`;

  await expect(() => posthtml([
    plugin({root: './test/templates', strict: true})
  ])
    .process(actual)
    .then(result => clean(result.html))
  ).rejects.toThrow();
});

test('Must fail when push tag missing name attribute value', async () => {
  const actual = `<div><push name></push></div>`;

  await expect(async () => posthtml([plugin({root: './test/templates', strict: true})]).process(actual).then(result => clean(result.html)))
    .rejects.toThrow();
});
