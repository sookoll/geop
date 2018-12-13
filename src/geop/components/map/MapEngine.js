import Component from 'Geop/Component'
import { createLayer } from 'Components/layer/LayerCreator'
import { getState, setState, onchange } from 'Utilities/store'
import { degToRad, radToDeg } from 'Utilities/util'
import Map from 'ol/Map'
import View from 'ol/View'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { get as getProjection, fromLonLat, toLonLat } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import $ from 'jquery'
import 'ol/ol.css'
import './MapEngine.styl'

proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
proj4.defs("EPSG:32634", "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs")
proj4.defs("EPSG:32635", "+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs")
register(proj4)
getProjection('EPSG:3301').setExtent([40500, 5993000, 1064500, 7017000])

class MapEngine extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div id="${getState('map/el').slice(1)}"></div>`)
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
    this.activeBaseLayer = null
    this.geoLocation = null
    this.controls = {
      mouseCoordinates : null
    }
    this.overlay = null
    this.shouldUpdate = true
    // permalink
    const permalink = this.permalinkToViewConf(
      this.$permalink ? this.$permalink.get('map') : null)
    this.createBaseLayers(getState('layer/baseLayers'), permalink.baselayer)
    this.createLayers(getState('layer/layers'))
    this.createOverlays(getState('layer/overlays'))
    // set to store
    setState('map/layer/base', this.layers.base.getLayers())
    setState('map/layer/layers', this.layers.layers.getLayers())
    setState('map/layer/overlays', this.layers.overlays.getLayers())
    setState('map/baseLayer', this.activeBaseLayer.get('id'), true)
    // que for map
    setState('map/que', [])
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
    onchange('layerchange', layerId => {
      this.updateStore(layerId)
    })
  }

  init () {
    // permalink
    const permalink = this.permalinkToViewConf(
      this.$permalink ? this.$permalink.get('map') : null)
    this.map = this.createMap(permalink)
    setState('map', this.map)
    this.map.on('moveend', (e) => {
      const view = e.map.getView()
      setState('map/resolution', view.getResolution())
      setState('map/center', toLonLat(view.getCenter()), true)
      setState('map/zoom', view.getZoom(), true)
      setState('map/rotation', radToDeg(view.getRotation()), true)
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
    const parts = permalink ? permalink.split('-') : []
    return {
      center: (parts[1] && parts[0]) ? [parts[1], parts[0]] : getState('map/center'),
      zoom: parts[2] || getState('map/zoom'),
      rotation: parts[3] || getState('map/rotation'),
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
    Object.keys(layers).forEach(id => {
      layers[id].visible = (id === activeBaseLayerId)
      layers[id].id = id
      const layer = createLayer(layers[id])
      this.addBaseLayer(layer)
      if (layers[id].visible) {
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
        return layers[0]
      }
    }
  }

  storeLayers (group) {
    const layerConfs = this.layers[group].getLayers().getArray().map(layer => {
      const conf = layer.get('conf')
      if (conf.type === 'FeatureCollection') {// TODO!
        const features = new GeoJSONFormat().writeFeaturesObject()
      }
      return layer.get('conf')
    })
    setState('layer/' + group, layerConfs, true)
  }

  updateStore (layerId) {
    let layer = this.getLayer('overlays', layerId)
    if (layer) {
      this.storeLayers('overlays')
      return
    }
    layer = this.getLayer('layers', layerId)
    if (layer) {
      this.storeLayers('layers')
    }
  }

}

export default MapEngine
