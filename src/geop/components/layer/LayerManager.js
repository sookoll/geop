import $ from 'jquery'
import 'bootstrap/js/dist/dropdown'
import {getState, setState} from 'Utilities/store'
import {layers as layerConf} from 'Conf/layers'
import Component from 'Geop/Component'
import './LayerManager.styl'

class LayerManager extends Component {
  constructor (target) {
    super(target)
    this.state = {
      activeBaseLayer: getState('map/activeBaseLayer'),
      baseLayers: getState('map/baseLayers')
    }
    this.render()
  }

  render () {
    if (this.el) {
      this.el.remove()
    }
    const html = $(`
      <div class="btn-group float-right" id="layermanager">
        <button type="button"
          class="btn btn-secondary"
          data-toggle="dropdown"
          aria-expanded="false">
          <span class="display-name hidden-xs">${this.getLayerConf('baseLayers', this.state.activeBaseLayer).title}</span>
          <i class="fa fa-globe"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-right">
          ${this.state.baseLayers.getArray().map(layer => {
            const conf = this.getLayerConf('baseLayers', layer.get('id'))
            return `
              <a href="#" class="baselayer dropdown-item ${this.layerVisible(layer) ? '' : 'disabled'}"
                data-name="${layer.get('id')}"
                data-crs="${conf.projection}">
                ${conf.title}
              </a>`
          }).join('')}
          <div class="dropdown-divider"></div>
          <a class="dropdown-item disabled" href="#">No overlays added</a>
        </div>
      </div>`)
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
    setState('map/activeBaseLayer', name)
    this.render()
    //this.updatePermalink();
  }

}

export default LayerManager
