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

test('Must process stacks and push', async () => {
  const actual = `<component src="layouts/base.html"><div>Main content</div><push name="head"><meta name="pushed" content="Content pushed"></push></component>`
  const expected = `<html><head><title>Base Layout</title><meta name="pushed" content="Content pushed"></head><body><header></header><main><div>Main content</div></main><footer>footer content</footer></body></html>`

  expect(await process(actual)).toBe(expected)
})

test('Must prepend push on stack once', async () => {
  const actual = `<component src="layouts/base.html"><div>Main content</div><push name="head" prepend once><meta name="pushed" content="Content pushed"></push><push name="head" prepend once><meta name="pushed" content="Content pushed"></push></component>`
  const expected = `<html><head><title>Base Layout</title><meta name="pushed" content="Content pushed"></head><body><header></header><main><div>Main content</div></main><footer>footer content</footer></body></html>`

  expect(await process(actual)).toBe(expected)
})
