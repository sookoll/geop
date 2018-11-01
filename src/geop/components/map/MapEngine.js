/* eslint no-unused-vars: off */
import Component from 'Geop/Component'
import {GroupLayer, ImageLayer, TileLayer} from 'Components/layer/LayerCreator'
import {map as mapConf, layers as layerConf} from 'Conf/settings'
import {getState, setState} from 'Utilities/store'
import Map from 'ol/Map'
import View from 'ol/View'
import Collection from 'ol/Collection' 
import {get as getProjection, fromLonLat} from 'ol/proj'
import {register} from 'ol/proj/proj4'
import proj4 from 'proj4'
import $ from 'jquery'
import 'ol/ol.css'
import './MapEngine.styl'

proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
proj4.defs("EPSG:32634", "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs")
proj4.defs("EPSG:32635", "+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs")
register(proj4)
getProjection('EPSG:3301').setExtent([0, 0, 700000, 1300000])

class MapEngine extends Component {
  constructor (target) {
    super(target)
    this.render()
    this.map = null
    this.layers = {
      base: new GroupLayer({
        layers: []
      }),
      overlays: new GroupLayer({
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
    this.activeBaseLayer = permalink.baselayer
    this.createBaseLayers(layerConf.baseLayers, this.activeBaseLayer)
    // set layer to store
    setState('map/baseLayers', this.layers.base.getLayers())
    setState('map/activeBaseLayer', this.activeBaseLayer)
  }

  render () {
    this.el = $(`<div id="${mapConf.el.slice(1)}"></div>`)
    this.target.append(this.el)
  }

  init () {
    // permalink
    const permalink = this.permalinkToViewConf(
      this.$permalink ? this.$permalink.get('map') : null)
    this.map = this.createMap(permalink)
  }

  permalinkToViewConf (permalink) {
    const parts = permalink ? permalink.split('-') : []
    return {
      center: (parts[1] && parts[0]) ? [parts[1], parts[0]] : mapConf.center,
      zoom: parts[2] || mapConf.zoom,
      rotation: parts[3] || mapConf.rotation,
      baselayer: parts[4] || mapConf.activeBaseLayer
    }
  }

  createMap (viewConf) {
    return new Map({
      layers: [
        this.layers.base,
        this.layers.overlays
      ],
      controls: [],
      target: document.querySelector(mapConf.el),
      moveTolerance: 2,
      view: new View({
        projection: mapConf.crs,
        center: fromLonLat(viewConf.center, mapConf.crs),
        zoom: viewConf.zoom,
        maxZoom: mapConf.maxZoom,
        minZoom: mapConf.minZoom
      })
    })
  }

  createBaseLayers (layers, activeBaseLayer) {
    const prefix = 'Image'
    Object.keys(layers).forEach(name => {
      const visible = (name === activeBaseLayer)
      let layer
      if (layers[name].type === 'Group') {
        const arr = layers[name].layers.map(conf => {
          // add projection to sublayer
          if (!conf.projection) {
            conf.projection = layers[name].projection
          }
          if (conf.type.slice(0, prefix.length) === prefix) {
            return new ImageLayer(conf)
          } else {
            return new TileLayer(conf)
          }
        })
        layer = new GroupLayer({
          id: name,
          title: layers[name].title,
          layers: arr,
          visible: visible
        })
        layer.setLayers(new Collection(arr))
      } else {
        if (layers[name].type.slice(0, prefix.length) === prefix) {
          layer = new ImageLayer(layers[name])
        } else {
          layer = new TileLayer(layers[name])
        }
        layer.set('id', name)
        layer.setVisible(visible)
      }
      this.addBaseLayer(layer)
    })
  }

  addBaseLayer (layer) {
    this.layers.base.getLayers().push(layer)
  }

  addLayer (layer) {
    this.layers.overlays.getLayers().push(layer)
  }

  // TODO: id filter
  getLayer (group, id = null) {
    if (group in this.layers) {
      return this.layers[group]
    }
  }

}

export default MapEngine
