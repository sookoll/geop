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
import { getWidth, getTopLeft, Extent } from 'ol/extent'
import TileGrid from 'ol/tilegrid/TileGrid'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import range from 'lodash.range'
import { createStyle } from '@/services/style.service'
// import { getState } from '@/services/store'
import { GroupLayer } from '@/models/layer'
import { LayerConfig, LayerType } from '@/models/layer-config'
import { uid, deepCopy } from '@/utilities/util'
// @ts-ignore
import { map as config } from '@/config/settings'

const sources: any = {
  XYZ: XYZ,
  TileWMS: TileWMS,
  WMTS: WMTS,
  ImageWMS: ImageWMS,
  Bing: Bing,
  Vector: Vector
}
const formats: any = {
  geojson: new GeoJSONFormat({
    dataProjection: config.defaultDataProjection,
    featureProjection: config.projection
  }),
  wmts: new WMTSCapabilities()
}

class ImageLayer extends LayerImage {
  constructor(opts: any) {
    const options = {
      source: new sources[opts.type](opts)
    }
    super(options)
  }
}
class TileLayer extends LayerTile {
  constructor(opts: any) {
    const sourceOpts: any = Object.assign({}, opts)
    if (
      opts.type === LayerType.TileWMS &&
      opts.tileSize &&
      opts.tileSize !== 256
    ) {
      sourceOpts.tileGrid = tileGridWMS(opts)
    }
    if (opts.type === LayerType.WMTS) {
      sourceOpts.tileGrid = tileGridWMTS(opts)
    }
    delete sourceOpts.maxResolution
    delete sourceOpts.minResolution
    const options = {
      source: opts.type in sources ? new sources[opts.type](sourceOpts) : null
    }
    super(options)
  }
}
class FeatureLayer extends LayerVector {
  constructor(opts: any) {
    const features = opts.features
      ? formats.geojson.readFeatures(opts, {
          featureProjection: config.projection
        })
      : []
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

export function createLayer(layerConf: LayerConfig): any {
  let layer
  switch (layerConf.type) {
    case LayerType.Group: {
      const arr: any[] = []
      if (layerConf.layers) {
        layerConf.layers.forEach((conf: LayerConfig) => {
          const inputConf = deepCopy(conf)
          // add projection to sublayer
          if (!inputConf.projection) {
            inputConf.projection = layerConf.projection
          }
          if (!inputConf.zIndex) {
            inputConf.zIndex = layerConf.zIndex
          }
          const subLayer = createLayer(inputConf)
          if (subLayer) {
            arr.push(subLayer)
          }
        })
      }
      // group should be visible, if not specified
      if (typeof layerConf.visible === 'undefined') {
        layerConf.visible = true
      }
      layer = new GroupLayer({
        layers: arr
      })
      break
    }
    case 'XYZ':
    case 'TileWMS':
    case 'Bing':
    case 'WMTS':
      layer = new TileLayer(deepCopy(layerConf))
      break
    case 'ImageWMS':
      layer = new ImageLayer(deepCopy(layerConf))
      break
    case 'FeatureCollection':
      // can not use deepcopy, it remove style function
      layer = new FeatureLayer(layerConf)
      break
  }
  if (layer) {
    set(layer, layerConf)
  }
  return layer
}

function set(layer: any, layerConf: LayerConfig): any {
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
  if (layerConf.type) {
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
  layer.set('_conf', layerConf)
  return layer
}

function tileGridWMS(opts: any) {
  const projExtent = getProjection(opts.projection).getExtent()
  const startResolution = getWidth(projExtent) / opts.tileSize
  const resolutions = range(config.minZoom, config.maxZoom + 1)
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = startResolution / Math.pow(2, i)
  }
  return new TileGrid({
    extent: projExtent,
    resolutions: resolutions,
    tileSize: [opts.tileSize, opts.tileSize]
  })
}

function tileGridWMTS(opts: any) {
  const tileSize = opts.tileSize || 256
  const wmtsData = getBoundsAndMaxResForWMTS(
    opts.scaleDenominator,
    opts.topLeftCorner,
    tileSize,
    opts.matrixWidth,
    tileSize,
    opts.matrixHeight
  )
  const projExtent = wmtsData.extent
  const startResolution = wmtsData.maxResolution
  const resolutions = Array(16)
  const matrixIds = []
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = startResolution / Math.pow(2, i)
    matrixIds[i] = opts.matrixTemplate
      ? opts.matrixTemplate.replace(/{z}/, i)
      : i
  }
  return new WMTSTileGrid({
    extent: wmtsData.extent,
    origin: getTopLeft(projExtent),
    resolutions: resolutions,
    matrixIds: matrixIds
  })
}

// http://www.atlefren.net/post/2014/05/how-to-calculate-maxresolution-for-wmts-given-info-in-getcapabilities/
function getBoundsAndMaxResForWMTS(
  scaleDenominator: number,
  topLeftCorner: [number, number],
  tileWidth: number,
  matrixWidth: number,
  tileHeight: number,
  matrixHeight: number
) {
  const standardizedRenderingPixelSize = 0.00028
  const widthPixel = tileWidth * matrixWidth
  const heightPixel = tileHeight * matrixHeight
  const right =
    scaleDenominator * widthPixel * standardizedRenderingPixelSize +
    topLeftCorner[0]
  const bottom =
    topLeftCorner[1] -
    scaleDenominator * heightPixel * standardizedRenderingPixelSize
  const maxResolutionW = Math.round((right - topLeftCorner[0]) / widthPixel)
  const maxResolutionH = Math.round((topLeftCorner[1] - bottom) / heightPixel)
  if (maxResolutionW !== maxResolutionH) {
    throw new Error('Could not calculate resolution!')
  }
  return {
    extent: <Extent>[topLeftCorner[0], bottom, right, topLeftCorner[1]],
    maxResolution: maxResolutionW
  }
}
