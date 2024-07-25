import { test, expect } from 'vitest'
import plugin from '../src/index.js';
import posthtml from 'posthtml';
import pull from 'lodash/pull';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must merge and map attributes not props to first node', async () => {
  const actual = `<component src="components/component-mapped-attributes.html" data-something="Test an attribute" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component>`;
  const expected = `<div class="text-dark m-3 bg-light p-2" style="background: red; display: flex; font-size: 20px" data-something="Test an attribute">My Title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must merge and map attributes not props to node with attribute "attributes" without style', async () => {
  const actual = `<component src="components/component-mapped-attributes2.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component>`;
  const expected = `<div class="mapped"><div class="text-dark m-3 bg-light p-2" style="display: flex; font-size: 20px">My Title Default body</div></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must merge and map attributes not props to node with attribute "attributes" without class', async () => {
  const actual = `<component src="components/component-mapped-attributes3.html" title="My Title" class="bg-light p-2" style="display: block; font-size: 20px"></component>`;
  const expected = `<div class="mapped"><div style="border: 1px solid black; display: block; font-size: 20px" class="bg-light p-2">My Title Default body</div></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must not map attributes for component without any elements', async () => {
  const actual = `<div><component src="components/component-without-elements.html" title="My Title" class="bg-light p-2" style="display: flex; font-size: 20px"></component></div>`;
  const expected = `<div>I am a component without any elements. Yeah, something uncommon but just for testing. My Title</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must override class and style attributes', async () => {
  const actual = `<component src="components/component-mapped-attributes.html" override:class="override-class" override:style="background: black"></component>`;
  const expected = `<div class="override-class" style="background: black">Default title Default body</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must remove an attributes that has "undefined" or "null" value', async () => {
  const actual = `<component src="components/remove-attributes.html" tabindex="-1">My button</component>`;
  const expected = `<button class="btn btn-primary" data-bs-dismiss="true" data-bs-backdrop="false" tabindex="-1">My button</button><div>works also in all nodes</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must override valid attributes', async () => {
  const actual = `<component src="components/override-attributes.html" tabindex="-1" title="My button" custom-attribute="A custom attribute">My button</component>`;
  const expected = `<button tabindex="-1" custom-attribute="A custom attribute">My button</button>`;

  const html = await posthtml([plugin({
    root: './test/templates',
    tag: 'component',
    elementAttributes: {
      BUTTON: attrs => {
        // Remove title
        pull(attrs, 'title');

        // Add custom-attribute
        attrs.push('custom-attribute');

        return attrs;
      }
    }
  })]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must work with tag without attributes', async () => {
  const actual = `<component src="components/override-attributes.html" tabindex="-1" title="My button" custom-attribute="A custom attribute">My button</component>`;
  const expected = `<button>My button</button>`;

  const html = await posthtml([plugin({
    root: './test/templates',
    tag: 'component',
    elementAttributes: {
      BUTTON: _ => {
        // Return empty array means no attributes
        return [];
      }
    }
  })]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must use safelist and blacklist', async () => {
  const actual = `<component src="components/override-attributes.html" tabindex="-1" title="My button" custom-attribute="A custom attribute">My button</component>`;
  const expected = `<button custom-attribute="A custom attribute">My button</button>`;

  const html = await posthtml([plugin({
    root: './test/templates',
    tag: 'component',
    safelistAttributes: ['custom-attribute'],
    blacklistAttributes: ['role', 'tabindex']
  })]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});
