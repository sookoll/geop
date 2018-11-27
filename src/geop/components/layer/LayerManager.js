import $ from 'jquery'
import {getState, setState} from 'Utilities/store'
import {t} from 'Utilities/translate'
import Component from 'Geop/Component'
import OSMEdit from 'Components/osmedit/OSMEdit'
import WMSLayer from './WMSLayer'
import FileLayer from './FileLayer'
import './LayerManager.styl'

class LayerManager extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-right" id="layermanager"></div>`)
    this.state = {
      activeBaseLayer: null,
      baseLayers: getState('map/layer/base'),
      layers: getState('map/layer/layers'),
      open: false
    }
    this.state.baseLayers.forEach(layer => {
      if (layer.get('id') === getState('map/baseLayer')) {
        this.state.activeBaseLayer = layer
      }
    })
    this.state.layers.on('add', () => this.render())
    this.state.layers.on('remove', () => this.render())
    this.create()
    // do not init here
    this.components = {
      osm: OSMEdit,
      wms: WMSLayer,
      file: FileLayer
    }
    this.renderChildrens(this.el.find('.dropdown-menu'))
  }

  create () {
    super.create()
    // events
    if (this.target && this.el) {
      this.el.on('click', 'a.baselayer', e => {
        e.preventDefault()
        e.stopPropagation()
        const id = $(e.currentTarget).data('id')
        if (id === this.state.activeBaseLayer.get('id')) {
          this.toggleLayer(this.state.baseLayers, id)
        } else {
          this.changeBaseLayer(id)
        }
      })
      this.el.on('click', 'a.layers', e => {
        e.preventDefault()
        e.stopPropagation()
        this.toggleLayer(this.state.layers, $(e.currentTarget).data('id'))
      })
      this.el.on('click', 'a.remove-layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.removeLayer($(e.currentTarget).data('id'))
      })
    }
  }

  render () {
    this.el.html(`
      <button type="button"
        class="btn btn-secondary toggle-btn dropdown-toggle no-caret"
        data-toggle="dropdown"
        aria-expanded="false">
        <span class="display-name hidden-xs">
          ${this.state.activeBaseLayer ?
            t(this.state.activeBaseLayer.get('title')) : t('Layers')}
        </span>
        <i class="fa fa-layer-group"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-right">
        ${this.state.baseLayers.getLength() > 0 ?
          this.state.baseLayers.getArray().map(layer => {
            return `
              <li>
                <a href="#" class="baselayer dropdown-item ${this.layerVisible(layer) ? '' : 'disabled'}"
                  data-id="${layer.get('id')}">
                  <i class="far ${layer.getVisible() ? 'fa-dot-circle' : 'fa-circle'}"></i>
                  ${t(layer.get('title'))}
                </a>
              </li>`
        }).join('') :
        `<li class="dropdown-item disabled">${t('No baselyers added')}</li>`}
        ${this.state.layers.getLength() > 0 ?
          `<li class="dropdown-divider"></li>` +
          this.state.layers.getArray().map(layer => {
            return `
              <li>
                <a href="#" class="layers dropdown-item ${this.layerVisible(layer) ? '' : 'disabled'}"
                  data-id="${layer.get('id')}">
                  <i class="far ${layer.getVisible() ? 'fa-check-square' : 'fa-square'}"></i>
                  ${t(layer.get('title'))}
                </a>
                <a href="#" class="remove-layer" data-id="${layer.get('id')}">
                  <i class="fa fa-times"></i>
                </a>
              </li>`
            }).join('') : ''}
      </ul>`)
    this.renderChildrens(this.el.find('.dropdown-menu'))
    if (this.state.open) {
      this.el.find('button.toggle-btn').dropdown('toggle')
      this.state.open = false
    }
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
    setState('map/baseLayer', this.state.activeBaseLayer.get('id'), true)
    this.state.open = true
    this.render()
  }

  toggleLayer (group, id) {
    group.forEach(layer => {
      if (layer.get('id') === id) {
        layer.setVisible(!layer.getVisible())
        return
      }
    })
    this.state.open = true
    this.render()
  }

  removeLayer (id) {
    this.state.layers.forEach(layer => {
      if (layer.get('id') === id) {
        this.state.open = true
        this.state.layers.remove(layer)
        return
      }
    })
  }

  renderChildrens (target) {
    let dividerAdded = false
    Object.keys(this.components).forEach((i) => {
      const plug = new this.components[i](target)
      if (plug && plug.isRow && !dividerAdded) {
        target.append('<div class="dropdown-divider"></div>')
        dividerAdded = true
      }
      plug.create()
    })
  }

}

export default LayerManager
