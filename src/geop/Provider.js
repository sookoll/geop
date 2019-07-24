import { toLonLat } from 'ol/proj'
import { uid } from 'Utilities/util'

class Provider {
  clear () {
    if (this.xhr && typeof this.xhr.abort === 'function') {
      this.xhr.abort()
    }
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
