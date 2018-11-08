import {t} from 'Utilities/translate'
import {validURL, parseURL, constructURL, uid} from 'Utilities/util'
import {getState} from 'Utilities/store'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import {TileLayer} from './LayerCreator'
import $ from 'jquery'

class WMSLayer extends Component {
  constructor (target) {
    super(target)
    this.isRow = true
    this.layer_conf = {
        type: 'TileWMS',
        url: null,
        projection: 'EPSG:3301',
        gutter: 20,
        crossOrigin: null
    }
    this.layer_conf_params = {
        LAYERS: null,
        TILED: true,
        FORMAT: 'image/png',
        VERSION: '1.1.1'
    }
    this.state = {
      layers: getState('map/layer/layers')
    }
  }
  render () {
    this.modal = $('#modal_wmslayer')
    if (this.modal.length === 0) {
      $('body').append(`
        <div class="modal fade" id="modal_wmslayer" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title">${t('Add WMS layer')}</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              </div>
              <div class="modal-body text-muted">
                ${t('Insert WMS v.1.1.1 URL with LAYERS and SRS parameters')}
                <textarea class="form-control" rows="3"></textarea>
                <div class="small examples">
                  <b>Näited:</b><br>
                  <a href="http://kaart.maaamet.ee/wms/alus?layers=TOPOYKSUS_6569,TOPOYKSUS_7793&SRS=EPSG:3301&title=Kataster">katastrikaart</a>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary confirm">${'Add'}</button>
              </div>
            </div>
          </div>
        </div>`)
      this.modal = $('#modal_wmslayer')
      this.modal.on('click', 'button.confirm', e => {
        e.preventDefault()
        console.log(e)
        const layer = this.createLayer(this.modal.find('textarea').val().trim())
        if (layer) {
          this.state.layers.push(layer)
          this.modal.find('textarea').val('')
          this.modal.modal('hide')
        }
      })
      this.modal.on('click', '.examples a', e => {
        e.preventDefault()
        this.modal.find('textarea').val(e.target.href)
      })
    }
    this.target.append(`
      <li>
        <a href="#"
          id="add-wms-layer"
          class="dropdown-item"
          data-toggle="modal"
          data-target="#modal_wmslayer">
          <i class="fa fa-plus"></i>
          ${t('Add WMS layer')}
        </a>
      </li>`)
  }
  createLayer (url) {
    const urlComponents = parseURL(url)
    if (validURL(url) && urlComponents.query) {
      const conf = Object.assign({}, this.layer_conf)
      conf.params = Object.assign({}, this.layer_conf_params)
      if (urlComponents.query.LAYERS || urlComponents.query.layers) {
        conf.params.LAYERS = urlComponents.query.LAYERS || urlComponents.query.layers
        delete urlComponents.query.LAYERS
        delete urlComponents.query.layers
      } else {
        log('error', t('Missing LAYERS parameter'))
        return
      }
      if (urlComponents.query.SRS || urlComponents.query.srs) {
        conf.projection = urlComponents.query.srs || urlComponents.query.SRS
        delete urlComponents.query.SRS
        delete urlComponents.query.srs
      } else {
        log('error', t('Missing SRS parameter'))
        return
      }
      conf.url = constructURL(urlComponents)
      conf.id = uid()
      conf.title = urlComponents.query.title || conf.params.LAYERS
      return new TileLayer(conf)
    } else {
      log('error', t('URL is not valid WMS resource!'))
    }
  }
}

export default WMSLayer
