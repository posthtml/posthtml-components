'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

// test('Must work with posthtml-extend syntax', async t => {
//   const actual = `<extends src="layouts/extend.html"><block name="content">My Content</block></extends>`;
//   const expected = `<html><head><title>Extend Layout</title></head><body><main>My Content</main><footer>footer content</footer></body></html>`;
//
//   const html = await posthtml([plugin({root: './test/templates', tagName: 'extends', attribute: 'src', slotTagName: 'block', fillTagName: 'block'})]).process(actual).then(result => clean(result.html));
//
//   t.is(html, expected);
// });
//
// test('Must work with posthtml-modules syntax', async t => {
//   const actual = `<module href="components/module.html">My Module Content</module>`;
//   const expected = `<div>My Module Content</div>`;
//
//   const html = await posthtml([plugin({root: './test/templates', tagName: 'module', attribute: 'href', slotTagName: 'content'})]).process(actual).then(result => clean(result.html));
//
//   t.is(html, expected);
// });
//
// test('Must work with posthtml-extend and posthtml-modules syntax together', async t => {
//   const actual = `<extends src="layouts/extend-with-module.html"><block name="content"><module href="components/module-with-extend.html">My Module Content</module></block></extends>`;
//   const expected = `<html><head><title>Extend With Module Layout</title></head><body><main><div>My Module Content</div></main><footer>footer content</footer></body></html>`;
//
//   const html = await posthtml([plugin({root: './test/templates', tagNames: ['extends', 'module'], attributes: ['src', 'href'], slotTagName: 'block', fillTagName: 'block', fallbackSlotTagName: true})]).process(actual).then(result => clean(result.html));
//
//   t.is(html, expected);
// });

test('Must include file using posthtml-include', async t => {
  const actual = `<component src="components/component-with-include.html"></component>`;
  const expected = `<div><p>Included file</p></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component', attribute: 'src', plugins: [require('posthtml-include')({root: './test/templates', encoding: 'utf8'})]})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

// Unfortunately it's not working
// test('Must include file using posthtml-modules', async t => {
//   const actual = `<component src="components/component-with-module.html"></component>`;
//   const expected = `<div><p>Module file</p></div>`;
//
//   const html = await posthtml([plugin({root: './test/templates', tag: 'component', attribute: 'src', plugins: [require('posthtml-modules')({root: './test/templates'})]})]).process(actual).then(result => clean(result.html));
//
//   t.is(html, expected);
// });
