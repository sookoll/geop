import Group from 'ol/layer/Group'
import Image from 'ol/layer/Image'
import Tile from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import TileWMS from 'ol/source/TileWMS'
import Vector from 'ol/source/Vector'
import {get as getProjection} from 'ol/proj'
import {getWidth} from 'ol/extent'
import TileGrid from 'ol/tilegrid/TileGrid'
import StyleBuilder from './StyleBuilder'
import range from 'lodash/range'
import {map as mapConf} from 'Conf/settings'

const sources = {
  OSM,
  XYZ,
  TileWMS,
  Vector
}

const styleBuilder = new StyleBuilder()

export function create (layerConf) {
  const prefix = 'Image'
  let layer
  if (layerConf.type === 'Group') {
    const arr = layerConf.layers.map(conf => {
      // add projection to sublayer
      if (!conf.projection) {
        conf.projection = layerConf.projection
      }
      if (conf.type.slice(0, prefix.length) === prefix) {
        return new ImageLayer(conf)
      } else {
        return new TileLayer(conf)
      }
    })
    layer = new GroupLayer({
      title: layerConf.title,
      layers: arr
    })
  } else {
    if (layerConf.type.slice(0, prefix.length) === prefix) {
      layer = new ImageLayer(layerConf)
    } else {
      layer = new TileLayer(layerConf)
    }
  }
  if (layerConf.opacity) {
    layer.setOpacity(layerConf.opacity)
  }
  layer.setVisible(layerConf.visible)
  return layer
}

export class GroupLayer extends Group {}
export class ImageLayer extends Image {
  constructor (opts) {
    const options = {
      title: opts.title,
      source: new sources[opts.type](opts)
    }
    super(options)
    if (opts.minResolution) {
      this.setMinResolution(opts.minResolution)
    }
    if (opts.maxResolution) {
      this.setMaxResolution(opts.maxResolution)
    }
    if (opts.opacity) {
      this.setOpacity(opts.opacity)
    }
  }
}
export class TileLayer extends Tile {
  constructor (opts) {
    if (opts.tileSize && opts.tileSize !== 256) {
      const projExtent = getProjection(opts.projection).getExtent()
      const startResolution = getWidth(projExtent) / opts.tileSize
      const resolutions = range(mapConf.minZoom, mapConf.maxZoom + 1)
      for (let i = 0, ii = resolutions.length; i < ii; ++i) {
        resolutions[i] = startResolution / Math.pow(2, i)
      }
      const tileGrid = new TileGrid({
        extent: projExtent,
        resolutions: resolutions,
        tileSize: [opts.tileSize, opts.tileSize]
      })
      opts.tileGrid = tileGrid
    }
    const options = {
      title: opts.title,
      source: new sources[opts.type](opts)
    }
    super(options)
    if (opts.id) {
      this.set('id', opts.id)
    }
    if (opts.minResolution) {
      this.setMinResolution(opts.minResolution)
    }
    if (opts.maxResolution) {
      this.setMaxResolution(opts.maxResolution)
    }
    if (opts.opacity) {
      this.setOpacity(opts.opacity)
    }
  }
}
export class FeatureLayer extends VectorLayer {
  constructor (opts) {
    const options = {
      id: opts.id,
      title: opts.title,
      source: new Vector({
        features: opts.features
      }),
      style: styleBuilder.create(opts.style)
    }
    super(options)

    if (opts.minResolution) {
      this.setMinResolution(opts.minResolution)
    }
    if (opts.maxResolution) {
      this.setMaxResolution(opts.maxResolution)
    }
    if (opts.opacity) {
      this.setOpacity(opts.opacity)
    }
  }
}
