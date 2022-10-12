'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must playground works', async t => {
  const actual = `<component src="layouts/playground.html"><div><div>My Main Content</div></div><slot name="footer">Footer</slot></component>`;
  const expected = `<html><head><title>Playground Layout</title></head><body><main><div><div>My Main Content</div></div></main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
