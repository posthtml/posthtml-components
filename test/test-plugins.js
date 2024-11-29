import { test, expect } from 'vitest';
import { process } from './process.js';

test('posthtml-include', async () => {
  process(
    `<component src="components/component-with-include.html"></component>`,
    {
      root: './test/templates',
      tag: 'component',
      attribute: 'src',
      plugins: [
        require('posthtml-include')({
          root: './test/templates',
          cwd: './test/templates',
          encoding: 'utf8'
        })
      ]
    }
  )
    .then(html => {
      expect(html).toBe('<div><p>Included file</p></div>');
    });
});

// test.skip('Must work with posthtml-extend syntax', async () => {
//   const actual = `<extends src="layouts/extend.html"><block name="content">My Content</block></extends>`;
//   const expected = `<html><head><title>Extend Layout</title></head><body><main>My Content</main><footer>footer content</footer></body></html>`;

//   const html = await posthtml([plugin({root: './test/templates', tag: 'extends', attribute: 'src', slot: 'block', fill: 'block'})]).process(actual).then(result => clean(result.html));

//   expect(html).toBe(expected);
// });

// test.skip('Must work with posthtml-modules syntax', async () => {
//   const actual = `<module href="components/module.html">My Module Content</module>`;
//   const expected = `<div>My Module Content</div>`;

//   const html = await posthtml([plugin({root: './test/templates', tagName: 'module', attribute: 'href', slotTagName: 'content'})]).process(actual).then(result => clean(result.html));

//   expect(html).toBe(expected);
// });

// test.skip('Must work with posthtml-extend and posthtml-modules syntax together', async () => {
//   const actual = `<extends src="layouts/extend-with-module.html"><block name="content"><module href="components/module-with-extend.html">My Module Content</module></block></extends>`;
//   const expected = `<html><head><title>Extend With Module Layout</title></head><body><main><div>My Module Content</div></main><footer>footer content</footer></body></html>`;

//   const html = await posthtml([plugin({root: './test/templates', tagNames: ['extends', 'module'], attributes: ['src', 'href'], slotTagName: 'block', fillTagName: 'block', fallbackSlotTagName: true})]).process(actual).then(result => clean(result.html));

//   expect(html).toBe(expected);
// });

// // Unfortunately it's not working
// test.skip('Must include file using posthtml-modules', async () => {
//   const actual = `<component src="components/component-with-module.html"></component>`;
//   const expected = `<div><p>Module file</p></div>`;

//   const html = await posthtml([plugin({root: './test/templates', tag: 'component', attribute: 'src', plugins: [require('posthtml-modules')({root: './test/templates'})]})]).process(actual).then(result => clean(result.html));

//   expect(html).toBe(expected);
// });
