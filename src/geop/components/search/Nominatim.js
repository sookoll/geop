import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import Provider from 'Geop/Provider'
import { t } from 'Utilities/translate'
import { fetch } from 'Utilities/util'

class Coordinate extends Provider {
  constructor () {
    super()
    this.title = 'Addresses'
    this.xhr = fetch()
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
        if (results) {
          resolve(this.format(results))
        } else {
          throw new Error(t('Unable to perform search!'))
        }
      })
    })
  }

  geocode (query, cb) {
    this.clear()
    this.xhr.get(apiUrls.nominatim + '/search/', {
      params: {
        q: query,
        countrycodes: getState('app/nominatimCountries') || '',
        format: 'json'
      }
    })
      .then(cb)
      .catch(err => {
        console.error(err)
        cb(null)
      })
  }

  format (data) {
    return data.map(item => {
      const bbox = item.boundingbox && item.boundingbox.map(c => Number(c))
      return this.toGeoJSON({
        provider: this.title,
        id: item.place_id,
        name: item.display_name,
        srid: 'EPSG:4326',
        coords: [Number(item.lon), Number(item.lat)],
        bbox: [bbox[2], bbox[0], bbox[3], bbox[1]]
      })
    })
  }
}

export default Coordinate
