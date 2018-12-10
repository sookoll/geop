export default function xml2js (xml) {
  let obj = {}
  if (xml.nodeType === 1) {
    for (let j = 0, len = xml.attributes.length; j < len; j++) {
      const attribute = xml.attributes.item(j)
      obj['@' + attribute.nodeName] = attribute.nodeValue
    }
  } else if (xml.nodeType === 3) {
    obj = xml.nodeValue.trim()
  }
  if (xml.hasChildNodes()) {
    if (xml.childNodes.length === 1 && xml.childNodes.item(0).nodeName === '#text') {
      obj[xml.nodeName] = xml.childNodes.item(0).nodeValue
    } else {
      for (let i = 0, len = xml.childNodes.length; i < len; i++) {
        const item = xml.childNodes.item(i)
        const nodeName = item.nodeName
        if (typeof obj[nodeName] === 'undefined') {
          obj[nodeName] = xml2js(item)
        } else {
          if (typeof obj[nodeName].push === 'undefined') {
            const old = obj[nodeName]
            obj[nodeName] = []
            if (typeof old !== 'string' || old.length) {
              obj[nodeName].push(old)
            }
          }
          const subitem = xml2js(item)
          if (typeof subitem !== 'string' || subitem.length) {
            obj[nodeName].push(subitem)
          }
        }
      }
    }
  }
  return obj
}
