import Component from 'Geop/Component'
import { createLayer } from 'Components/layer/LayerCreator'
import { getState, setState, onchange } from 'Utilities/store'
import { degToRad, radToDeg } from 'Utilities/util'
import {
  get as getPermalink,
  set as setPermalink,
  onchange as onPermalinkChange,
  viewConfToPermalink
} from 'Utilities/permalink'
import Map from 'ol/Map'
import View from 'ol/View'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { get as getProjection, fromLonLat, toLonLat } from 'ol/proj'
import { getDistance } from 'ol/sphere'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import 'ol/ol.css'
import './MapEngine.styl'

proj4.defs('EPSG:3301', '+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
proj4.defs('EPSG:32634', '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs')
proj4.defs('EPSG:32635', '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs')
proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
register(proj4)
getProjection('EPSG:3301').setExtent([40500, 5993000, 1064500, 7017000])
getProjection('EPSG:3067').setExtent([-2097152.0, 1601644.86, 848181.26, 9437184.0])

class MapEngine extends Component {
  constructor (target) {
    super(target)
    this.el = this.$.create(`<div id="${getState('map/el').slice(1)}"></div>`)
    this.create()
    this.map = null
    this.layers = {
      base: createLayer({
        type: 'Group',
        layers: []
      }),
      layers: createLayer({
        type: 'Group',
        layers: []
      }),
      overlays: createLayer({
        type: 'Group',
        layers: []
      })
    }
    this.format = {
      geojson: new GeoJSONFormat()
    }
    this.activeBaseLayer = null
    this.geoLocation = null
    this.controls = {
      mouseCoordinates: null
    }
    this.shouldUpdate = true
    // permalink
    const permalink = this.permalinkToViewConf(getPermalink('view'))
    this.createBaseLayers(getState('layer/base'), permalink ? permalink.baselayer : null)
    this.createLayers(getState('layer/layers'))
    this.createOverlays(getState('layer/overlays'))
    // set to store
    setState('map/layer/base', this.layers.base.getLayers())
    setState('map/layer/layers', this.layers.layers.getLayers())
    setState('map/layer/overlays', this.layers.overlays.getLayers())
    setState('map/baseLayer', this.activeBaseLayer && this.activeBaseLayer.get('id'), true)
    // que for map
    setState('map/que', [])
    // listen baselayers change
    this.layers.base.getLayers().on('add', () => {
      this.storeLayers('base')
    })
    this.layers.base.getLayers().on('remove', () => {
      this.storeLayers('base')
    })
    // listen layers change
    this.layers.layers.getLayers().on('add', () => {
      this.storeLayers('layers')
    })
    this.layers.layers.getLayers().on('remove', () => {
      this.storeLayers('layers')
    })
    // listen overlays change
    this.layers.overlays.getLayers().on('add', () => {
      this.storeLayers('overlays')
    })
    this.layers.overlays.getLayers().on('remove', () => {
      this.storeLayers('overlays')
    })
    // listen when feature has added or removed
    onchange('layerchange', ids => {
      // for compability
      if (typeof ids === 'string') {
        ids = ['overlays', ids]
      }
      this.updateStore(ids[0], ids[1])
    })
    // listen permalink change
    onPermalinkChange(permalink => {
      if (permalink.view) {
        const viewConf = this.permalinkToViewConf(permalink.view)
        if (viewConf) {
          this.map.getView().animate({
            center: fromLonLat(viewConf.center, getState('map/projection')),
            zoom: viewConf.zoom,
            rotation: degToRad(viewConf.rotation),
            duration: 500
          })
        }
      }
    })
  }

  init () {
    // permalink
    const permalink = this.permalinkToViewConf(getPermalink('view'))
    this.map = this.createMap(permalink)
    setState('map', this.map)
    this.map.on('moveend', e => {
      const view = e.map.getView()
      setState('map/resolution', view.getResolution())
      setState('map/center', toLonLat(view.getCenter()), true)
      setState('map/zoom', view.getZoom(), true)
      setState('map/rotation', radToDeg(view.getRotation()), true)
      setPermalink({
        view: viewConfToPermalink({
          center: toLonLat(view.getCenter()),
          zoom: view.getZoom(),
          rotation: radToDeg(view.getRotation()),
          baseLayer: getState('map/baseLayer')
        })
      })
    })
    // run que
    const que = getState('map/que')
    que.forEach(item => {
      if (typeof item === 'function') {
        item(this.map)
      }
    })
  }
  permalinkToViewConf (permalink) {
    const parts = permalink ? permalink.split('/') : []
    return {
      center: (!isNaN(parts[1]) && !isNaN(parts[0])) ? [Number(parts[1]), Number(parts[0])] : getState('map/center'),
      zoom: !isNaN(parts[2]) ? Number(parts[2]) : getState('map/zoom'),
      rotation: !isNaN(parts[3]) ? Number(parts[3]) : getState('map/rotation'),
      baselayer: parts[4] || getState('map/baseLayer')
    }
  }
  createMap (viewConf) {
    return new Map({
      layers: Object.keys(this.layers).map(i => this.layers[i]),
      controls: [],
      target: document.querySelector(getState('map/el')),
      moveTolerance: 2,
      pixelRatio: 2,
      view: new View({
        projection: getState('map/projection'),
        center: fromLonLat(viewConf.center, getState('map/projection')),
        zoom: viewConf.zoom,
        rotation: degToRad(viewConf.rotation),
        maxZoom: getState('map/maxZoom'),
        minZoom: getState('map/minZoom')
      })
    })
  }

  createBaseLayers (layers, activeBaseLayerId) {
    layers.forEach(layerConf => {
      layerConf.visible = (layerConf.id === activeBaseLayerId)
      layerConf.zIndex = 0
      const layer = createLayer(layerConf)
      this.addBaseLayer(layer)
      if (layerConf.visible) {
        this.activeBaseLayer = layer
      }
    })
  }
  createLayers (layers) {
    layers.forEach(layer => {
      this.addLayer(createLayer(layer))
    })
  }
  createOverlays (layers) {
    layers.forEach(layer => {
      this.addOverlay(createLayer(layer))
    })
  }
  addBaseLayer (layer) {
    this.layers.base.getLayers().push(layer)
  }
  addLayer (layer) {
    this.layers.layers.getLayers().push(layer)
  }
  addOverlay (layer) {
    this.layers.overlays.getLayers().push(layer)
  }
  getLayer (group, id = null) {
    if (group in this.layers) {
      if (!id) {
        return this.layers[group]
      } else {
        const layers = this.layers[group].getLayers().getArray().filter(layer => {
          return layer.get('id') === id
        })
        return layers[0] || false
      }
    }
    return false
  }
  storeLayers (group) {
    const layerConfs = this.layers[group].getLayers().getArray().map(layer => {
      return layer.get('conf')
    })
    setState('layer/' + group, layerConfs, true)
  }
  updateStore (group, layerId) {
    let layer = this.getLayer(group, layerId)
    if (layer) {
      const conf = layer.get('conf')
      if (conf.type === 'FeatureCollection') {
        const collection = this.format.geojson.writeFeaturesObject(layer.getSource().getFeatures(), {
          featureProjection: getState('map/projection'),
          dataProjection: 'EPSG:4326'
        })
        conf.features = collection.features
      }
      conf.visible = layer.getVisible()
      layer.set('conf', conf)
      this.storeLayers(group)
    }
  }
  destroy () {
    this.map.setTarget(null)
    this.map = null
    super.destroy()
  }
}

export function closestFeatureTo (map, px, coord) {
  const closest = {
    feature: null,
    layer: null,
    distance: Infinity
  }
  map.forEachFeatureAtPixel(
    px,
    (feature, layer) => {
      if (feature.getGeometry().getCoordinates()) {
        const distance = getDistance(toLonLat(coord), toLonLat(feature.getGeometry().getCoordinates()))
        // cache priority
        if (!isNaN(distance) && layer && feature.get('isCache') && distance === closest.distance) {
          closest.feature = feature
          closest.layer = layer
          closest.distance = distance
        } else if (!isNaN(distance) && layer && distance < closest.distance) {
          closest.feature = feature
          closest.layer = layer
          closest.distance = distance
        }
      }
    },
    { hitTolerance: 10 }
  )
  if (!closest.feature) {
    map.forEachFeatureAtPixel(
      px,
      (feature, layer) => {
        if (feature.getGeometry().getCoordinates()) {
          const distance = getDistance(toLonLat(coord), toLonLat(feature.getGeometry().getCoordinates()))
          if (isNaN(distance)) {
            closest.feature = feature
            closest.layer = layer
            closest.distance = 0
          }
        }
      },
      { hitTolerance: 5 }
    )
  }
  return closest.feature ? [closest.layer, closest.feature] : null
}

export default MapEngine
