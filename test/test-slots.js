'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process with slots', async t => {
  const actual = `<component src="layouts/base.html"><slot name="content"><h1>Content</h1></slot><slot name="footer">Footer</slot></component>`;
  const expected = `<html><head><title>Base Layout</title></head><body><main><h1>Content</h1></main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process the same component multiple times', async t => {
  const actual = `<component src="components/component.html"><slot name="title">Title</slot><slot name="body">Body</slot></component><component src="components/component.html"><slot name="title">Title 2</slot><slot name="body">Body 2</slot></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title 2</div><div>Body 2</div>`;

  const html = await posthtml([plugin({root: './test/templates/'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process multiple slots', async t => {
  const actual = `<component src="components/component-multiple-slot.html"><slot name="title">Title</slot><slot name="body">Body</slot></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process append and prepend content to slot', async t => {
  const actual = `<component src="components/component-append-prepend.html"><slot name="title" type="append"> Append</slot><slot name="body" type="prepend">Prepend </slot></component>`;
  const expected = `<div>Title Append</div><div>Prepend Body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process with slots using shorthands names syntax', async t => {
  const actual = `<component src="layouts/base.html"><slot content>Content</slot><slot footer>Footer</slot></component>`;
  const expected = `<html><head><title>Base Layout</title></head><body><main>Content</main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process append and prepend using shorthands types syntax', async t => {
  const actual = `<component src="components/component-append-prepend.html"><slot name="title" append> Append</slot><slot name="body" prepend>Prepend </slot></component>`;
  const expected = `<div>Title Append</div><div>Prepend Body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process with slots using shorthands names and types syntax together', async t => {
  const actual = `<component src="components/component-append-prepend.html"><slot title append> Append</slot><slot body prepend>Prepend </slot></component>`;
  const expected = `<div>Title Append</div><div>Prepend Body</div>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process with default slot', async t => {
  const actual = `<component src="layouts/default-slot.html">Default Slot Content<slot footer>Footer</slot></component>`;
  const expected = `<html><head><title>Default Slot Layout</title></head><body><main>Default Slot Content</main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process with default slot without defining slot tag', async t => {
  const actual = `<component src="layouts/default-slot.html"><div>Default Slot Content</div><slot footer>Footer</slot></component>`;
  const expected = `<html><head><title>Default Slot Layout</title></head><body><main><div>Default Slot Content</div></main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must process slots conditional rendering by using slot name', async t => {
  let actual = `<component src="layouts/slot-condition.html"><slot name="content"><h1>Content</h1></slot></component>`;
  let expected = `<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><p>There is not footer defined.</p></body></html>`;

  let html = await posthtml([plugin({root: './test/templates'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);

  actual = `<component src="layouts/slot-condition.html"><slot name="content"><h1>Content</h1></slot><slot name="footer">There is now footer defined</slot></component>`;
  expected = `<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><footer>There is now footer defined</footer></body></html>`;

  html = await posthtml([plugin({root: './test/templates', strict: false})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
