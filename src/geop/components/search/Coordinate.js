import formats from 'Conf/coordinate'
import {uid} from 'Utilities/util'
import {t} from 'Utilities/translate'
import {toLonLat} from 'ol/proj'
import Provider from 'Geop/Provider'

class Coordinate extends Provider {
  constructor () {
    super()
    this.title = t('Coordinate')
  }
  test (query) {
    for (let i = 0, len = formats.length; i < len; i++) {
      const matches = query.match(formats[i].regexp)
      if (matches && matches.length > 0) {
        const coords = formats[i].get(matches)
        return {
          x: coords[0],
          y: coords[1],
          srid: formats[i].srid,
          srname: formats[i].srname
        }
      }
    }
    return false
  }

  find (query, cb) {
    // test coordinates
    const coords = this.test(query)
    if (coords && coords.srid && typeof cb === 'function') {
      const results = [{
        id: uid(),
        type: 'coordinate',
        name: `${coords.srname} ${query}`,
        geometry: {
          type: 'Point',
          coordinates: toLonLat([coords.x, coords.y], coords.srid)
        }
      }]
      cb(this.title, results)
    }
  }
}

export default Coordinate
