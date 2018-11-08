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
    this.state = {
      activeBaseLayer: getState('map/layer/active'),
      baseLayers: getState('map/layer/base'),
      overlays: getState('map/layer/overlays'),
      plugins: [
        OSMEdit,
        WMSLayer,
        FileLayer
      ],
      open: false
    }
    this.state.overlays.on('add', () => this.render())
    this.state.overlays.on('remove', () => this.render())
    this.render()
  }

  render () {
    const html = $(`
      <div class="btn-group float-right" id="layermanager">
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
          ${this.state.overlays.getLength() > 0 ?
            `<li class="dropdown-divider"></li>` +
            this.state.overlays.getArray().map(layer => {
              return `
                <li>
                  <a href="#" class="overlays dropdown-item ${this.layerVisible(layer) ? '' : 'disabled'}"
                    data-id="${layer.get('id')}">
                    <i class="far ${layer.getVisible() ? 'fa-check-square' : 'fa-square'}"></i>
                    ${t(layer.get('title'))}
                  </a>
                  <a href="#" class="remove-layer" data-id="${layer.get('id')}">
                    <i class="fa fa-times"></i>
                  </a>
                </li>`
              }).join('') : ''}
        </ul>
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
      e.stopPropagation()
      const id = $(e.currentTarget).data('id')
      if (id === this.state.activeBaseLayer.get('id')) {
        this.toggleLayer(this.state.baseLayers, id)
      } else {
        this.changeBaseLayer(id)
      }
    })
    this.el.on('click', 'a.overlays', e => {
      e.preventDefault()
      e.stopPropagation()
      this.toggleLayer(this.state.overlays, $(e.currentTarget).data('id'))
    })
    this.el.on('click', 'a.remove-layer', e => {
      e.preventDefault()
      e.stopPropagation()
      this.removeLayer($(e.currentTarget).data('id'))
    })
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
    setState('map/layer/active', this.state.activeBaseLayer)
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
    this.state.overlays.forEach(layer => {
      if (layer.get('id') === id) {
        this.state.open = true
        this.state.overlays.remove(layer)
        return
      }
    })
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
