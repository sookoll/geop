import { toLonLat } from 'ol/proj'
import { uid } from 'Utilities/util'

class Provider {
  clear () {
    if (this.xhr && typeof this.xhr.abort === 'function') {
      this.xhr.abort()
    }
  }
  test (coords) {
    return !(coords.length < 2)
  }
  formatInput (coords, join = false) {
    return coords.filter(lonLat => !!lonLat).map(lonLat => {
      const pair = lonLat.slice(0, 2)
      return join ? pair.join() : pair
    })
  }
  toGeoJSON (data) {
    data.id = data.id || uid()
    return {
      type: 'Feature',
      id: data.id,
      geometry: {
        type: 'Point',
        coordinates: toLonLat(data.coords, data.srid)
      },
      bbox: data.bbox || null,
      properties: data
    }
  }
}

export default Provider
