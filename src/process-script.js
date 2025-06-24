const vm = require('node:vm');
const {existsSync, readFileSync} = require('node:fs');
const {render} = require('posthtml-render');
const {match} = require('posthtml/lib/api');

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
  const propsContext = options.props;
  const utilities = {...options.utilities};
  const context = {...utilities, ...ctx, [options.propsContext]: propsContext, $slots: options.$slots};

  const runInContext = code => {
    try {
      const parsedContext = vm.createContext(context);
      const parsedProps = vm.runInContext(code, parsedContext);

      Object.assign(props, parsedProps);
    } catch {}
  };

  if (existsSync(scriptPath)) {
    runInContext(readFileSync(scriptPath, 'utf8'));
  }

  match.call(tree, {tag: 'script', attrs: {[options.propsScriptAttribute]: ''}}, node => {
    if (node.content) {
      runInContext(render(node.content));
    }

    return '';
  });

  return {
    props
  };
};
