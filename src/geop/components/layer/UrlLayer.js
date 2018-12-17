import { t } from 'Utilities/translate'
import { uid } from 'Utilities/util'
import { getState, setState } from 'Utilities/store'
import { get as getPermalink, set as setPermalink } from 'Utilities/permalink'
import { createLayer } from './LayerCreator'
import Component from 'Geop/Component'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { extend } from 'ol/extent'
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
    const view = getPermalink('view')
    let bbox
    if (hash) {
      bbox = this.loadFeaturesFromUrl(hash)
    }
    const icon = getPermalink('icon')
    if (icon) {
      bbox = this.addMarker(icon)
    }
    if (!view && bbox) {
      const map = getState('map')
      if (map) {
        this.fitTo(map, bbox)
      } else {
        const que = getState('map/que')
        que.push(map => {
          this.fitTo(map, bbox)
        })
      }
    }
  }
  fitTo (map, bbox) {
    map.getView().fit(bbox, {
      padding: [100, 100, 100, 100],
      maxZoom: 14,
      duration: 500
    })
  }
  loadFeaturesFromUrl (hash) {
    setPermalink({
      hash: null
    })
    const features = JSONP.unpack(decodeURIComponent(hash))
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
      const bbox = []
      if (caches.length) {
        const cacheLayer = this.createLayer('Geocaches', caches)
        extend(bbox, cacheLayer.getSource().getExtent())
        this.state.layers.push(cacheLayer)
      }
      if (markers.length) {
        const markerLayer = this.createLayer('Features', markers)
        extend(bbox, markerLayer.getSource().getExtent())
        this.state.layers.push(markerLayer)
      }
      if (getState('app/debug')) {
        console.error(`UrlLayer.loadFeaturesFromUrl: caches ${caches.length}, features ${markers.length}`)
      }
      return bbox
    }
    return null
  }
  addMarker (coordString) {
    const coords = coordString.split('-')
    if (coords && coords.length === 2) {
      const feature = {
        type: 'Feature',
        id: uid(),
        geometry: {
          type: 'Point',
          coordinates: [Number(coords[1]), Number(coords[0])]
        },
        properties: {
          name: 'Point'
        }
      }
      const layer = this.createLayer('Point', [feature], {
        text: {
          text: '\uf3c5',
          class: 'fas fa-map-marker-alt',
          font: '900 24px "Font Awesome 5 Free"',
          textBaseline: 'bottom',
          fill: {
            color: '#000'
          },
          stroke: {
            color: '#fff',
            width: 4
          }
        }
      })
      const map = getState('map')
      if (map) {
        layer.setMap(map)
      } else {
        const que = getState('map/que')
        que.push(map => {
          layer.setMap(map)
        })
      }
      if (getState('app/debug')) {
        console.error(`UrlLayer.addMarker: ${coordString}`)
      }
      return layer.getSource().getExtent()
    }
    return null
  }
  createLayer (title, features, style) {
    return createLayer({
      type: 'FeatureCollection',
      id: uid(),
      title: t(title),
      features: features,
      style: style
    })
  }
}

export default UrlLayer
