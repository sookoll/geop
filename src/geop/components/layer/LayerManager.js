import $ from 'jquery'
import 'bootstrap/js/dist/dropdown'
import {getState, setState} from 'Utilities/store'
import {layers as layerConf} from 'Conf/layers'
import {t} from 'Utilities/translate'
import Component from 'Geop/Component'
import OSMEdit from 'Components/osmedit/OSMEdit'
import WMSLayer from './WMSLayer'
import './LayerManager.styl'

class LayerManager extends Component {
  constructor (target) {
    super(target)
    this.state = {
      activeBaseLayer: getState('map/layer/active'),
      baseLayers: getState('map/layer/base'),
      overlays: getState('map/layer/overlays'),
      plugins: [
        OSMEdit,
        WMSLayer
      ]
    }
    this.state.overlays.on('add', () => this.render())
    this.state.overlays.on('remove', () => this.render())
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
                  <i class="far ${layer.getVisible() ? 'fa-check-square' : 'fa-square'}"></i>
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
    // renderPlugins
    this.renderPlugins(this.target.find('#layermanager .dropdown-menu'))
    this.el = this.target.find('#layermanager')
    // events
    this.el.on('click', 'a.baselayer', e => {
      e.preventDefault()
      this.changeBaseLayer($(e.target).data('name'))
    })
    this.el.on('click', 'a.overlays', e => {
      e.preventDefault()
      e.stopPropagation()
      this.toggleLayer($(e.target).data('name'))
      $(e.target).find('i').toggleClass('fa-check-square fa-square')
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

  changeBaseLayer (id) {
    this.state.baseLayers.forEach(layer => {
      if (layer.get('id') === id) {
        layer.setVisible(true)
        this.state.activeBaseLayer = layer
      } else {
        layer.setVisible(false)
      }
    })
    setState('map/layer/active', this.state.activeBaseLayer)
    this.render()
    //this.updatePermalink();
  }

  toggleLayer (id) {
    this.state.overlays.forEach(layer => {
      if (layer.get('id') === id) {
        layer.setVisible(!layer.getVisible())
        return
      }
    })
    //this.render()
  }

  renderPlugins (target) {
    if (this.state.plugins.length > 0) {
      let dividerAdded = false
      this.state.plugins.forEach((Plugin) => {
        const plug = new Plugin(target)
        if (plug.isRow && !dividerAdded) {
          target.append('<div class="dropdown-divider"></div>')
          dividerAdded = true
        }
        plug.render()
      })
    }
  }

}

export default LayerManager
