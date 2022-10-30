'use strict';

const vm = require('vm');
const {existsSync, readFileSync} = require('fs');
const {render} = require('posthtml-render');
const {match} = require('posthtml/lib/api');
const {isEmpty} = require('lodash/lang');

const ctx = vm.createContext({module, require});

/**
 * Get the script tag with props from a node list and return process props.
 * Custom posthtml-expressions/lib/locals.
 *
 * @param {Array} tree Nodes
 * @param {Object} options Options
 * @param {string} scriptPath - Component path
 * @return {Object} {} Locals
 */
module.exports = (tree, options, scriptPath) => {
  const props = {};
  const propsContext = options.props || {};
  const utilities = {...options.utilities};
  const context = {...utilities, ...ctx, [options.propsContext]: propsContext, $slots: options.$slots};

  match.call(tree, {tag: 'script', attrs: {[options.propsScriptAttribute]: ''}}, node => {
    if (node.content) {
      const code = render(node.content);

      try {
        const parsedContext = vm.createContext(context);
        const parsedProps = vm.runInContext(code, parsedContext);

        Object.assign(props, parsedProps);
      } catch {}
    }

    return '';
  });

  if (isEmpty(props) && existsSync(scriptPath)) {
    try {
      const parsedContext = vm.createContext(context);
      const code = readFileSync(scriptPath, 'utf8');
      const parsedProps = vm.runInContext(code, parsedContext);

      Object.assign(props, parsedProps);
    } catch {}
  }

  return {
    props
  };
};
