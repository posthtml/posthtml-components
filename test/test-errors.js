import { test, expect } from 'vitest'
import posthtml from 'posthtml'
import plugin from '../src/index.js'

const clean = html => html.replace(/\s{2,}/g, '').replace(/\n/g, '').trim()

const process = (html = '', options = {}, log = false) => {
  options = {root: './test/templates', tag: 'component', ...options}

  return posthtml([plugin(options)])
    .process(html)
    .then(result => log ? console.log(result.html) : clean(result.html))
}

test('Must fail when namespace is unknown', async () => {
  await expect(process(`<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`)).rejects.toThrow()
})

test('Must return node as-is when namespace is unknown with strict mode disabled', async () => {
  const actual = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`
  const expected = `<div><x-unknown-namespace::button>Submit</x-unknown-namespace::button></div>`

  expect(await process(actual, {strict: false})).toBe(expected)
})

test('Must return node as-is when namespace is empty with strict mode disabled', async () => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`
  const expected = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`

  expect(await process(actual, {
    strict: false,
    namespaces: [
      {
        name: 'empty-namespace',
        root: './test/templates/empty-namespace'
      }
    ]})
  ).toBe(expected)
})

test('Must return node as-is when x-tag is not found with strict mode disabled', async () => {
  const actual = `<div><x-button>Submit</x-button></div>`
  const expected = `<div><x-button>Submit</x-button></div>`

  expect(await process(actual, {strict: false})).toBe(expected)
})

test('Must return node as-is when component is not found with strict mode disabled', async () => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`
  const expected = `<div><component src="not-found.html">Submit</component></div>`
  expect(await process(actual, {strict: false})).toBe(expected)
})

test('Must fail when component is not found with strict mode enabled', async () => {
  const actual = `<div><component src="not-found.html">Submit</component></div>`;

  await expect(process(actual, {root: './test/templates/empty-root', strict: true})).rejects.toThrow()
})

test('Must fail when component is not found in defined namespace with strict mode enabled', async () => {
  const actual = `<div><x-empty-namespace::button>Submit</x-empty-namespace::button></div>`

  await expect(process(actual, {
    strict: true,
    namespaces: [
      {
        name: 'empty-namespace',
        root: './test/templates/empty-namespace'
      }
    ]
  })).rejects.toThrow()
})

test('Must fail when push tag missing name attribute', async () => {
  const actual = `<div><push></push></div>`

  await expect(process(actual, {strict: true})).rejects.toThrow()
})

test('Must fail when push tag missing name attribute value', async () => {
  const actual = `<div><push name></push></div>`

  await expect(process(actual, {strict: true})).rejects.toThrow()
})
