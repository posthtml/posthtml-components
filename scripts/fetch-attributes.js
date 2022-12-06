/* eslint-disable no-undef */
/* eslint-disable curly */
/* eslint-disable padded-blocks */
const elementAttributes = {};

// Exception
// tabindex seem to be allowed on any element according to https://www.w3schools.com/tags/att_global_tabindex.asp
// but here https://www.w3.org/TR/html4/index/attributes.html seem not
// So below we add this exception
const allowedAttributes = ['tabindex'];

// Fetch valid html elements (not deprecated)
fetch('https://www.w3.org/TR/html4/index/elements.html').then(response => {
  return response.text();
}).then(html => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('table tbody tr');

  rows.forEach(row => {
    const elementName = row.querySelector('td[title="Name"]');
    if (!elementName) return;

    const isDeprecated = row.querySelector('td[title="Depr."]');
    if (isDeprecated.textContent.trim() === 'D') return;

    elementAttributes[elementName.textContent.trim()] = [...allowedAttributes];
  });

  console.log('Valid HTML elements', elementAttributes);

}).catch(error => {
  console.warn(error.message);
});

// Fetch valid HTML attributes (not deprecated)

fetch('https://www.w3.org/TR/html4/index/attributes.html').then(response => {
  return response.text();
}).then(html => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('table tbody tr');

  rows.forEach(row => {
    const attributeName = row.querySelector('td[title="Name"]');
    if (!attributeName) return;

    const isDeprecated = row.querySelector('td[title="Depr."]');
    if (isDeprecated.textContent.trim() === 'D') return;

    const relatedElements = row.querySelector('td[title="Related Elements"]').textContent.trim().split(',');

    const exclude = relatedElements[0].includes('All elements but');
    if (exclude) {
      // Allowed in all but not in relatedElements
      relatedElements[0].replace('All elements but', '');
      Object.keys(elementAttributes).forEach(elementName => {
        // Skip element that doesn't support the attribute
        if (relatedElements.includes(elementName)) return;
        elementAttributes[elementName].push(attributeName.textContent.trim());
      });
    } else {
      relatedElements.forEach(element => {
        // Skip deprecated element
        if (!elementAttributes[element]) return;
        elementAttributes[element].push(attributeName.textContent.trim());
      });
    }
  });

  Object.keys(elementAttributes).forEach(element => {
    elementAttributes[element].sort();
  });

  console.log('elementAttributes', elementAttributes);
}).catch(error => {
  console.warn(error.message);
});
