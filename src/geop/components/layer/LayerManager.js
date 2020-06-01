import FileLayer, { getFileLayerStyleConf } from './FileLayer'
import { createStyle } from './StyleBuilder'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import {
  set as setPermalink,
  onchange as onPermalinkChange,
  viewConfToPermalink
} from 'Utilities/permalink'
import { parseURL, constructURL } from 'Utilities/util'
import Component from 'Geop/Component'
import OSMEdit from 'Components/osmedit/OSMEdit'
import LayerFromService from './LayerFromService'
import UrlLayer from './UrlLayer'
import Sortable from 'sortablejs'
import Dropdown from 'bootstrap.native/src/components/dropdown-native'
import './LayerManager.styl'

class LayerManager extends Component {
  create () {
    this.el = this.$.create('<div class="btn-group float-right" id="layermanager"></div>')
    this.state = {
      activeBaseLayer: null,
      base: getState('map/layer/base'),
      layers: getState('map/layer/layers'),
      overlays: getState('map/layer/overlays'),
      open: false
    }
    this.handlers = {
      onbaselayerschange: (e) => {
        if (!this.changeBaseLayer(e.element.get('id'))) {
          this.state.open = true
          this.render()
        }
      },
      onchange: () => {
        if (!getState('ui/layermanager/sorting')) {
          this.render()
        }
      }
    }
    this.state.base.forEach(layer => {
      if (layer.get('id') === getState('map/baseLayer')) {
        this.state.activeBaseLayer = layer
      }
    })
    this.state.base.on('add', this.handlers.onbaselayerschange)
    this.state.base.on('remove', this.handlers.onbaselayerschange)
    this.state.layers.on('add', this.handlers.onchange)
    this.state.layers.on('remove', this.handlers.onchange)
    this.state.overlays.on('add', this.handlers.onchange)
    this.state.overlays.on('remove', this.handlers.onchange)

    this.componentsConfiguration = {
      osm: OSMEdit,
      wms: LayerFromService,
      file: FileLayer
    }
    this.modal = null
    this.dropdown = null
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

  render () {
    this.$.html(this.el, `
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
        ${this.state.base.getLength() > 0
    ? this.state.base.getArray().map(layer => {
      let btn = ''
      if (layer.get('conf').type === 'FeatureCollection') {
        btn = `<a href="#" class="fit-layer">
            <i class="fa fa-search-plus"></i>
          </a>`
      } else if (layer.get('conf').editable) {
        btn = `<a href="#" class="edit-layer" data-toggle="modal" data-target="#modal_wmslayer">
            <i class="fa fa-edit"></i>
          </a>
          <a href="#" class="remove-layer">
            <i class="fa fa-times"></i>
          </a>`
      }
      return `
        <li
          class="dropdown-item baselayer ${this.layerVisible(layer) ? '' : 'disabled'}"
          data-group="base" data-id="${layer.get('id')}">
          <label>
            <i class="check far ${layer.getVisible() ? 'fa-dot-circle' : 'fa-circle'}"></i>
            <span class="layer-title">${t(layer.get('title'))}</span>
          </label>
          ${btn.length ? `<div class="layer-tools">
            ${btn}
          </div>` : ''}
        </li>`
    }).join('')
    : `<li class="dropdown-item disabled">${t('No baselyers added')}</li>`}
        ${this.renderLayerGroup('overlays', this.state.overlays)}
        ${this.renderLayerGroup('layers', this.state.layers, true)}
      </ul>`)
    const ul = this.$.get('.dropdown-menu', this.el)
    this.renderComponents(ul)
    if (this.state.open) {
      // FIXME
      this.dropdown.toggle()
      this.state.open = false
    }
    this.$.get('.baselayer label', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        const id = e.currentTarget.closest('li').dataset.id
        if (this.state.activeBaseLayer && id === this.state.activeBaseLayer.get('id')) {
          this.toggleLayer('base', id)
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
    })
    this.$.get('.layer label', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        const data = e.currentTarget.closest('li').dataset
        this.toggleLayer(data.group, data.id)
      })
    })
    this.$.get('.tools a', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
      })
    })
    this.$.get('a.fit-layer', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        const data = e.currentTarget.closest('li').dataset
        this.fitTo(data.group, data.id)
      })
    })
    this.$.get('a.remove-layer', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        const data = e.currentTarget.closest('li').dataset
        this.removeLayer(data.group, data.id)
      })
    })
    this.$.get('input[type=color]', ul, true).forEach(el => {
      this.$.on('change', el, e => {
        const data = e.currentTarget.closest('li').dataset
        this.setLayerColor(data.group, data.id)
        this.$.get('.dot', e.currentTarget.closest('.color')).css({ background: e.target.value })
      })
    })
    this.$.get('.colorpicker', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        this.$.trigger('click', this.$.get('input[type=color]', e.currentTarget.closest('.color')))
      })
    })
    this.$.get('a.edit-layer', ul, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        const data = e.currentTarget.closest('li').dataset
        const url = this.getWMSUrl(data.group, data.id)
        const target = this.$.get(e.currentTarget.dataset.target)
        if (url) {
          // FIXME
          // $($(e.currentTarget).data('target')).modal()

          this.$.get('textarea', target).value = url
          this.$.get('input[name=id]', target).value = data.id
          this.$.get(`input[type=radio][value=${data.group}]`, target).checked = true
          this.components.wms.openModal()
        }
      })
    })
    // sortable
    Sortable.create(ul, {
      draggable: 'li.sort-item',
      handle: '.sort-handle',
      onUpdate: e => {
        this.reorderLayers(e)
      }
    })
    this.dropdown = new Dropdown(this.$.get('.dropdown-toggle', this.el))
  }

  createComponents () {
    const target = this.$.get('.dropdown-menu', this.el)
    const comps = this.componentsConfiguration
    Object.keys(comps).forEach((key) => {
      this.components[key] = new comps[key]({ target })
    })
  }

  renderComponents () {
    let dividerAdded = false
    const target = this.$.get('.dropdown-menu', this.el)
    Object.keys(this.components).forEach((i) => {
      if (this.components[i].isRow && !dividerAdded) {
        this.$.append(target, '<div class="dropdown-divider"></div>')
        dividerAdded = true
      }
      this.components[i].create()
    })
  }

  renderLayerGroup (groupId, group, sortable = false) {
    return group.getLength() > 0
      ? '<li class="dropdown-divider"></li>' +
      group.getArray().map(layer => {
        const colorpicker = layer.get('conf').color && !layer.get('_cacheFormatParser')
          ? `<span class="color">
              <span class="colorpicker">
                <i class="dot" style="background:${layer.get('conf').color}"></i>
              </span>
              <input type="color" class="" value="${layer.get('conf').color}"/>
            </span>` : ''
        let btn = ''
        if (layer.get('conf').type === 'FeatureCollection') {
          btn = `<a href="#" class="fit-layer">
              <i class="fa fa-search-plus"></i>
            </a>`
        } else if (layer.get('conf').editable) {
          btn = `<a href="#" class="edit-layer" data-toggle="modal" data-target="#modal_wmslayer">
              <i class="fa fa-edit"></i>
            </a>`
        }
        const sortHandle = sortable
          ? `<a href="#" class="sort-handle">
              <i class="dot"></i>
            </a>` : ''
        return `
          <li
            class="dropdown-item ${sortable ? 'sort-item' : ''} layer ${this.layerVisible(layer) ? '' : 'disabled'}"
            data-group="${groupId}" data-id="${layer.get('id')}">
            ${colorpicker}
            <label>
              <i class="check far ${layer.getVisible() ? 'fa-check-square' : 'fa-square'}"></i>
              <span class="layer-title">${t(layer.get('title'))}</span>
            </label>
            <div class="layer-tools">
              ${sortHandle}
              ${btn}
              <a href="#" class="remove-layer">
                <i class="fa fa-times"></i>
              </a>
            </div>
          </li>`
      }).join('') : ''
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
    const layers = this.state.base.getArray().filter(l => l.get('id') === id)
    if (layers.length === 1) {
      this.state.base.forEach(layer => {
        layer.setVisible(false)
      })
      layers[0].setVisible(true)
      this.state.activeBaseLayer = layers[0]
      setState('map/baseLayer', id, true)
      this.state.open = true
      this.render()
      return true
    }
    return false
  }

  toggleLayer (groupId, id) {
    this.state[groupId].forEach(layer => {
      if (layer.get('id') === id) {
        layer.setVisible(!layer.getVisible())
        setState('layerchange', [groupId, id])
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
    if (e.oldDraggableIndex !== e.newDraggableIndex) {
      const layerId = e.item.dataset.id
      const groupId = e.item.dataset.group
      this.state[groupId].forEach(layer => {
        if (layer.get('id') === layerId) {
          // store reordering state
          setState('ui/layermanager/sorting', true)
          this.state[groupId].remove(layer)
          this.state[groupId].insertAt(e.newDraggableIndex, layer)
          setState('ui/layermanager/sorting', false)
        }
      })
      // this.state.open = true
      // this.render()
    }
  }

  fitTo (groupId, id) {
    for (const layer of this.state[groupId].getArray()) {
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

  setLayerColor (groupId, id, color) {
    this.state[groupId].forEach(layer => {
      if (layer && layer.get('id') === id) {
        const conf = layer.get('conf')
        conf.color = color
        conf.style = getFileLayerStyleConf(color)
        layer.set('conf', conf)
        layer.setStyle(createStyle(conf.style))
        this.storeLayers(groupId)
        return true
      }
    })
  }

  getWMSUrl (groupId, id) {
    for (const layer of this.state[groupId].getArray()) {
      if (layer && layer.get('id') === id) {
        const conf = layer.get('conf')
        const urlComponents = parseURL(conf.url)
        urlComponents.query.srs = conf.projection
        urlComponents.query.title = layer.get('title')
        if (conf.format) {
          urlComponents.query.format = conf.format
        }
        switch (conf.type) {
          case 'TileWMS':
            urlComponents.query.layers = conf.params.LAYERS
            break
          case 'WMTS':
            urlComponents.query.layer = conf.layer
            urlComponents.query.matrixSet = conf.matrixSet
            urlComponents.query.scaleDenominator = conf.scaleDenominator
            urlComponents.query.matrixWidth = conf.matrixWidth
            urlComponents.query.matrixHeight = conf.matrixHeight
            urlComponents.query.topLeftCorner = conf.topLeftCorner.join(',')
            break
        }
        return constructURL(urlComponents)
      }
    }
    return null
  }

  storeLayers (groupId) {
    const layerConfs = this.state[groupId].getArray().map(layer => {
      return layer.get('conf')
    })
    setState('layer/' + groupId, layerConfs, true)
  }
}

export default LayerManager
