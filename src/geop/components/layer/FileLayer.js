import { t } from 'Utilities/translate'
import { uid, getRandomColor, hexToRgbA } from 'Utilities/util'
import { getState } from 'Utilities/store'
import log from 'Utilities/log'
import { createLayer, dataProjection } from './LayerCreator'
import Component from 'Geop/Component'
import GPXFormat from 'Utilities/GPXFormat'
import GeoJSONFormat from 'ol/format/GeoJSON'
import KMLFormat from 'ol/format/KML'
import DragAndDrop from 'ol/interaction/DragAndDrop'
import $ from 'jquery'

class FileLayer extends Component {
  constructor (target) {
    super(target)
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      return
    }
    this.el = $(`<li />`)
    this.isRow = true
    this.fileTypes = {
      gpx: new GPXFormat(),
      geojson: new GeoJSONFormat(),
      kml: new KMLFormat()
    }
    // alias for geojson
    this.fileTypes.json = this.fileTypes.geojson
    this.state = {
      layers: getState('map/layer/layers')
    }
    this.addDragNDrop()
    // create is called from parent
  }
  render () {
    const debug = getState('app/debug')
    this.el.html(`
      <a href="#"
        id="add-file-layer"
        class="dropdown-item">
        <i class="fa fa-plus"></i>
        ${t('Add File layer')}
      </a>
      <input type="file" style="display:none;" />
    `)
    this.el.on('click', 'a#add-file-layer', e => {
      e.preventDefault()
      e.stopPropagation()
      $(e.target).closest('li').find('input').trigger('click')
    })
    this.el.on('change', 'input', e => {
      const files = e.target.files
      if (files && files[0]) {
        const filename = files[0].name
        const ext = filename.split('.').pop().toLowerCase()
        if (ext in this.fileTypes) {
          if (debug) {
            console.debug(`FileLayer.render input change: ${filename}`)
          }
          const reader = new window.FileReader()
          reader.onload = (e) => {
            const parser = this.fileTypes[ext]
            const features = parser.readFeatures(e.target.result)
            const conf = this.fileTypes.geojson.writeFeaturesObject(features)
            conf.title = filename
            const layer = this.createLayer(conf)
            if (layer) {
              this.state.layers.push(layer)
              log('success', `${t('Added')} ${conf.features.length} ${t('features')}`)
              if (debug) {
                console.debug(`FileLayer.render layer created: ${filename}, features: ${conf.features.length}`)
              }
            }
          }
          reader.readAsText(files[0])
        } else {
          log('error', t('Unsupported file type'))
          if (debug) {
            console.error(`FileLayer.render Unsupported file type: ${filename}`)
          }
        }
      }
    })
  }
  addDragNDrop () {
    // add only once to map
    const map = getState('map')
    let added = false
    if (map) {
      const interactions = map.getInteractions()
      interactions.forEach(i => {
        if (i instanceof DragAndDrop) {
          added = true
        }
      })
    }
    if (!added) {
      const dragAndDropInteraction = new DragAndDrop({
        projection: dataProjection,
        formatConstructors: [
          GPXFormat,
          GeoJSONFormat,
          KMLFormat
        ]
      })
      dragAndDropInteraction.on('addfeatures', e => {
        const conf = this.fileTypes.geojson.writeFeaturesObject(e.features)
        conf.title = e.file.name
        const layer = this.createLayer(conf)
        if (layer) {
          this.state.layers.push(layer)
          log('success', `${t('Added')} ${conf.features.length} ${t('features')}`)
          if (getState('app/debug')) {
            console.debug(`FileLayer.addDragNDrop layer created: ${e.file.name}, features: ${conf.features.length}`)
          }
        }
      })
      if (map) {
        map.addInteraction(dragAndDropInteraction)
      } else {
        const que = getState('map/que')
        que.push(map => {
          map.addInteraction(dragAndDropInteraction)
        })
      }
    }
  }
  createLayer (conf) {
    if (conf.features.length > 0) {
      const color = getRandomColor({
        luminosity: 'dark'
      })
      conf.id = uid()
      conf.features && conf.features.forEach(f => {
        f.id = uid()
      })
      conf.color = color
      conf.visible = true
      conf.style = getFileLayerStyleConf(color)
      try {
        return createLayer(conf)
      } catch (e) {
        log('error', t('Error creating layer') + e)
        if (getState('app/debug')) {
          console.debug(`FileLayer.addDragNDrop layer created: ${e.file.name}, features: ${conf.features.length}`)
        }
      }
    } else {
      log('error', t('Empty file'))
      if (getState('app/debug')) {
        console.debug(`FileLayer.addDragNDrop empty file: ${conf.title}`)
      }
    }
  }
}

export function getFileLayerStyleConf (color) {
  return {
    stroke: {
      color: color,
      width: 2
    },
    fill: {
      color: hexToRgbA(color, 0.5)
    },
    circle: {
      stroke: {
        color: color
      },
      fill: {
        color: hexToRgbA(color, 0.3)
      }
    }
  }
}

export default FileLayer
