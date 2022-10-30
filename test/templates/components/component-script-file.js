/* global props */
module.exports = {
  myDefaultStringProp: props.myDefaultStringProp || 'A default string',
  myStringProp: props.myStringProp || 'My default string',
  myObjectProp: props.myObjectProp || {one: 'One', two: 'Two'}
};
