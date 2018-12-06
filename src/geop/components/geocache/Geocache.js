import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { uid, scaleFactor } from 'Utilities/util'
import { getState } from 'Utilities/store'
import { toLonLat } from 'ol/proj'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import GeocacheLoader from './GeocacheLoader'
import Filter from './Filter'
import Geotrip from './Geotrip'
import { createStyle } from 'Components/layer/StyleBuilder'
import Circle from 'ol/geom/Circle'
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
      layers: [],
      styleCache: {},
      styleConfig: cacheConf.styles,
      radiusStyle: cacheConf.radiusStyle
    }
    // radiusStyle geometry function
    this.state.styleConfig.radiusStyle.geometry = feature => {
      const coordinates = feature.getGeometry().getCoordinates()
      const lonlat = toLonLat(coordinates)
      const scaleF = scaleFactor(lonlat)
      return new Circle(coordinates, (cacheConf.radiusStyle.radius * scaleF))
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
        this.registerLayer(layer)
      }
    })
    layers.on('add', e => {
      if(this.checkLayer(e.element)) {
        this.registerLayer(e.element)
      }
    })
    layers.on('remove', e => {
      if(this.checkLayer(e.element)) {
        this.state.layers = this.state.layers.filter(item => item !== e.element)
      }
    })
  }
  checkLayer (layer) {
    const features = layer.getSource().getFeatures ?
      layer.getSource().getFeatures() : false
    if (features && features[0]) {
      return (features[0].get('fstatus') &&
        Object.keys(this.state.styleConfig.text)
          .indexOf(features[0].get('type')) > -1
      )
    }
    return false
  }
  registerLayer (layer) {
    const today = new Date()
    layer.getSource().forEachFeature(feature => {
      // set new_cache prop
      const fstatus = feature.get('fstatus')
      const date = new Date(feature.get('date_hidden'))
      const testDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + cacheConf.newCacheDays
      )
      const newCache = (fstatus === '0' && testDate > today) ? 'yes' : 'no'
      if (!feature.get('newCache')) {
        feature.set('newCache', newCache)
      }
      if (!feature.getId()) {
        feature.setId(uid())
      }
    })
    layer.setStyle((feature, resolution) => this.styleGeocache(feature, resolution))
    this.state.layers.push(layer)
  }
  styleGeocache (feature, resolution) {
    const type = feature.get('type')
    const fstatus = feature.get('fstatus')
    const newCache = feature.get('newCache')
    const hash = type + fstatus + newCache
    if (!this.state.styleCache[hash]) {
      const definition = Object.assign(
        {},
        this.state.styleConfig.base,
        this.state.styleConfig.text[type],
        this.state.styleConfig.color[fstatus],
        this.state.styleConfig.newCache[newCache] || {}
      );
      this.state.styleCache[hash] = createStyle({
          text: definition
      }, true)
    }
    if (this.state.radiusStyle.visible && resolution <= this.state.radiusStyle.maxResolution) {
      if (!this.state.styleCache.radiusStyle) {
        this.state.styleCache.radiusStyle = createStyle(
          this.state.styleConfig.radiusStyle
        )
      }
      return [
        this.state.styleCache[hash],
        this.state.styleCache.radiusStyle
      ]
    }
    console.log(this.state.styleCache)
    return [this.state.styleCache[hash]]
  }
}

export default Geocache
