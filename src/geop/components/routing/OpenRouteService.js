import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import Provider from 'Geop/Provider'
import Polyline from 'ol/format/Polyline'
import { t } from 'Utilities/translate'
import { fetch } from 'Utilities/util'

const xhr = fetch()

class OpenRouteService extends Provider {
  constructor () {
    super()
    this.title = 'OpenRouteService'
    this.profiles = {
      driving: 'driving-car',
      hiking: 'foot-hiking'
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

  formatInput (coords) {
    return coords.filter(lonLat => !!lonLat).map(lonLat => {
      return lonLat.slice(0, 2)
    })
  }

  directions (coordinates) {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    return new Promise((resolve, reject) => {
      this.clear()
      if (routingProfile in this.profiles) {
        const radiuses = coordinates.map(coord => 5000)
        xhr.post(apiUrls.openrouteservice.directions + this.profiles[routingProfile], {
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiUrls.openrouteservice.key
          },
          body: JSON.stringify({
            coordinates,
            radiuses
          })
        })
          .then(response => {
            if (response && response.routes && response.routes.length) {
              const feature = this.format(response.routes[0].geometry)
              feature.set('distance', response.routes[0].summary.distance)
              feature.set('duration', response.routes[0].summary.duration)
              resolve(feature)
            } else {
              reject(new Error(t('Unable to find route') + ': ' + JSON.stringify(response)))
            }
          })
          .catch(err => {
            console.error(err)
            reject(new Error(t('Unable to find route') + ': ' + t(err.responseJSON ? err.responseJSON.message : err.statusText)))
          })
      } else {
        reject(new Error(t('Routing disabled')))
      }
    })
  }

  optimize (start, end, coords) {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    return new Promise((resolve, reject) => {
      this.clear()
      const vehicles = [{
        id: 1,
        profile: this.profiles[routingProfile],
        start: start,
        end: end
      }]
      const jobs = coords.map((coord, i) => {
        return {
          id: i,
          location: coord
        }
      })
      if (routingProfile in this.profiles) {
        xhr.post(apiUrls.openrouteservice.optimize, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiUrls.openrouteservice.key
          },
          body: JSON.stringify({
            jobs,
            vehicles
          })
        })
          .then(response => {
            if (response && response.routes && response.routes.length) {
              resolve(response.routes[0])
            } else {
              reject(new Error(t('Unable to find route') + ': ' + JSON.stringify(response)))
            }
          })
          .catch(err => {
            console.error(err)
            reject(new Error(t('Unable to find route') + ': ' + t(err.responseJSON ? err.responseJSON.message : err.statusText)))
          })
      } else {
        reject(new Error(t('Routing disabled')))
      }
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

export default OpenRouteService
