import { test, expect } from 'vitest'
import plugin from '../src/index.js';
import posthtml from 'posthtml';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process with slots', async () => {
  const actual = `<component src="layouts/base.html"><div>Main content</div><fill:header><h1>My header</h1></fill:header><fill:footer>My footer</fill:footer></component>`;
  const expected = `<html><head><title>Base Layout</title></head><body><header><h1>My header</h1></header><main><div>Main content</div></main><footer>My footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must output default yield content when not provided', async () => {
  const actual = `<component src="components/component-default-yield.html"></component>`;
  const expected = `<div>Default yield</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process the same component multiple times', async () => {
  const actual = `<component src="components/component.html"><fill:title>Title</fill:title><fill:body>Body</fill:body></component><component src="components/component.html"><fill:title>Title 2</fill:title><fill:body>Body 2</fill:body></component>`;
  const expected = `<div>Title</div><div>Body</div><div>Title 2</div><div>Body 2</div>`;

  const html = await posthtml([plugin({root: './test/templates/', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process multiple time a slot with aware attribute', async () => {
  // With aware
  let actual = `<component src="components/component-multiple-slot.html"><fill:title aware>Title</fill:title><fill:body>Body</fill:body></component>`;
  let expected = `<div>Title</div><div>Body</div><div>Title</div>`;

  let html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);

  // Without aware
  actual = `<component src="components/component-multiple-slot.html"><fill:title>Title</fill:title><fill:body>Body</fill:body></component>`;
  expected = `<div>Title</div><div>Body</div><div></div>`;

  html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process append and prepend content to slot', async () => {
  const actual = `<component src="components/component-append-prepend.html"><fill:title append><span>Append</span></fill:title><fill:body prepend><span>Prepend</span></fill:body></component>`;
  const expected = `<div>Title<span>Append</span></div><div><span>Prepend</span>Body</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process slots conditional rendering by using slot name', async () => {
  let actual = `<component src="layouts/slot-condition.html"><h1>Content</h1></component>`;
  let expected = `<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><p>There is not footer defined.</p></body></html>`;

  let html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);

  actual = `<component src="layouts/slot-condition.html"><h1>Content</h1><fill:footer>There is now footer defined</fill:footer></component>`;
  expected = `<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><footer>There is now footer defined</footer></body></html>`;

  html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must render slots using $slots props', async () => {
  const actual = `<component src="layouts/base-render-slots-locals.html"><div>Main content</div><fill:header><h1>My header</h1></fill:header><fill:footer>My footer</fill:footer></component>`;
  const expected = `<html><head><title>Base Render Slots Locals Layout</title></head><body><header><h1>My header</h1></header><main><div>Main content</div></main><footer>My footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must merge global props passed via expressions.locals', async () => {
  const actual = `<component src="layouts/global-locals.html" anArray='["third", "fourth"]'><div>Main content</div></component>`;
  const expected = `<html><head><title>My page title</title></head><body><main><div>Main content</div></main><span>first</span><span>second</span><span>third</span><span>fourth</span></body></html>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component', expressions: {locals: {title: 'My page title', anArray: ['first', 'second']}}})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});
