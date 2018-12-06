import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import GeocacheLoader from './GeocacheLoader'
import Filter from './Filter'
import Geotrip from './Geotrip'
import './Geocache.styl'
import $ from 'jquery'

class Geocache extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <div id="geocache" class="btn-group">
        <button
          class="btn btn-secondary"
          title="${t('Caches')}">
          <i class="fa fa-cube"></i>
          <span class="d-none d-sm-inline-block">${t('Caches')}</span>
        </button>
      </div>
    `)
    this.state = {
      layers: []
    }
    this.create()
    this.sidebar = new Sidebar({
      trigger: this.el.find('button'),
      position: 'left',
      components: {
        GeocacheLoader,
        Filter,
        Geotrip
      },
      activeComponent: 'tab-loader',
      shadow: false
    })
    this.layersPick()
  }
  layersPick () {
    const layers = getState('map/layer/layers')
    layers.forEach(layer => {
      if(this.checkLayer(layer)) {
        layer.setStyle = this.styleGeocache
        this.state.layers.push(layer)
      }
    })
    layers.on('add', layer => {
      if(this.checkLayer(layer)) {
        layer.setStyle = this.styleGeocache
        this.state.layers.push(layer)
      }
    })
    layers.on('remove', layer => {
      if(this.checkLayer(layer)) {
        this.state.layers = this.state.layers.filter(item => item !== layer)
      }
    })
  }
  checkLayer (layer) {
    const features = layer.getSource().getFeatures ? layer.getSource().getFeatures() : false
    if (features && features[0]) {
      return (features[0].get('type') && features[0].get('fstatus'))
    }
    return false
  }
  styleGeocache (feature, resolution) {
    var type = feature.get('type'),
        fstatus = feature.get('fstatus'),
        new_cache = feature.get('new_cache'),
        hash = type + fstatus + new_cache,
        definition;
    if (!_this._styleCache[hash]) {
        definition = $.extend(
            {},
            _this._styleConfig.base,
            _this._styleConfig.text[type],
            _this._styleConfig.color[fstatus],
            _this._styleConfig.new_cache[new_cache] || {}
        );
        _this._styleCache[hash] = new ol.style.Style({
            text: new ol.style.Text(definition)
        });
    }
    if (_this._layer.get('radiusStyle').visible && resolution <= _this._layer.get('radiusStyle').maxResolution) {
      return [
        _this._styleCache[hash],
        _this._styleConfig.radiusStyle
      ];
    }
    return [_this._styleCache[hash]];
  }
}

export default Geocache
