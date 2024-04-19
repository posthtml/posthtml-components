import { test, expect } from 'vitest'
import posthtml from 'posthtml'
import include from 'posthtml-include'
import plugin from '../src/index.js'

const clean = html => html.replace(/\s{2,}/g, '').replace(/\n/g, '').trim()

test('Must include file using posthtml-include', async () => {
  const actual = `<component src="components/component-with-include.html"></component>`
  const expected = `<div><p>Included file</p></div>`

  const html = await posthtml([
    plugin({
      root: './test/templates',
      tag: 'component',
      attribute: 'src',
      plugins: [
        include({
          root: './test/templates',
          cwd: './test/templates',
          encoding: 'utf8'
        })
      ]
    })])
      .process(actual)
      .then(result => clean(result.html))

  expect(html).toBe(expected)
})
