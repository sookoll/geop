import formats from 'Conf/coordinate'
import Provider from 'Geop/Provider'

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

  find (query, cb) {
    // test coordinates
    const test = this.test(query)
    if (test && test.srid && typeof cb === 'function') {
      const results = [this.toGeoJSON({
        provider: this.title,
        title: `${test.srname} ${query}`,
        srid: test.srid,
        coords: test.coords
      })]
      cb(this.title, results)
    }
  }
}

export default Coordinate
