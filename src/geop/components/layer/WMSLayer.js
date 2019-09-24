import { apiUrls } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { validURL, parseURL, constructURL, uid } from 'Utilities/util'
import { getState } from 'Utilities/store'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import { createLayer } from './LayerCreator'
import $ from 'jquery'

class WMSLayer extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<li />`)
    this.modal = $('#modal_wmslayer')
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
    // create is called from parent
  }
  render () {
    if (!this.modal || this.modal.length === 0) {
      const examples = Object.keys(apiUrls.wmsexamples).map(title => {
        return `<a href="${apiUrls.wmsexamples[title]}">
          ${title}
        </a>`
      })
      this.modal = $(`
        <div class="modal fade"
          id="modal_wmslayer"
          tabindex="-1"
          role="dialog"
          aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title">${t('Add WMS layer')}</h4>
                <button type="button"
                  class="close"
                  data-dismiss="modal"
                  aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body text-muted">
                ${t('Insert WMS v.1.1.1 URL with LAYERS and SRS parameters')}
                <textarea class="form-control" rows="3"></textarea>
                <div class="small examples">
                  ${examples.length ? '<b>Näited:</b><br>' : ''}
                  ${examples.join('<br/>')}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary confirm">${t('Add')}</button>
              </div>
            </div>
          </div>
        </div>
      `)
      this.modal.on('click', 'button.confirm', e => {
        e.preventDefault()
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
      $('body').append(this.modal)
    }
    this.el.html(`
      <a href="#"
        id="add-wms-layer"
        class="dropdown-item"
        data-toggle="modal"
        data-target="#modal_wmslayer">
        <i class="fa fa-plus"></i>
        ${t('Add WMS layer')}
      </a>
    `)
  }
  createLayer (url) {
    const debug = getState('app/debug')
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
        if (debug) {
          console.error(`WMSLayer.createLayer: Missing LAYERS parameter - ${url}`)
        }
        return
      }
      if (urlComponents.query.SRS || urlComponents.query.srs) {
        conf.projection = urlComponents.query.srs || urlComponents.query.SRS
        delete urlComponents.query.SRS
        delete urlComponents.query.srs
      } else {
        log('error', t('Missing SRS parameter'))
        if (debug) {
          console.error(`WMSLayer.createLayer: Missing SRS parameter - ${url}`)
        }
        return
      }
      conf.url = constructURL(urlComponents)
      conf.id = uid()
      conf.title = urlComponents.query.title || conf.params.LAYERS
      conf.opacity = urlComponents.query.opacity || 1
      return createLayer(conf)
    } else {
      log('error', t('URL is not valid WMS resource!'))
      if (debug) {
        console.error(`WMSLayer.createLayer: URL is not valid WMS resource! - ${url}`)
      }
    }
    return null
  }
  destroy () {
    this.modal.modal('dispose')
    this.modal.remove()
    this.modal = null
    super.destroy()
  }
}

export default WMSLayer
