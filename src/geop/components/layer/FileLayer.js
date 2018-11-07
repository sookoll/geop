import {t} from 'Utilities/translate'
import {uid, randomColor} from 'Utilities/util'
import {getState} from 'Utilities/store'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import {FeatureLayer} from './LayerCreator'
import GPXFormat from 'ol/format/GPX'
import $ from 'jquery'

class WMSLayer extends Component {
  constructor (target) {
    super(target)
    this.isRow = true
    this.state = {
      overlays: getState('map/layer/overlays')
    }
    this.fileTypes = {
      gpx: new GPXFormat()
    }

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
            const layer = this.createLayer(filename, e.target.result, this.fileTypes[ext])
            if (layer) {
              this.state.overlays.push(layer)
            }
          }
          reader.readAsText(files[0])
        }
      }
    })
  }

  createLayer (filename, content, parser) {
    const features = parser.readFeatures(content, {
      dataProjection:'EPSG:4326',
      featureProjection:'EPSG:3857'
    })
    if (features.length > 0) {
      const conf = {
        id: uid(),
        title: filename,
        features: features,
        style: {
          stroke: {
            color: randomColor(),
            width: 2
          }
        }
      }
      return new FeatureLayer(conf)
    } else {
      log('warning', t('Empty file'))
    }
  }
}

export default WMSLayer
