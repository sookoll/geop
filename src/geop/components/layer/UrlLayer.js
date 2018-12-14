import { t } from 'Utilities/translate'
import { uid } from 'Utilities/util'
import { getState, setState } from 'Utilities/store'
import { get as getPermalink, set as setPermalink } from 'Utilities/permalink'
import { createLayer } from './LayerCreator'
import Component from 'Geop/Component'
import GeoJSONFormat from 'ol/format/GeoJSON'
import JSONP from 'jsonpack'

class UrlLayer extends Component {
  constructor (target) {
    super(target)
    this.format = new GeoJSONFormat()
    this.state = {
      layers: getState('map/layer/layers')
    }
    this.init()
  }
  init () {
    const hash = getPermalink('hash')
    if (hash) {
      setPermalink({
        hash: null
      })
      const features = JSONP.unpack(decodeURIComponent(hash))
      console.log(features)
      if (features && features.length) {
        const trip = features.map(f => f.id)
        if (trip && trip.length) {
          setState('geocache/trip/ids', trip, true)
        }

        // separate caches and markers
        const caches = features.filter(feature => {
          return (typeof feature.properties.fstatus !== 'undefined')
        })
        const markers = features.filter(feature => {
          return (typeof feature.properties.fstatus === 'undefined')
        })

        if (caches.length) {
          this.state.layers.push(this.createLayer('Geocaches', caches))
        }
        if (markers.length) {
          this.state.layers.push(this.createLayer('Features', markers))
        }
      }
    }
  }
  createLayer (title, features) {
    return createLayer({
      type: 'FeatureCollection',
      id: uid(),
      title: t(title),
      features: features
    })
  }
}

export default UrlLayer
