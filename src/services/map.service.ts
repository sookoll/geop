import Map from 'ol/Map'
import View from 'ol/View'
import { get as getProjection, fromLonLat } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { createLayer } from '@/services/layer.service'
import { GroupLayer } from '@/models/layer'
import { LayerType } from '@/models/layer-config'
import { degToRad } from '@/utilities/util'
// @ts-ignore
import { map as config } from '@/config/settings'

export class MapService {
  private map: Map | null = null
  private layers = {
    base: GroupLayer,
    layers: GroupLayer,
    overlays: GroupLayer
  }

  constructor() {
    initProj4()
  }

  init(): void {
    const baseLayers = createLayer({
      type: LayerType.Group,
      layers: []
    })
    if (baseLayers) {
      this.layers.base = baseLayers
    }
    this.map = this.createMap()
  }

  createMap(): Map {
    return new Map({
      layers: [],
      controls: [],
      target: config.el.slice(1),
      moveTolerance: 2,
      pixelRatio: 2,
      view: new View({
        projection: config.projection,
        center: fromLonLat(config.center, config.projection),
        zoom: config.zoom,
        rotation: degToRad(config.rotation),
        maxZoom: config.maxZoom,
        minZoom: config.minZoom
      })
    })
  }
}

function initProj4() {
  proj4.defs(
    'EPSG:3301',
    '+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  )
  proj4.defs('EPSG:32634', '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs')
  proj4.defs('EPSG:32635', '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs')
  proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
  register(proj4)
  getProjection('EPSG:3301').setExtent([40500, 5993000, 1064500, 7017000])
  getProjection('EPSG:3067').setExtent([
    -2097152.0,
    1601644.86,
    848181.26,
    9437184.0
  ])
}
