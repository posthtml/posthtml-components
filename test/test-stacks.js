'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process stacks and push', async t => {
  const actual = `<component src="layouts/base.html"><div>Main content</div><push name="head"><meta name="pushed" content="Content pushed"></push></component>`;
  const expected = `<html><head><title>Base Layout</title><meta name="pushed" content="Content pushed"></head><body><header></header><main><div>Main content</div></main><footer>footer content</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must prepend push on stack once', async t => {
  const actual = `<component src="layouts/base.html"><div>Main content</div><push name="head" prepend once><meta name="pushed" content="Content pushed"></push><push name="head" prepend once><meta name="pushed" content="Content pushed"></push></component>`;
  const expected = `<html><head><title>Base Layout</title><meta name="pushed" content="Content pushed"></head><body><header></header><main><div>Main content</div></main><footer>footer content</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
