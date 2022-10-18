'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process with slots', async t => {
  const actual = `<component src="layouts/base.html"><div>Main content</div><slot:header><h1>My header</h1></slot:header><slot:footer>My footer</slot:footer></component>`;
  const expected = `<html><head><title>Base Layout</title></head><body><header><h1>My header</h1></header><main><div>Main content</div></main><footer>My footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process the same component multiple times', async t => {
  const actual = `<component src="components/component.html"><slot:title>Title</slot:title><slot:body>Body</slot:body></component><component src="components/component.html"><slot:title>Title 2</slot:title><slot:body>Body 2</slot:body></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title 2</div><div>Body 2</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process multiple time a slot with aware attribute', async t => {
  // With aware
  let actual = `<component src="components/component-multiple-slot.html"><slot:title aware>Title</slot:title><slot:body>Body</slot:body></component>`;
  let expected = `<div>Title</div><div>Body</div><div>Title</div>`;

  let html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);

  // Without aware
  actual = `<component src="components/component-multiple-slot.html"><slot:title>Title</slot:title><slot:body>Body</slot:body></component>`;
  expected = `<div>Title</div><div>Body</div><div></div>`;

  html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process append and prepend content to slot', async t => {
  const actual = `<component src="components/component-append-prepend.html"><slot:title append><span>Append</span></slot:title><slot:body prepend><span>Prepend</span></slot:body></component>`;
  const expected = `<div>Title<span>Append</span></div><div><span>Prepend</span>Body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process slots conditional rendering by using slot name', async t => {
  let actual = `<component src="layouts/slot-condition.html"><h1>Content</h1></component>`;
  let expected = `<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><p>There is not footer defined.</p></body></html>`;

  let html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);

  actual = `<component src="layouts/slot-condition.html"><h1>Content</h1><slot:footer>There is now footer defined</slot:footer></component>`;
  expected = `<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><footer>There is now footer defined</footer></body></html>`;

  html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must render slots using $slots locals', async t => {
  const actual = `<component src="layouts/base-render-slots-locals.html"><div>Main content</div><slot:header><h1>My header</h1></slot:header><slot:footer>My footer</slot:footer></component>`;
  const expected = `<html><head><title>Base Render Slots Locals Layout</title></head><body><header><h1>My header</h1></header><main><div>Main content</div></main><footer>My footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
