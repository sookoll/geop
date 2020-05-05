import formats from 'Conf/coordinate'
import Provider from 'Geop/Provider'
import { t } from 'Utilities/translate'
import mgrs from 'mgrs'

class Coordinate extends Provider {
  constructor () {
    super()
    this.title = 'Coordinate'
    this.query = null
  }

  test (query) {
    for (let i = 0, len = formats.length; i < len; i++) {
      const match = testFormat(query, formats[i])
      if (match) {
        return match
      }
    }
    return false
  }

  find (query) {
    this.query = query
    // test coordinates
    return new Promise((resolve, reject) => {
      if (query.length < 1) {
        throw new Error(t('Query string empty, aborting!'))
      }
      const test = this.test(query)
      const results = []
      if (test && test.srid) {
        results.push(test)
      }
      resolve(this.format(results))
    })
  }

  format (data) {
    return data.map(item => {
      return this.toGeoJSON({
        provider: this.title,
        name: `${item.srname} ${this.query}`,
        srid: item.srid,
        coords: item.coords
      })
    })
  }
}

function testFormat (query, format) {
  const matches = query.match(format.regexpParse)
  if (matches && matches.length > 0) {
    const obj = {
      coords: format.get(matches),
      srid: format.srid,
      srname: format.srname
    }
    // mrgs exeption
    if (format.srid === 'mrgs') {
      obj.srid = 'EPSG:4326'
      obj.coords = mgrs.toPoint(obj.coords)
    }
    return obj
  }
  return false
}

export function parseString (str) {
  for (let i = 0, len = formats.length; i < len; i++) {
    if (formats[i].regexpFind) {
      const results = str.match(formats[i].regexpFind)
      if (!results || !results.length) {
        continue
      }
      results.forEach(match => {
        const matches = testFormat(match.trim(), formats[i])
        if (matches) {
          const safeStr = match.trim()
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&rsquo;')
          str = str.split(match.trim()).join(`<a class="createMarker" data-coordinates="${JSON.stringify(matches.coords)}" data-srid=${matches.srid} href="#">${safeStr}</a>`)
        }
      })
    }
  }
  return str
}

export default Coordinate
