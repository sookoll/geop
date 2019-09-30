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
  }
  formatInput (coords) {
    return coords.filter(lonLat => !!lonLat).map(lonLat => {
      return lonLat.slice(0, 2).join()
    })
  }
  test (coords) {
    return !(coords.length < 2)
  }
  directions (coords) {
    const profile = getState('app/routing').profile
    return new Promise((resolve, reject) => {
      this.clear()
      if (profile in apiUrls.openrouteservice) {
        this.xhr = $.ajax({
          type: 'GET',
          crossDomain: true,
          url: apiUrls.openrouteservice[profile] + `&start=${coords[0]}&end=${coords[1]}`,
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
  format (geojson) {
    return new GeoJSONFormat().readFeature(geojson, {
      featureProjection: getState('map/projection')
    })
  }
}

export default OpenRouteService
