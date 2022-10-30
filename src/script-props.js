'use strict';

const vm = require('vm');
const {render} = require('posthtml-render');
const {match} = require('posthtml/lib/api');

const ctx = vm.createContext({module, require});

/**
 * Get the script tag with props from a node list and return process props.
 * Custom posthtml-expressions/lib/locals.
 *
 * @param {Array} tree Nodes
 * @param {Object} options Options
 * @return {Object} {} Locals
 */
module.exports = (tree, options) => {
  const props = {};
  const propsContext = options.props || {};
  const utilities = {...options.utilities};

  match.call(tree, {tag: 'script', attrs: {[options.propsScriptAttribute]: ''}}, node => {
    if (node.content) {
      const code = render(node.content);

      try {
        const parsedContext = vm.createContext({...utilities, ...ctx, [options.propsContext]: propsContext, $slots: options.$slots});
        const prop = vm.runInContext(code, parsedContext);

        Object.assign(props, prop);
      } catch {}
    }

    return '';
  });

  return {
    props
  };
};
