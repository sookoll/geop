import LayerGroup from 'ol/layer/Group'
import LayerImage from 'ol/layer/Image'
import LayerTile from 'ol/layer/Tile'
import LayerVector from 'ol/layer/Vector'
import XYZ from 'ol/source/XYZ'
import TileWMS from 'ol/source/TileWMS'
import ImageWMS from 'ol/source/ImageWMS'
import Bing from 'ol/source/BingMaps'
import Vector from 'ol/source/Vector'
import WMTS from 'ol/source/WMTS'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { get as getProjection } from 'ol/proj'
import { getWidth, getTopLeft } from 'ol/extent'
import TileGrid from 'ol/tilegrid/TileGrid'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { createStyle } from './StyleBuilder'
import range from 'lodash/range'
import { getState } from 'Utilities/store'
import { map as mapConf } from 'Conf/settings'
import { uid, deepCopy } from 'Utilities/util'

export const dataProjection = 'EPSG:4326'

const sources = {
  XYZ,
  TileWMS,
  WMTS,
  ImageWMS,
  Bing,
  Vector
}
const formats = {
  geojson: new GeoJSONFormat(),
  wmts: new WMTSCapabilities()
}

class GroupLayer extends LayerGroup {}
class ImageLayer extends LayerImage {
  constructor (opts) {
    const options = {
      source: new sources[opts.type](opts)
    }
    super(options)
  }
}
class TileLayer extends LayerTile {
  constructor (opts) {
    const sourceOpts = {}
    if (opts.type === 'TileWMS' && opts.tileSize && opts.tileSize !== 256) {
      sourceOpts.tileGrid = tileGridWMS(opts)
    }
    if (opts.type === 'WMTS') {
      sourceOpts.tileGrid = tileGridWMTS(opts)
    }
    const options = {
      source: sources[opts.type] ? new sources[opts.type](Object.assign({}, opts, sourceOpts)) : null
    }
    super(options)
  }
}
class FeatureLayer extends LayerVector {
  constructor (opts) {
    const features = opts.features ?
      formats.geojson.readFeatures(opts, {
        dataProjection: dataProjection,
        featureProjection: getState('map/projection')
      }) : []
    const options = {
      source: new Vector({
        features
      }),
      style: createStyle(opts.style),
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting
    }
    super(options)
  }
}

export function createLayer (layerConf) {
  let layer
  switch (layerConf.type) {
    case 'Group':
      const arr = layerConf.layers.map(conf => {
        const inputConf = deepCopy(conf)
        // add projection to sublayer
        if (!inputConf.projection) {
          inputConf.projection = layerConf.projection
        }
        return createLayer(inputConf)
      })
      // group should be visible, if not specified
      if (typeof layerConf.visible === 'undefined') {
        layerConf.visible = true
      }
      layer = new GroupLayer({
        layers: arr
      })
      break
    case 'XYZ':
    case 'TileWMS':
    case 'Bing':
    case 'WMTS':
      layer = new TileLayer(deepCopy(layerConf))
      break
    case 'ImageWMS':
      layer = new ImageLayer(deepCopy(layerConf))
      break
    case 'FeatureCollection':// can not use deepcopy, it remove style function
      layer = new FeatureLayer(layerConf)
      break
  }
  set(layer, layerConf)
  return layer
}

function set (layer, layerConf) {
  if (typeof layerConf.visible === 'boolean') {
    layer.setVisible(layerConf.visible)
  }
  if (typeof layerConf.id === 'undefined') {
    layerConf.id = uid()
  }
  layer.set('id', layerConf.id)
  if (layerConf.title) {
    layer.set('title', layerConf.title)
  }
  if (layerConf.layerType) {
    layer.set('type', layerConf.type)
  }
  if (layerConf.icon) {
    layer.set('icon', layerConf.icon)
  }
  if (layerConf.minResolution) {
    layer.setMinResolution(layerConf.minResolution)
  }
  if (layerConf.maxResolution) {
    layer.setMaxResolution(layerConf.maxResolution)
  }
  if (typeof layerConf.opacity !== 'undefined') {
    layer.setOpacity(layerConf.opacity)
  }
  if (typeof layerConf.zIndex !== 'undefined') {
    layer.setZIndex(layerConf.zIndex)
  } else {
    layer.setZIndex(100)
  }
  layer.set('conf', layerConf)
  return layer
}

function tileGridWMS (opts) {
  const projExtent = getProjection(opts.projection).getExtent()
  const startResolution = getWidth(projExtent) / opts.tileSize
  const resolutions = range(mapConf.minZoom, mapConf.maxZoom + 1)
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = startResolution / Math.pow(2, i)
  }
  return new TileGrid({
    extent: projExtent,
    resolutions: resolutions,
    tileSize: [opts.tileSize, opts.tileSize]
  })
}

function tileGridWMTS (opts) {
  const resolutions = range(0, opts.matrixSetCount)
  const matrixIds = []
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = opts.maxResolution / Math.pow(2, i)
    matrixIds[i] = opts.matrixSetPrepend ? opts.matrixSetPrepend + i : i
  }
  return new WMTSTileGrid({
    extent: opts.extent,
    origin: getTopLeft(opts.extent),
    resolutions: resolutions,
    matrixIds: matrixIds
  })
}
