import { test, expect } from 'vitest';
import { process } from './process.js';

test('`stack` and `push` tags', async () => {
  process(
    `<component src="layouts/base.html"><div>Main content</div><push name="head"><meta name="pushed" content="Content pushed"></push></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<html><head><title>Base Layout</title><meta name="pushed" content="Content pushed"></head><body><header></header><main><div>Main content</div></main><footer>footer content</footer></body></html>`);
    });
});

test('`prepend` and `once` attributes on `push` tag', async () => {
  process(
    `<component src="layouts/base.html"><div>Main content</div><push name="head" prepend once><meta name="pushed" content="Content pushed"></push><push name="head" prepend once><meta name="pushed" content="Content pushed"></push></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<html><head><title>Base Layout</title><meta name="pushed" content="Content pushed"></head><body><header></header><main><div>Main content</div></main><footer>footer content</footer></body></html>`);
    });
});
