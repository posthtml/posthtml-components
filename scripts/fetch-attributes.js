/**
 * Script for retrieve all valid HTML5 attributes from https://html.spec.whatwg.org/multipage/indices.html
 * Test here https://jsfiddle.net/wLyor7e1/4/
 */

/* eslint-disable no-undef */
/* eslint-disable curly */
/* eslint-disable padded-blocks */
/* eslint-disable quotes */
/* eslint-disable unicorn/prefer-set-has */
/* eslint-disable unicorn/prefer-spread */
const elementAttributes = {};

// All global attributes https://html.spec.whatwg.org/multipage/dom.html#global-attributes
const allowedAttributes = [
  'accesskey',
  'autocapitalize',
  'autofocus',
  'class',
  'contenteditable',
  'dir',
  'draggable',
  'enterkeyhint',
  'hidden',
  'id',
  'inert',
  'inputmode',
  'is',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'lang',
  'nonce',
  'popover',
  'role',
  'spellcheck',
  'style',
  'tabindex',
  'title',
  'translate'
];

const invalidTagName = [
  'AUTONOMOUS CUSTOM ELEMENTS'
];

const renameTags = {
  'MATHML MATH': 'MATH',
  'SVG SVG': 'SVG'
};

// Fetch all valid HTML5 elements and their attributes from https://html.spec.whatwg.org/multipage/indices.html
// basic-attributes.html is a copy of https://html.spec.whatwg.org/multipage/indices.html
fetch('basic-attributes.html').then(response => {
  return response.text();
}).then(html => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  const rows = table.querySelectorAll('tbody tr');

  Array.from(rows).forEach(row => {
    const elements = row.querySelectorAll("th code[id^='elements-3:'] a, th a[id^='elements-3:']");
    if (!elements || elements.length === 0) return;

    Array.from(elements).forEach(element => {
      let tagName = element.textContent.trim().toUpperCase();

      // Skip invalid tag names
      if (invalidTagName.includes(tagName)) return;

      // Rename tag name
      if (tagName in renameTags) tagName = renameTags[tagName];

      // console.log('Processing tag', tagName);

      // Add global attributes
      elementAttributes[tagName] = [...allowedAttributes];

      // Add specific attributes
      const cell = row.querySelectorAll('td')[4];
      if (!cell || cell.length === 0) return;

      const attributes = cell.querySelectorAll("code[id^='elements-3:'] a");
      if (!attributes || attributes.length === 0) return;

      Array.from(attributes).forEach(attribute => {
        attribute = attribute.textContent.trim();
        if (attribute === 'globals') return;

        elementAttributes[tagName].push(attribute);

        elementAttributes[tagName].sort();
      });
    });
  });

  // Print result
  console.log('Done first basic attributes');

  // Fetch all missing attributes
  // additional-attributes.html is a copy of https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
  fetch('additional-attributes.html').then(response => {
    return response.text();
  }).then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    const rows = table.querySelectorAll('tbody tr');

    Array.from(rows).forEach(row => {
      const cells = row.querySelectorAll("td");
      if (!cells || cells.length === 0 || cells[0].querySelector('.icon-deprecated')) return;

      const attributeElement = cells[0].querySelector('code');
      if (!attributeElement) return;

      const attributeName = attributeElement.textContent.trim().toUpperCase();

      const tagsElement = cells[1].querySelector('a');
      if (!tagsElement || tagsElement.length === 0) return;

      Array.from(tagsElement).forEach(tagElement => {
        tagElement.replace('<', '').replace('>', '');

        elementAttributes[tagElement].push(attributeName);
        elementAttributes[tagElement].sort();
      });
    });

    // Print result
    console.log('Done additional attributes');
    console.log(elementAttributes);

    document.querySelector("code").innerHTML = JSON.stringify(elementAttributes, null, 2);

  }).catch(error => {
    console.warn(error.message);
  });

}).catch(error => {
  console.warn(error.message);
});
