import formats from 'Conf/coordinate'
import Provider from 'Geop/Provider'
import {t} from 'Utilities/translate'
import mgrs from 'mgrs'

class Coordinate extends Provider {
  constructor () {
    super()
    this.title = 'Coordinate'
    this.query = null
  }
  test (query) {
    for (let i = 0, len = formats.length; i < len; i++) {
      const matches = query.match(formats[i].regexp)
      if (matches && matches.length > 0) {
        const obj = {
          coords: formats[i].get(matches),
          srid: formats[i].srid,
          srname: formats[i].srname
        }
        // mrgs exeption
        if (formats[i].srid === 'mrgs') {
          obj.srid = 'EPSG:4326'
          obj.coords = mgrs.toPoint(obj.coords)
        }
        return obj
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
        title: `${item.srname} ${this.query}`,
        srid: item.srid,
        coords: item.coords
      })
    })
  }
}

export default Coordinate
