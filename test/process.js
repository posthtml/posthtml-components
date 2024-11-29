import posthtml from 'posthtml';
import plugin from '../src/index.js';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

export async function process(html, options) {
  const posthtmlOptions = options.parserOptions || {};
  return await posthtml([plugin(options)]).process(html, posthtmlOptions).then(result => clean(result.html));
}
