import {t} from 'Utilities/translate'
import {uid, randomColor, hexToRgbA} from 'Utilities/util'
import {getState} from 'Utilities/store'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import {FeatureLayer} from './LayerCreator'
import GPXFormat from 'ol/format/GPX'
import GeoJSONFormat from 'ol/format/GeoJSON'
import KMLFormat from 'ol/format/KML'
import DragAndDrop from 'ol/interaction/DragAndDrop'
import $ from 'jquery'

class FileLayer extends Component {
  constructor (target) {
    super(target)
    this.isRow = true
    this.state = {
      layers: getState('map/layer/layers')
    }
    this.fileTypes = {
      gpx: new GPXFormat(),
      geojson: new GeoJSONFormat(),
      kml: new KMLFormat()
    }
    // alias for geojson
    this.fileTypes.json = this.fileTypes.geojson
    this.addDragNDrop()
  }
  render () {
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      return
    }
    this.target.append(`
      <li>
        <a href="#"
          id="add-file-layer"
          class="dropdown-item">
          <i class="fa fa-plus"></i>
          ${t('Add File layer')}
        </a>
        <input id="file-input" type="file" style="display:none;" />
      </li>`)
    this.target.on('click', 'a#add-file-layer', e => {
      e.preventDefault()
      e.stopPropagation()
      $(e.target).closest('li').find('input').trigger('click')
    })
    this.target.on('change', 'input#file-input', e => {
      const files = e.target.files
      if (files && files[0]) {
        const filename = files[0].name
        const ext = filename.split('.').pop().toLowerCase()
        if (ext in this.fileTypes) {
          const reader = new window.FileReader()
          reader.onload = (e) => {
            const parser = this.fileTypes[ext]
            const features = parser.readFeatures(e.target.result, {
              dataProjection:'EPSG:4326',
              featureProjection:'EPSG:3857'
            })
            const layer = this.createLayer(filename, {
              features: features,
              projection: 'EPSG:3857'
            })
            if (layer) {
              this.state.layers.push(layer)
            }
          }
          reader.readAsText(files[0])
        } else {
          log('error', t('Unsupported file type'))
        }
      }
    })
  }

  createLayer (filename, conf) {
    if (conf.features.length > 0) {
      const color = randomColor()
      conf.id = uid()
      conf.title = filename
      conf.style = {
        stroke: {
          color: color,
          width: 2
        },
        fill: {
          color: hexToRgbA(color, 0.5)
        },
        image: {
          stroke: {
            color: color
          },
          fill: {
            color: hexToRgbA(color, 0.3)
          }
        }
      }
      return new FeatureLayer(conf)
    } else {
      log('error', t('Empty file'))
    }
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
          return
        }
      })
    }
    if (!added) {
      const dragAndDropInteraction = new DragAndDrop({
        formatConstructors: [
          GPXFormat,
          GeoJSONFormat,
          KMLFormat
        ]
      })
      dragAndDropInteraction.on('addfeatures', e => {
        const layer = this.createLayer(e.file.name, {
          features: e.features,
          projection: e.projection
        })
        if (layer) {
          this.state.layers.push(layer)
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
}

export default FileLayer
