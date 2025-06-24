const {inspect} = require('node:util');

const debug = false;

// Colors
const colors = {
  reset: '\u001B[0m',
  error: '\u001B[31m',
  success: '\u001B[32m',
  warning: '\u001B[33m',

  errorHighlight: '\u001B[41m',
  successHighlight: '\u001B[42m',
  warningHighlight: '\u001B[43m',

  highlighted: '\u001B[45m'
};

module.exports = (message, method, level = 'reset', object = null) => {
  if (debug === true || method === debug) {
    if (object) {
      console.log(`[${colors.highlighted}x-components ${method}()${colors.reset}]`, colors[level] || 'reset', message, inspect(object, false, null, true), colors.reset);
    } else {
      console.log(`[${colors.highlighted}x-components ${method}()${colors.reset}]`, colors[level] || 'reset', message, colors.reset);
    }
  }
};
