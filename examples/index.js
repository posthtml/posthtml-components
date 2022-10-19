const {readdirSync, readFileSync, writeFileSync} = require('fs');
const path = require('path');
const posthtml = require('posthtml');
const components = require('../src');
const beautify = require('posthtml-beautify');

const src = './src/pages/';
const dist = './dist/';

const plugins = [
  components({
    root: './src',
    roots: ['components', 'layouts'],
    strict: true,
    expressions: {
      locals: {
        title: 'PostHTML Components'
      }
    }
  }),

  beautify({
    rules: {
      indent: 2,
      blankLines: false,
      sortAttr: false
    }
  })
];

const options = {};

readdirSync(src).forEach(file => {
  const html = readFileSync(path.resolve(`${src}${file}`), 'utf-8');

  posthtml(plugins)
    .process(html, options)
    .then(result => {
      writeFileSync(path.resolve(`${dist}${file}`), result.html, 'utf8');
    });
});
