import dropdown from 'bootstrap/js/dist/dropdown'
import {getState} from 'Utilities/store'
import {layers as layerConf} from 'Conf/settings'
import Component from 'Geop/Component'
import './LayerManager.styl'

class LayerManager extends Component {
  constructor () {
    super()
    this.state = {
      activeBaseLayer: getState('map/activeBaseLayer'),
      baseLayers: getState('map/baseLayers')
    }
    console.log(dropdown)
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

  getLayerConf (type, id) {
    return layerConf[type][id]
  }

  render () {
    return `
      <div class="btn-group float-right layermanager">
        <button type="button"
          class="btn btn-secondary btn-sm"
          data-toggle="dropdown"
          id="dLabel"
          aria-expanded="false">
          <span class="display-name hidden-xs">${this.getLayerConf('baseLayers', this.state.activeBaseLayer).title}</span>
          <i class="fa fa-globe"></i>
        </button>
        <ul class="dropdown-menu" aria-labelledby="dLabel">
          ${this.state.baseLayers.getArray().map(layer => {
            const conf = this.getLayerConf('baseLayers', layer.get('id'))
            return `
              <li class="${this.layerVisible(layer) ? '' : 'disabled'}">
                <a href="#" class="baselayer"
                  data-name="${layer.get('id')}"
                  data-crs="${conf.projection}">${conf.title}</a>
              </li>`
          }).join('')}
        </ul>
      </div>`
  }

}

export default LayerManager
