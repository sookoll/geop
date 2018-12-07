export default function xml2js (xml) {
  let obj = {}
  if (xml.nodeType === 1) {
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {}
      for (let j = 0, len = xml.attributes.length; j < len; j++) {
        const attribute = xml.attributes.item(j)
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue
      }
    }
  } else if (xml.nodeType === 3) {
    obj = xml.nodeValue.trim()
  }
  if (xml.hasChildNodes()) {
    for (let i = 0, len = xml.childNodes.length; i < len; i++) {
      const item = xml.childNodes.item(i)
      const nodeName = item.nodeName
      if (typeof obj[nodeName] === 'undefined') {
        obj[nodeName] = xml2js(item)
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          const old = obj[nodeName]
          obj[nodeName] = []
          obj[nodeName].push(old)
        }
        obj[nodeName].push(xml2js(item))
      }
    }
  }
  return obj
}
