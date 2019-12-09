import { apiUrls } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { validURL, parseURL, constructURL, uid } from 'Utilities/util'
import { getState } from 'Utilities/store'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import { createLayer } from './LayerCreator'
import $ from 'jquery'

class LayerFromService extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<li />`)
    this.modal = $('#modal_wmslayer')
    this.isRow = true
    this.layer_conf = {
      TileWMS: {
        type: 'TileWMS',
        url: null,
        projection: 'EPSG:3301',
        gutter: 20,
        crossOrigin: null
      },
      WMTS: {
        type: 'WMTS',
        url: null,
        projection: 'EPSG:3301',
        layer: null,
        matrixSet: null,
        scaleDenominator: null,
        topLeftCorner: null,
        matrixWidth: 1,
        matrixHeight: 1,
        format: 'image/png',
        crossOrigin: null
      }
    }
    this.layer_conf_params = {
      LAYERS: null,
      TILED: true,
      FORMAT: 'image/png',
      VERSION: '1.1.1'
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
              <div class="modal-body">
                <div class="text-muted">
                  ${t('Insert WMS/WMTS URL')}
                </div>
                <textarea class="form-control" rows="3"></textarea>
                <input name="id" type="hidden" />
                <div class="form-inline py-2">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="group" id="group1" value="base">
                    <label class="form-check-label" for="group1">${t('Add as base map')}</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="group" id="group2" value="layers" checked>
                    <label class="form-check-label" for="group2">${t('Add as overlay')}</label>
                  </div>
                </div>
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
        if (this.modal.find('textarea').val().length < 10) {
          return
        }
        const groupId = this.modal.find('input[name=group]:checked').val()
        const group = getState('map/layer/' + groupId)
        let idx = group.getLength()
        // edit
        if (this.modal.find('input[name=id]').val().length) {
          // get old index
          const oldLayer = group.getArray()
            .filter(layer => layer.get('id') === this.modal.find('input[name=id]').val())
          if (oldLayer.length) {
            idx = group.getArray().indexOf(oldLayer[0])
            // remove old layer
            group.remove(oldLayer[0])
          }
        }
        const layer = this.createLayer(this.modal.find('textarea').val().trim(), (groupId === 'base'))
        if (layer) {
          group.insertAt(idx, layer)
          this.modal.find('textarea, input[name=id]').val('')
          this.modal.modal('hide')
        }
      })
      this.modal.on('click', '.examples a', e => {
        e.preventDefault()
        this.modal.find('textarea').val(decodeURIComponent(e.target.href))
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
  createLayer (url, isBase) {
    const debug = getState('app/debug')
    const urlComponents = parseURL(url)
    if (validURL(url) && urlComponents.query) {
      // find service
      const service = this.pickService(urlComponents.query)
      if (!service || !(service in this.layer_conf)) {
        return false
      }
      const conf = Object.assign({}, this.layer_conf[service], urlComponents.query)
      switch (service) {
        case 'TileWMS':
          conf.params = Object.assign({}, this.layer_conf_params)
          if (urlComponents.query.LAYERS || urlComponents.query.layers) {
            conf.params.LAYERS = urlComponents.query.LAYERS || urlComponents.query.layers
            conf.title = urlComponents.query.title || conf.params.LAYERS
            delete urlComponents.query.LAYERS
            delete urlComponents.query.layers
          } else {
            log('error', t('Missing LAYERS parameter'))
            if (debug) {
              console.error(`WMSLayer.createLayer: Missing LAYERS parameter - ${url}`)
            }
            return
          }
          break
        case 'WMTS':
          conf.topLeftCorner = urlComponents.query.topLeftCorner.split(',').map(string => Number(string))
          conf.title = urlComponents.query.title || conf.layer
          conf.scaleDenominator = Number(urlComponents.query.scaleDenominator)
          conf.matrixWidth = Number(urlComponents.query.matrixWidth)
          conf.matrixHeight = Number(urlComponents.query.matrixHeight)
          delete urlComponents.query.topLeftCorner
          delete urlComponents.query.layer
          delete urlComponents.query.matrixSet
          delete urlComponents.query.scaleDenominator
          delete urlComponents.query.matrixWidth
          delete urlComponents.query.matrixHeight
          delete urlComponents.query.format
          break
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
      delete urlComponents.query.title
      conf.url = constructURL(urlComponents)
      conf.id = uid()
      conf.visible = true
      conf.opacity = Number(urlComponents.query.opacity) || 1
      conf.editable = true
      if (isBase) {
        conf.zIndex = 0
      }
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
  pickService (params) {
    if ('matrixSet' in params) {
      return 'WMTS'
    }
    if ('layers' in params) {
      return 'TileWMS'
    }
    return false
  }
}

export default LayerFromService
