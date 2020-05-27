export default function xml2js (xml) {
  const obj = {}
  if (xml.nodeType === 1) {
    for (let j = 0, len = xml.attributes.length; j < len; j++) {
      const attribute = xml.attributes.item(j)
      obj['@' + attribute.nodeName] = attribute.nodeValue
    }
  } else if (xml.nodeType === 3) {
    return xml.nodeValue.trim()
  }
  if (xml.hasChildNodes()) {
    for (let i = 0, len = xml.childNodes.length, subitem; i < len; i++) {
      const item = xml.childNodes.item(i)
      const nodeName = item.nodeName.replace('#', '_')
      if (typeof obj[nodeName] === 'undefined') {
        subitem = xml2js(item)
        if (typeof subitem !== 'string' || subitem.length) {
          obj[nodeName] = subitem
        }
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          const old = obj[nodeName]
          obj[nodeName] = []
          if (typeof old !== 'string' || old.length) {
            obj[nodeName].push(old)
          }
        }
        subitem = xml2js(item)
        if (typeof subitem !== 'string' || subitem.length) {
          obj[nodeName].push(subitem)
        }
      }
    }
  }
  return obj
}
