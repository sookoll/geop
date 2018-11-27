import {apiUrls} from 'Conf/settings'
import Provider from 'Geop/Provider'
import {t} from 'Utilities/translate'
import $ from 'jquery'

class Coordinate extends Provider {
  constructor () {
    super()
    this.title = 'Addresses'
    this.xhr = null
  }
  test (query) {
    return (query.length >= 3)
  }

  find (query) {
    return new Promise((resolve, reject) => {
      if (!this.test(query)) {
        throw new Error(t('Query string too short, aborting!'))
      }
      this.geocode(query, (results) => {
        resolve(this.format(results))
      })
    })
  }

  geocode (query, cb) {
    if (this.xhr && typeof this.xhr.abort === 'function') {
      this.xhr.abort()
    }
    this.xhr = $.ajax({
      type : 'GET',
      crossDomain : true,
      url : apiUrls.nominatim + '/search/',
      data: {
        q: query,
        countrycodes: 'ee',
        format: 'json'
      },
      dataType: 'json',
      context: this
    })
    .done(cb)
    .fail(function (request) {
      cb(null)
      if (request.statusText === 'abort') {
        return
      }
    })
  }

  format (data) {
    return data.map(item => {
      const bbox = item.boundingbox && item.boundingbox.map(c => Number(c))
      return this.toGeoJSON({
        provider: this.title,
        id: item.place_id,
        title: item.display_name,
        srid: 'EPSG:4326',
        coords: [Number(item.lon), Number(item.lat)],
        bbox : [bbox[2], bbox[0], bbox[3], bbox[1]]
      })
    })
  }
}

export default Coordinate
