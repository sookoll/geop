import $ from 'jquery'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
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
    this.handlers = {
      onchange: () => {
        this.render()
        this.store()
      }
    }
    this.state.baseLayers.forEach(layer => {
      if (layer.get('id') === getState('map/baseLayer')) {
        this.state.activeBaseLayer = layer
      }
    })
    this.state.layers.on('add', this.handlers.onchange)
    this.state.layers.on('remove', this.handlers.onchange)
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
      this.el.on('click', '.baselayer', e => {
        e.preventDefault()
        e.stopPropagation()
        const id = $(e.currentTarget).data('id')
        if (id === this.state.activeBaseLayer.get('id')) {
          this.toggleLayer(this.state.baseLayers, id)
        } else {
          this.changeBaseLayer(id)
        }
      })
      this.el.on('click', '.layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.toggleLayer(this.state.layers, $(e.currentTarget).data('id'))
      })
      this.el.on('click', '.layer a.fit-layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.fitTo($(e.currentTarget).closest('.layer').data('id'))
      })
      this.el.on('click', '.layer a.remove-layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.removeLayer($(e.currentTarget).closest('.layer').data('id'))
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
              <li
                class="dropdown-item baselayer ${this.layerVisible(layer) ? '' : 'disabled'}"
                data-id="${layer.get('id')}">
                <i class="far ${layer.getVisible() ? 'fa-dot-circle' : 'fa-circle'}"></i>
                ${t(layer.get('title'))}
              </li>`
        }).join('') :
        `<li class="dropdown-item disabled">${t('No baselyers added')}</li>`}
        ${this.state.layers.getLength() > 0 ?
          `<li class="dropdown-divider"></li>` +
          this.state.layers.getArray().map(layer => {
            return `
              <li
                class="dropdown-item layer ${this.layerVisible(layer) ? '' : 'disabled'}"
                data-id="${layer.get('id')}">
                <i class="far ${layer.getVisible() ? 'fa-check-square' : 'fa-square'}"></i>
                ${t(layer.get('title'))}
                <div class="layer-tools">
                  <a href="#" class="fit-layer">
                    <i class="fa fa-search-plus"></i>
                  </a>
                  <a href="#" class="remove-layer">
                    <i class="fa fa-times"></i>
                  </a>
                </div>
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
      if (layer && layer.get('id') === id) {
        this.state.open = true
        this.state.layers.remove(layer)
        return
      }
    })
  }

  fitTo (id) {
    for (let layer of this.state.layers.getArray()) {
      if (layer && layer.get('id') === id) {
        this.state.open = true
        const bbox = layer.getSource().getExtent ?
          layer.getSource().getExtent() : layer.getExtent()
        if (bbox) {
          getState('map').getView().fit(bbox, {
            padding: [50, 50, 50, 50],
            maxZoom: 17,
            duration: 500
          })
        } else {
          log('error', `${t('Unable to find layer extent')}`)
        }
        break
      }
    }
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

  store () {
    const layerConfs = Object.assign({}, getState('map/layers'))
    layerConfs.layers = this.state.layers.getArray().map(layer => {
      return layer.get('conf')
    })
    setState('map/layers', layerConfs, true)
  }

}

export default LayerManager
