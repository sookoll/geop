import formats from 'Conf/coordinate'
import Provider from 'Geop/Provider'
import {t} from 'Utilities/translate'

class Coordinate extends Provider {
  constructor () {
    super()
    this.title = 'Coordinate'
  }
  test (query) {
    for (let i = 0, len = formats.length; i < len; i++) {
      const matches = query.match(formats[i].regexp)
      if (matches && matches.length > 0) {
        return {
          coords: formats[i].get(matches),
          srid: formats[i].srid,
          srname: formats[i].srname
        }
      }
    }
    return false
  }

  find (query) {
    // test coordinates
    return new Promise((resolve, reject) => {
      if (query.length < 1) {
        throw new Error(t('Query string empty, aborting!'))
      }
      const test = this.test(query)
      const results = []
      if (test && test.srid) {
        results.push(this.toGeoJSON({
          provider: this.title,
          title: `${test.srname} ${query}`,
          srid: test.srid,
          coords: test.coords
        }))
      }
      resolve(results)
    })
  }
}

export default Coordinate
