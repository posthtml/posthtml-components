import posthtml from 'posthtml';
import plugin from '../src/index.js';

const clean = html => html.replace(/(\n|\t)/g, '').trim();

export async function process(html, options) {
  return await posthtml([plugin(options)]).process(html).then(result => clean(result.html));
}
