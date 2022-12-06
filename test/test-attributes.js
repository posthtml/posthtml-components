'use strict';

const test = require('ava');
const plugin = require('../src');
const posthtml = require('posthtml');
const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must merge and map attributes not props to first node', async t => {
  const actual = `<component src="components/component-mapped-attributes.html" data-something="Test an attribute" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component>`;
  const expected = `<div class="text-dark m-3 bg-light p-2" style="background: red; display: flex; font-size: 20px" data-something="Test an attribute">My Title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must merge and map attributes not props to node with attribute "attributes" without style', async t => {
  const actual = `<component src="components/component-mapped-attributes2.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component>`;
  const expected = `<div class="mapped"><div class="text-dark m-3 bg-light p-2" style="display: flex; font-size: 20px">My Title Default body</div></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must merge and map attributes not props to node with attribute "attributes" without class', async t => {
  const actual = `<component src="components/component-mapped-attributes3.html" title="My Title" class="bg-light p-2" style="display: block; font-size: 20px"></component>`;
  const expected = `<div class="mapped"><div style="border: 1px solid black; display: block; font-size: 20px" class="bg-light p-2">My Title Default body</div></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must not map attributes for component without any elements', async t => {
  const actual = `<div><component src="components/component-without-elements.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component></div>`;
  const expected = `<div>I am a component without any elements. Yeah, something uncommon but just for testing. My Title</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must override class and style attributes', async t => {
  const actual = `<component src="components/component-mapped-attributes.html" override:class="override-class" override:style="background: black"></component>`;
  const expected = `<div class="override-class" style="background: black">Default title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});

test('Must remove an attributes that has "undefined" or "null" value', async t => {
  const actual = `<component src="components/remove-attributes.html" tabindex="-1">My button</component>`;
  const expected = `<button class="btn btn-primary" data-bs-dismiss="true" data-bs-backdrop="false" tabindex="-1">My button</button><div>works also in all nodes</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  t.is(html, expected);
});
