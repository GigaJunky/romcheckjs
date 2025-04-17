//https://github.com/Leonidas-from-XIV/node-xml2js/issues/277
// Recursive function to convert XML elements to JSON
function parseElement(xmlElement) {
    const result = {};
    if (xmlElement.nodeType === Node.ELEMENT_NODE) {
      if (xmlElement.children.length === 0) {
        // If the element has no child elements, use its text content as the value
        return xmlElement.textContent;
      } else {
        // If the element has child elements, recursively convert them to JSON
        for (const childElement of xmlElement.children) {
          const key = childElement.tagName;
          const value = parseElement(childElement);
    
          // If the key already exists, convert the value to an array
          if (result[key]) {
            if (!Array.isArray(result[key])) {
              result[key] = [result[key]];
            }
            result[key].push(value);
          } else {
            result[key] = value;
          }
        }
      }
    }
    return result;
  }
  
  function xml2js(xmlData) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    return parseElement(xmlDoc.documentElement)
  }
  
  // Example usage:
  const xmlData = `
  <root>
    <name>John</name>
    <age>30</age>
    <address>
      <city>New York</city>
      <country>USA</country>
    </address>
  </root>`
  
  console.log(xml2js(xmlData))

