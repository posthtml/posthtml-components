import { test, expect } from 'vitest';
import { process } from './process.js';

test('x-tag', async () => {
  process('<x-modal></x-modal>', {root: './test/templates', folders: 'components'})
  .then(html => {
    expect(html).toBe('<div>Modal</div>');
  });
});

test('x-tag self-closing', async () => {
  process(
    '<p>first</p><x-modal /><p>last</p>',
    {
      root: './test/templates',
      folders: 'components',
      parserOptions: {
        recognizeSelfClosing: true
      }
    }
  )
    .then(html => {
      expect(html).toBe('<p>first</p><div>Modal</div><p>last</p>');
    });
});

test('x-tag with namespace', async () => {
  process(
    '<x-dark::button>My button</x-dark::button>',
    {
      root: './test/templates',
      namespaces: [{
        name: 'dark',
        root: './test/templates/dark/components'
      }]
    }
  )
    .then(html => {
      expect(html).toBe('<button class="bg-dark text-light">My button</button>');
    });
});

test('x-tag with namespace (index file)', async () => {
  process(
    '<x-dark::label></x-dark::label>',
    {
      root: './test/templates',
      namespaces: [{
        name: 'dark',
        root: './test/templates/dark/components'
      }]
    }
  )
    .then(html => {
      expect(html).toBe('<label class="bg-dark text-light">My Dark Label</label>');
    });
});

test('x-tag with namespace `fallback` path', async () => {
  process(
    '<x-dark::modal></x-dark::modal>',
    {
      root: './test/templates',
      namespaces: [{
        name: 'dark',
        root: './test/templates/dark/components',
        fallback: './test/templates/components'
      }]
    }
  )
    .then(html => {
      expect(html).toBe('<div>Modal</div>');
    });
});

test('x-tag with namespace `fallback` path (index file)', async () => {
  process(
    '<x-dark::form></x-dark::form>',
    {
      root: './test/templates',
      namespaces: [{
        name: 'dark',
        root: './test/templates/dark/components',
        fallback: './test/templates/components'
      }]
    }
  )
    .then(html => {
      expect(html).toBe('<form>My Form</form>');
    });
});

test('x-tag with namespace `custom` path', async () => {
  process(
    '<x-dark::button>My button</x-dark::button>',
    {
      root: './test/templates',
      namespaces: [{
        name: 'dark',
        root: './test/templates/dark/components',
        custom: './test/templates/custom/dark/components'
      }]
    }
  )
    .then(html => {
      expect(html).toBe('<button class="bg-dark-custom text-light-custom">My button</button>');
    });
});

test('x-tag with namespace `custom` path (index file)', async () => {
  process(
    '<x-dark::label></x-dark::label>',
    {
      root: './test/templates',
      namespaces: [{
        name: 'dark',
        root: './test/templates/dark/components',
        custom: './test/templates/custom/dark/components'
      }]
    }
  )
    .then(html => {
      expect(html).toBe('<label>My Label</label>');
    });
});
