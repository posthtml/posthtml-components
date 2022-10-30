/* global locals */
// Here locals  it's not correct, should be props.
// It's just to simulate a failed runInContext
module.exports = {
  myProp: locals.myProp || 'My default prop value'
};
