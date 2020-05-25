import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import Provider from 'Geop/Provider'
import { t } from 'Utilities/translate'
import Polyline from 'ol/format/Polyline'
import { fetch } from 'Utilities/util'

const xhr = fetch()

class OSRM extends Provider {
  constructor () {
    super()
    this.title = 'OSRM'
    this.profiles = {
      driving: 'driving'
    }
  }
  test (coords) {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    if (!(routingProfile in this.profiles)) {
      return false
    }
    return !(coords.length < 2)
  }
  directions (coords) {
    return new Promise((resolve, reject) => {
      this.clear()
      xhr.get(apiUrls.osrm.directions + this.profiles.driving + '/' + coords.join(';'), {
        params: {
          overview: 'full'
        }
      })
        .then(response => {
          if (response.code === 'Ok') {
            resolve(this.format(response.routes[0].geometry))
          } else {
            reject(new Error(t('Unable to find route') + ': ' + response.code))
          }
        })
        .catch(err => {
          console.error(err)
          reject(new Error(t('Unable to find route') + ': ' + t(err.responseJSON ? err.responseJSON.message : err.statusText)))
        })
    })
  }
  format (polyline) {
    return new Polyline({
      factor: 1e5
    }).readFeature(polyline, {
      dataProjection: 'EPSG:4326',
      featureProjection: getState('map/projection')
    })
  }
}

export default OSRM
