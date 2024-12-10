import { test, expect } from 'vitest';
import { process } from './process.js';

test('Slots', async () => {
  process(
    `<component src="layouts/base.html"><div>Main content</div><fill:header><h1>My header</h1></fill:header><fill:footer>My footer</fill:footer></component>`,
    {
      root: './test/templates',
      tag: 'component'}
    )
    .then(html => {
      expect(html).toBe(`<html><head><title>Base Layout</title></head><body><header><h1>My header</h1></header><main><div>Main content</div></main><footer>My footer</footer></body></html>`);
    });
});

test('Outputs default `yield` content when not provided', async () => {
  process(
    `<component src="components/component-default-yield.html"></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<div>Default yield</div>`);
    });
});

test('Processes the same component multiple times', async () => {
  process(
    `<component src="components/component.html"><fill:title>Title</fill:title><fill:body>Body</fill:body></component><component src="components/component.html"><fill:title>Title 2</fill:title><fill:body>Body 2</fill:body></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<div>Title</div><div>Body</div><div>Title 2</div><div>Body 2</div>`);
    });
});

test('Multiple slots with `aware`', async () => {
  // With `aware`
  process(
    `<component src="components/component-multiple-slot.html"><fill:title aware>Title</fill:title><fill:body>Body</fill:body></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<div>Title</div><div>Body</div><div>Title</div>`);
    });

  // Without `aware`
  process(
    `<component src="components/component-multiple-slot.html"><fill:title>Title</fill:title><fill:body>Body</fill:body></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<div>Title</div><div>Body</div><div></div>`);
    });
});

test('Slots with `append` and `prepend` attributes', async () => {
  process(
    `<component src="components/component-append-prepend.html"><fill:title append><span>Append</span></fill:title><fill:body prepend><span>Prepend</span></fill:body></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<div>Title<span>Append</span></div><div><span>Prepend</span>Body</div>`);
    });
});

test('Conditional rendering of slots based on slot name', async () => {
  process(
    `<component src="layouts/slot-condition.html"><h1>Content</h1></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><p>There is not footer defined.</p></body></html>`);
    });

  process(
    `<component src="layouts/slot-condition.html"><h1>Content</h1><fill:footer>There is now footer defined</fill:footer></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<html><head><title>Slot Condition Layout</title></head><body><main><h1>Content</h1></main><footer>There is now footer defined</footer></body></html>`);
    });
});

test('Render slots using `$slots` props', async () => {
  process(
    `<component src="layouts/base-render-slots-locals.html"><div>Main content</div><fill:header><h1>My header</h1></fill:header><fill:footer>My footer</fill:footer></component>`,
    {
      root: './test/templates',
      tag: 'component'
    }
  )
    .then(html => {
      expect(html).toBe(`<html><head><title>Base Render Slots Locals Layout</title></head><body><header><h1>My header</h1></header><main><div>Main content</div></main><footer>My footer</footer></body></html>`);
    });
});

test('Merges global props passed via `expressions.locals`', async () => {
  process(
    `<component src="layouts/global-locals.html" anArray='["third", "fourth"]'><div>Main content</div></component>`,
    {
      root: './test/templates',
      tag: 'component',
      expressions: {
        locals: {
          title: 'My page title',
          anArray: ['first', 'second']
        }
      }
    }
  )
    .then(html => {
      expect(html).toBe(`<html><head><title>My page title</title></head><body><main><div>Main content</div></main><span>first</span><span>second</span><span>third</span><span>fourth</span></body></html>`);
    });
});
