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

test('Must process component with x-tag', async () => {
  const actual = `<x-modal></x-modal>`
  const expected = `<div>Modal</div>`

  expect(await process(actual, {folders: 'components'})).toBe(expected)
})

test('Must process component with namespace', async () => {
  const actual = `<x-dark::button>My button</x-dark::button>`
  const expected = `<button class="bg-dark text-light">My button</button>`

  expect(await process(actual, {
    namespaces: [{
      name: 'dark',
      root: './test/templates/dark/components'
    }]
  })).toBe(expected)
})

test('Must process component with namespace using index file', async () => {
  const actual = `<x-dark::label></x-dark::label>`
  const expected = `<label class="bg-dark text-light">My Dark Label</label>`

  expect(await process(actual, {
    namespaces: [{
      name: 'dark',
      root: './test/templates/dark/components'
    }]
  })).toBe(expected)
})

test(`Must process component with namespace's fallback path`, async () => {
  const actual = `<x-dark::modal></x-dark::modal>`
  const expected = `<div>Modal</div>`

  expect(await process(actual, {
    namespaces: [{
      name: 'dark',
      root: './test/templates/dark/components',
      fallback: './test/templates/components'
    }]
  })).toBe(expected)
})

test(`Must process component with namespace's fallback path using index file`, async () => {
  const actual = `<x-dark::form></x-dark::form>`
  const expected = `<form>My Form</form>`

  expect(await process(actual, {
    namespaces: [{
      name: 'dark',
      root: './test/templates/dark/components',
      fallback: './test/templates/components'
    }]
  })).toBe(expected)
})

test(`Must process component with namespace's custom path`, async () => {
  const actual = `<x-dark::button>My button</x-dark::button>`
  const expected = `<button class="bg-dark-custom text-light-custom">My button</button>`

  expect(await process(actual, {
    namespaces: [{
      name: 'dark',
      root: './test/templates/dark/components',
      custom: './test/templates/custom/dark/components'
    }]
  })).toBe(expected)
})

test(`Must process component with namespace's custom path using index file`, async () => {
  const actual = `<x-dark::label></x-dark::label>`
  const expected = `<label>My Label</label>`

  expect(await process(actual, {
    namespaces: [{
      name: 'dark',
      root: './test/templates/dark/components',
      custom: './test/templates/custom/dark/components'
    }]
  })).toBe(expected)
})

test('Must process self-closing component x-tag', async () => {
  const actual = `<p>first</p><x-modal /><p>last</p>`
  const expected = `<p>first</p><div>Modal</div><p>last</p>`

  const html = await posthtml([
    plugin({root: './test/templates', folders: 'components'})
  ]).process(actual, {recognizeSelfClosing: true}).then(result => clean(result.html))

  expect(html).toBe(expected)
})
