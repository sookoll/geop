import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import Provider from 'Geop/Provider'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { t } from 'Utilities/translate'
import $ from 'jquery'

class OpenRouteService extends Provider {
  constructor () {
    super()
    this.title = 'OpenRouteService'
    this.xhr = null
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
  directions (coords) {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    return new Promise((resolve, reject) => {
      this.clear()
      if (routingProfile in this.profiles) {
        this.xhr = $.ajax({
          type: 'GET',
          crossDomain: true,
          url: apiUrls.openrouteservice.directions + this.profiles[routingProfile],
          data: {
            api_key: apiUrls.openrouteservice.key,
            start: coords[0],
            end: coords[1]
          },
          dataType: 'json'
        })
          .done(response => {
            if (response && response.features && response.features.length) {
              resolve(this.format(response.features[0]))
            } else {
              reject(new Error(t('Unable to find route') + ': ' + JSON.stringify(response)))
            }
          })
          .fail(function (request) {
            if (request.statusText === 'abort') {
              return
            }
            reject(new Error(t('Unable to find route') + ': ' + t(request.responseJSON ? request.responseJSON.message : request.statusText)))
          })
      } else {
        reject(new Error(t('Routing disabled')))
      }
    })
  }
  optimize (coords) {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    return new Promise((resolve, reject) => {
      this.clear()
      const vehicles = [{
        id: 1,
        profile: this.profiles[routingProfile],
        start: coords[0],
        end: coords[coords.length - 1]
      }]
      const jobs = coords.map((coord, i) => {
        return {
          id: i,
          location: coord
        }
      })
      if (routingProfile in this.profiles) {
        this.xhr = $.ajax({
          type: 'POST',
          crossDomain: true,
          url: apiUrls.openrouteservice.optimize,
          headers: {
            Authorization: apiUrls.openrouteservice.key
          },
          data: JSON.stringify({
            jobs,
            vehicles
          }),
          contentType: 'application/json',
          dataType: 'json'
        })
          .done(response => {
            if (response && response.routes && response.routes.length) {
              resolve(response.routes[0])
            } else {
              reject(new Error(t('Unable to find route') + ': ' + JSON.stringify(response)))
            }
          })
          .fail(function (request) {
            if (request.statusText === 'abort') {
              return
            }
            reject(new Error(t('Unable to find route') + ': ' + t(request.responseJSON ? request.responseJSON.message : request.statusText)))
          })
      } else {
        reject(new Error(t('Routing disabled')))
      }
    })
  }
  format (geojson) {
    return new GeoJSONFormat().readFeature(geojson, {
      featureProjection: getState('map/projection')
    })
  }
}

export default OpenRouteService
