import { test, expect } from 'vitest'
import plugin from '../src/index.js';
import posthtml from 'posthtml';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

test('Must process layout with props', async () => {
  const actual = `<component src="layouts/base-locals.html" props='{ "title": "My Page" }'><div>Content</div><fill:footer>Footer</fill:footer></component>`;
  const expected = `<html><head><title>My Page</title></head><body><main><div>Content</div></main><footer>Footer</footer></body></html>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process attributes as props', async () => {
  const actual = `<component src="components/component-locals.html" title="My Component Title" body="Content"><fill:body prepend><span>Body</span></fill:body></component>`;
  const expected = `<div><h1>My Component Title</h1></div><div><span>Body</span>Content</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process component with props as JSON and string', async () => {
  const actual = `<component src="components/component-locals-json-and-string.html"
                    titles='{ "suptitle": "This is custom suptitle" }'
                    title="Custom title from JSON and String"
                    items='["another item", "yet another"]'
                    myboolean="true"
                    merge:props='{ "items": ["first item", "second item"] }'></component>`;
  const expected = `<div><div>myboolean is true</div><div><h1>Custom title from JSON and String</h1></div><div><span>another item</span><span>yet another</span><span>first item</span><span>second item</span></div><div><span>title: This is default main title</span><span>subtitle: This is default subtitle</span><span>suptitle: This is custom suptitle</span></div></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process parent and child props via component', async () => {
  const actual = `<x-parent aString="I am custom aString for PARENT via component (1)"><x-child></x-child></x-parent>`;
  const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: My String Child  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must has access to $slots in script props', async () => {
  const actual = `<x-script-locals><fill:filled>filled slot content...</fill:filled></x-script-locals>`;
  const expected = `{"filled":{"filled":true,"rendered":false,"tag":"fill:filled","attrs":{},"content":["filled slot content..."],"source":"filled slot content...","props":{}}}<div>{"filled":{"filled":true,"rendered":false,"tag":"fill:filled","attrs":{},"content":["filled slot content..."],"source":"filled slot content...","props":{}}}</div><div><h1>Default title</h1></div><div>filled slot content...</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must pass props from parent to child via aware', async () => {
  const actual = `<x-parent aware:aString="I am custom aString for PARENT via component (1)"><x-child></x-child></x-parent>`;
  const expected = `PARENT:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>CHILD:<div>  aBoolean  value: true  type: boolean  aString  value: I am custom aString for PARENT via component (1)  type: string  aString2  value: I am not string 2  type: string  anArray  value: ["one","two","three"]  type: object  anObject  value: {"one":"One","two":"Two","three":"Three"}  type: object  anArray2  value: ["one2","two2","three2"]  type: object  anObject2  value: {"one":"One2","two":"Two2","three":"Three2"}  type: object</div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process default, merged and override props', async () => {
  const actual = `<component src="components/component-locals-type.html"
    aStringOverride="My override string changed"
    anObjectOverride='{ "third": "Third override item", "fourth": "Fourth override item" }'
    anObjectMerged='{ "third": "Third merged item", "fourth": "Fourth merged item" }'></component>`;

  const expected = `<div>  <h1>anObjectDefault</h1>      <p><strong>first</strong>: First default item</p>      <p><strong>second</strong>: Second default item</p>    <h1>anObjectOverride</h1>      <p><strong>third</strong>: Third override item</p>      <p><strong>fourth</strong>: Fourth override item</p>    <h1>anObjectMerged</h1>      <p><strong>first</strong>: First merged item</p>      <p><strong>second</strong>: Second merged item</p>      <p><strong>third</strong>: Third merged item</p>      <p><strong>fourth</strong>: Fourth merged item</p>    <h1>aStringDefault</h1>  <p>My default string</p>  <h1>aStringOverride</h1>  <p>My override string changed</p></div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process slot with props', async () => {
  const actual = `<component src="components/slot-with-locals.html"><fill:name mySlotLocal=" Via Slot" prepend>My Local</fill:name></component>`;
  const expected = `<div>My Local Via Slot</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process props with custom options', async () => {
  const actual = `<component src="components/custom-props-options.html" title="My Component Title" body="Content" locals='{ "prop": "My prop via locals attribute" }'><fill:body slotProp="My slot prop" prepend><span>Body</span></fill:body></component>`;
  const expected = `<div><h1>My Component Title</h1></div><div><span>Body</span>Content-My slot prop</div><div>My prop via locals attribute</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component', propsScriptAttribute: 'locals', propsContext: 'locals', propsAttribute: 'locals', propsSlot: 'locals'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process components with script file', async () => {
  const actual = `<component src="components/component-script-file.html" myStringProp="My custom string prop" myObjectProp='{ "one": "New one value", "three": "New third value" }'></component>`;
  const expected = `<div>A default string</div><div>My custom string prop</div><div>{"one":"New one value","three":"New third value"}</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must process components with invalid script file', async () => {
  const actual = `<component src="components/invalid-script-file.html"></component>`;
  const expected = `<div>Component content (undefined)</div>`;

  const html = await posthtml([plugin({root: './test/templates', tag: 'component'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});

test('Must reset not nested aware props that it', async () => {
  const actual = `
<x-parent-aware aware:myprop="I am aware prop"><x-child-aware></x-child-aware><x-child-aware></x-child-aware></x-parent-aware>
<x-parent-aware><x-child-aware></x-child-aware></x-parent-aware>
`;
  const expected = `<div><div>I am aware prop</div><div>I am aware prop</div></div><div><div>Default prop</div></div>`;

  const html = await posthtml([plugin({root: './test/templates/components'})]).process(actual).then(result => clean(result.html));

  expect(html).toBe(expected);
});
