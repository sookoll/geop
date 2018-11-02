import $ from 'jquery'
import 'bootstrap/js/dist/dropdown'
import {getState, setState} from 'Utilities/store'
import {layers as layerConf} from 'Conf/layers'
import {t} from 'Utilities/translate'
import Component from 'Geop/Component'
import './LayerManager.styl'

class LayerManager extends Component {
  constructor (target) {
    super(target)
    this.state = {
      activeBaseLayer: getState('map/layer/active'),
      baseLayers: getState('map/layer/base'),
      overlays: getState('map/layer/overlays')
    }
    this.render()
  }

  render () {
    const html = $(`
      <div class="btn-group float-right" id="layermanager">
        <button type="button"
          class="btn btn-secondary"
          data-toggle="dropdown"
          aria-expanded="false">
          <span class="display-name hidden-xs">
            ${this.state.activeBaseLayer ?
              t(this.state.activeBaseLayer.get('title')) : t('Layers')}
          </span>
          <i class="fa fa-globe"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-right">
          ${this.state.baseLayers.getLength() > 0 ?
            this.state.baseLayers.getArray().map(layer => {
              return `
                <a href="#" class="baselayer dropdown-item ${this.layerVisible(layer) ? '' : 'disabled'}"
                  data-name="${layer.get('id')}">
                  ${t(layer.get('title'))}
                </a>`
          }).join('') :
          `<a class="dropdown-item disabled" href="#">${t('No baselyers added')}</a>`}
          <div class="dropdown-divider"></div>
          ${this.state.overlays.getLength() > 0 ?
            this.state.overlays.getArray().map(layer => {
            return `
              <a href="#" class="overlays dropdown-item ${this.layerVisible(layer) ? '' : 'disabled'}"
                data-name="${layer.get('id')}">
                ${t(layer.get('title'))}
              </a>`
          }).join('') :
          `<a class="dropdown-item disabled" href="#">${t('No overlays added')}</a>`}
        </div>
      </div>`)
    if (this.el) {
      this.el.remove()
    }
    this.target.append(html)
    this.el = this.target.find('#layermanager')
    this.el.on('click', 'a.baselayer', e => {
      e.preventDefault()
      this.changeBaseLayer($(e.target).data('name'))
    })
  }

  getLayerConf (type, id) {
    return layerConf[type][id]
  }

  layerVisible (layer) {
    if (layer.minResolution && this._map.getView().getResolution() < layer.minResolution) {
      return false;
    }
    if (layer.maxResolution && this._map.getView().getResolution() > layer.maxResolution) {
      return false;
    }
    return true;
  }

  changeBaseLayer (name) {
    this.state.baseLayers.forEach(layer => {
      layer.set('visible', (layer.get('id') === name))
    })
    this.state.activeBaseLayer = name
    setState('map/layer/active', name)
    this.render()
    //this.updatePermalink();
  }

}

export default LayerManager
