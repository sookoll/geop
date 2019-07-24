import $ from 'jquery'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import {
  set as setPermalink,
  onchange as onPermalinkChange,
  viewConfToPermalink
} from 'Utilities/permalink'
import Component from 'Geop/Component'
import OSMEdit from 'Components/osmedit/OSMEdit'
import WMSLayer from './WMSLayer'
import FileLayer from './FileLayer'
import UrlLayer from './UrlLayer'
import Sortable from 'sortablejs'
import './LayerManager.styl'

class LayerManager extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-right" id="layermanager"></div>`)
    this.state = {
      activeBaseLayer: null,
      baseLayers: getState('map/layer/base'),
      layers: getState('map/layer/layers'),
      overlays: getState('map/layer/overlays'),
      open: false
    }
    this.handlers = {
      onchange: () => {
        this.render()
      }
    }
    this.state.baseLayers.forEach(layer => {
      if (layer.get('id') === getState('map/baseLayer')) {
        this.state.activeBaseLayer = layer
      }
    })
    this.state.layers.on('add', this.handlers.onchange)
    this.state.layers.on('remove', this.handlers.onchange)
    this.state.overlays.on('add', this.handlers.onchange)
    this.state.overlays.on('remove', this.handlers.onchange)
    this.create()
    // do not init here
    this.components = {
      osm: OSMEdit,
      wms: WMSLayer,
      file: FileLayer
    }
    this.renderComponents(this.el.find('.dropdown-menu'))
    // register layer from url
    this.urlLayer = new UrlLayer()
    // listen permalink change
    onPermalinkChange(permalink => {
      if (permalink.view) {
        const baseLayerId = this.permalinkToViewConf(permalink.view)
        if (baseLayerId) {
          this.changeBaseLayer(baseLayerId)
        }
      }
    })
  }

  create () {
    super.create()
    // events
    if (this.target && this.el) {
      this.el.on('click', '.baselayer', e => {
        e.preventDefault()
        e.stopPropagation()
        const id = $(e.currentTarget).data('id')
        if (this.state.activeBaseLayer && id === this.state.activeBaseLayer.get('id')) {
          this.toggleLayer('baseLayers', id)
        } else {
          if (this.changeBaseLayer(id)) {
            setPermalink({
              view: viewConfToPermalink({
                center: getState('map/center'),
                zoom: getState('map/zoom'),
                rotation: getState('map/rotation'),
                baseLayer: id
              })
            })
          }
        }
      })
      this.el.on('click', '.layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.toggleLayer($(e.currentTarget).data('group'), $(e.currentTarget).data('id'))
      })
      this.el.on('click', '.layer a.fit-layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.fitTo($(e.currentTarget).closest('.layer').data('group'), $(e.currentTarget).closest('.layer').data('id'))
      })
      this.el.on('click', '.layer a.remove-layer', e => {
        e.preventDefault()
        e.stopPropagation()
        this.removeLayer($(e.currentTarget).closest('.layer').data('group'), $(e.currentTarget).closest('.layer').data('id'))
      })
    }
  }

  render () {
    this.el.html(`
      <button type="button"
        class="btn btn-secondary toggle-btn dropdown-toggle no-caret"
        data-toggle="dropdown"
        aria-label="${t('Layers')}"
        aria-expanded="false">
        <span class="display-name d-none d-sm-inline-block">
          ${this.state.activeBaseLayer
    ? t(this.state.activeBaseLayer.get('title')) : t('Layers')}
        </span>
        <i class="fa fa-layer-group"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-right">
        ${this.state.baseLayers.getLength() > 0
    ? this.state.baseLayers.getArray().map(layer => {
      return `
              <li
                class="dropdown-item baselayer ${this.layerVisible(layer) ? '' : 'disabled'}"
                data-id="${layer.get('id')}">
                <i class="far ${layer.getVisible() ? 'fa-dot-circle' : 'fa-circle'}"></i>
                ${t(layer.get('title'))}
              </li>`
    }).join('')
    : `<li class="dropdown-item disabled">${t('No baselyers added')}</li>`}
        ${this.renderLayerGroup('overlays', this.state.overlays)}
        ${this.renderLayerGroup('layers', this.state.layers, true)}
      </ul>`)
    this.renderComponents(this.el.find('.dropdown-menu'))
    if (this.state.open) {
      this.el.find('button.toggle-btn').dropdown('toggle')
      this.state.open = false
    }
    // sortable
    Sortable.create(this.el.find('div.sortable')[0], {
      draggable: 'li.sort-item',
      // handle: '.badge',
      onUpdate: e => {
        this.reorderLayers(e)
        // this.render()
      }
    })
  }

  renderLayerGroup (groupId, group, sortable = false) {
    return group.getLength() > 0
      ? `<li class="dropdown-divider"></li>${sortable ? '<div class="sortable">' : ''}` +
      group.getArray().map(layer => {
        return `
          <li
            class="dropdown-item ${sortable ? 'sort-item' : ''} layer ${this.layerVisible(layer) ? '' : 'disabled'}"
            data-group="${groupId}" data-id="${layer.get('id')}">
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
      }).join('') + `${sortable ? '</div>' : ''}` : ''
  }

  permalinkToViewConf (permalink) {
    const parts = permalink ? permalink.split('-') : []
    return parts[4]
  }

  layerVisible (layer) {
    if (layer.minResolution && this._map.getView().getResolution() < layer.minResolution) {
      return false
    }
    if (layer.maxResolution && this._map.getView().getResolution() > layer.maxResolution) {
      return false
    }
    return true
  }

  changeBaseLayer (id) {
    const layers = this.state.baseLayers.getArray().filter(l => l.get('id') === id)
    if (layers.length === 1) {
      this.state.baseLayers.forEach(layer => {
        layer.setVisible(false)
      })
      layers[0].setVisible(true)
      this.state.activeBaseLayer = layers[0]
      setState('map/baseLayer', id, true)
      // this.state.open = true
      this.render()
      return true
    }
    return false
  }

  toggleLayer (groupId, id) {
    this.state[groupId].forEach(layer => {
      if (layer.get('id') === id) {
        layer.setVisible(!layer.getVisible())
      }
    })
    this.state.open = true
    this.render()
  }

  removeLayer (groupId, id) {
    this.state[groupId].forEach(layer => {
      if (layer && layer.get('id') === id) {
        this.state.open = true
        this.state[groupId].remove(layer)
      }
    })
  }

  reorderLayers (e) {
    if (e.oldIndex !== e.newIndex) {
      const layerId = $(e.item).data('id')
      const groupId = $(e.item).data('group')
      this.state[groupId].forEach(layer => {
        if (layer.get('id') === layerId) {
          this.state[groupId].remove(layer)
          this.state[groupId].insertAt(e.newIndex, layer)
        }
      })
    }
  }

  fitTo (groupId, id) {
    for (let layer of this.state[groupId].getArray()) {
      if (layer && layer.get('id') === id) {
        this.state.open = true
        const bbox = layer.getSource().getExtent
          ? layer.getSource().getExtent() : layer.getExtent()
        if (bbox) {
          getState('map').getView().fit(bbox, {
            padding: [50, 50, 50, 50],
            maxZoom: 17,
            duration: 500
          })
        } else {
          log('error', `${t('Unable to find layer extent')}`)
          if (getState('app/debug')) {
            console.error(`LayerManager.fitTo: no bbox ${groupId}, ${id}`)
          }
        }
        break
      }
    }
  }

  renderComponents (target) {
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
