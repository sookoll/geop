import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { uid, scaleFactor, formatDate, hexToRgbA, deepCopy } from 'Utilities/util'
import { getState, setState, onchange } from 'Utilities/store'
import { toLonLat } from 'ol/proj'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import GeocacheLoader from './GeocacheLoader'
import Filter from './Filter'
import Geotrip from './Geotrip'
import { createStyle } from 'Components/layer/StyleBuilder'
import Circle from 'ol/geom/Circle'
import Collection from 'ol/Collection'
import geopeitusJSON from './GeopeitusJSON'
import geocacheGPX from './GeocacheGPX'
// import geocacheGPX from './GeocacheGPX'
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
          <span>${t('Caches')}</span>
        </button>
      </div>
    `)
    this.state = {
      layers: new Collection(),
      styleCache: {},
      styleConfig: cacheConf.styles,
      currentUser: getState('app/account')
    }
    const listenLayers = e => {
      let featureCount = 0
      this.state.layers.forEach(layer => {
        featureCount += layer.getSource().getFeatures().filter(f => {
          return (f.get('isCache') && !f.get('hidden'))
        }).length
      })
      this.el.find('button > span').html(featureCount || t('Caches'))
      this.sidebar.getComponent('Filter').get('tab').find('span').html(featureCount || t('Filter'))
    }
    this.state.layers.on('add', listenLayers)
    this.state.layers.on('remove', listenLayers)
    onchange('geocache/filter', listenLayers)
    // radiusStyle geometry function
    this.state.styleConfig.radiusStyle.geometry = feature => {
      const coordinates = feature.getGeometry().getCoordinates()
      const lonlat = toLonLat(coordinates)
      const scaleF = scaleFactor(lonlat)
      return new Circle(coordinates, (cacheConf.radiusStyle.radius * scaleF))
    }
    this.create()
    this.sidebar = new Sidebar({
      target: $('#geop'),
      trigger: this.el.find('button'),
      position: 'left',
      components: {
        GeocacheLoader,
        Filter,
        Geotrip
      },
      activeComponent: 'tab-loader',
      shadow: false,
      props: {
        collection: this.state.layers
      }
    })
    this.layersPick()
  }
  layersPick () {
    const layers = getState('map/layer/layers')
    layers.forEach(layer => {
      if (this.checkLayer(layer)) {
        this.registerLayer(layer)
      }
    })
    layers.on('add', e => {
      if (this.checkLayer(e.element)) {
        this.registerLayer(e.element)
      }
    })
    layers.on('remove', e => {
      this.state.layers.remove(e.element)
    })
  }
  checkLayer (layer) {
    const features = layer.getSource().getFeatures
      ? layer.getSource().getFeatures() : null
    if (features) {
      const isGeopeitusJSON = geopeitusJSON.test(features)
      const isCacheGPX = geocacheGPX.test(features)
      if (isCacheGPX) {
        layer.set('_cacheFormatParser', geocacheGPX)
      } else if (isGeopeitusJSON) {
        layer.set('_cacheFormatParser', geopeitusJSON)
      }
      return (isGeopeitusJSON || isCacheGPX)
    }
    return false
  }
  registerLayer (layer) {
    const stat = {
      'Not Found': 'far fa-square',
      'Found': 'far fa-check-square',
      'Owner': 'fas fa-user'
    }
    layer.get('_cacheFormatParser').formatFeatures({
      features: layer.getSource().getFeatures(),
      newCacheDays: cacheConf.newCacheDays,
      mapping: cacheConf.mapping,
      user: this.state.currentUser,
      uid: uid,
      url: cacheConf.cacheUrl,
      date: formatDate
    })
    layer.setStyle((feature, resolution) => this.styleGeocache(feature, resolution))
    layer.set('_featureInfo', {
      title: f => {
        const geotrip = getState('geocache/trip')
        const inTrip = geotrip && geotrip.getArray().indexOf(f) > -1
        const styleType = this.state.styleConfig.text[f.get('type')]
        if (f.get('isCache')) {
          return `
            <i class="${styleType ? styleType.class : this.state.styleConfig.base.class} ${f.get('status') !== 'Available' ? 'unavailable' : ''}"></i>
            <a href="${f.get('url')}" target="_blank" class="${f.get('status') === 'Archived' ? 'archived' : ''}">${t(f.get('name'))}</a>
            <div class="tools">
              <a href="#" class="cache-toggle" data-id="${f.getId()}" title="${t('Add to geotrip')}">
                <i class="fas ${inTrip ? 'fa-minus-square' : 'fa-thumbtack'}"></i>
              </a>
            </div>`
        } else {
          return `
            <i class="${styleType ? styleType.class : this.state.styleConfig.base.class}"></i>
            <a href="${f.get('url')}" target="_blank">${t(f.get('name'))}</a>
            <div class="tools">
              <a href="#" class="cache-toggle" data-id="${f.getId()}" title="${t('Add to geotrip')}">
                <i class="fas ${inTrip ? 'fa-minus-square' : 'fa-thumbtack'}"></i>
              </a>
            </div>`
        }
      },
      content: f => {
        const styleType = this.state.styleConfig.text[f.get('type')]
        if (f.get('isCache')) {
          return `
            <p class="text-muted metadata">
              <i class="fas fa-clock"></i> ${formatDate(f.get('time'))}<br/>
              <i class="fa fa-user"></i> ${f.get('owner')}<br/>
              <i class="${styleType ? styleType.class : this.state.styleConfig.base.class}"></i>
              ${t(f.get('type'))}<br/>
              <i class="fa fa-chart-area"></i> ${f.get('terrain')}
              <i class="fa fa-star ml-2"></i> ${f.get('difficulty')}
              <i class="fa fa-expand-arrows-alt ml-2"></i> ${t(f.get('container'))}<br/>
              ${f.get('cmt') ? `<i class="fa fa-hand-point-right"></i> ${f.get('cmt')}` : ''}
            </p>
            <p class="toggle-found">
              <i class="${stat[f.get('fstatus')]}"></i> <span>${t(f.get('fstatus'))}</span>
            </p>`
        } else {
          return `
            <p>
              ${f.get('desc')}
            </p>`
        }
      },
      onShow: (f, pop) => {
        const geotrip = getState('geocache/trip')
        $(pop).on('click', '.toggle-found', e => {
          const inTrip = geotrip && geotrip.getArray().indexOf(f[1]) > -1
          const found = f[1].get('fstatus') === 'Found'
          $(e.currentTarget).find('i').removeClass(stat[f[1].get('fstatus')])
          f[1].set('fstatus', found ? 'Not Found' : 'Found')
          f[1].set('fstatus_timestamp', !found ? Date.now() : null)
          $(e.currentTarget).find('span').html(t(f[1].get('fstatus')))
          $(e.currentTarget).find('i').addClass(stat[f[1].get('fstatus')])
          if (!inTrip && !found) {
            geotrip.push(f[1])
          }
          if (inTrip) {
            const idx = geotrip.getArray().indexOf(f[1])
            geotrip.remove(f[1])
            geotrip.insertAt(idx, f[1])
          }
          $(pop).popover('dispose')
        })
      }
    })
    this.state.layers.push(layer)
    // run for onchange events
    setState('geocache/loadend', this.state.layers.getLength())
    if (getState('app/debug')) {
      console.debug('Geocache.registerLayer: ' + layer.get('id') + ', ' + layer.get('title'))
    }
  }
  styleGeocache (feature, resolution) {
    const type = feature.get('type')
    const fstatus = feature.get('fstatus')
    const newCache = feature.get('newCache')
    const status = feature.get('status')
    const overviewStyle = resolution > cacheConf.overviewMinResolution
    const hash = type + fstatus + newCache + status + overviewStyle
    if (!feature.get('_inGeotrip') && !feature.get('isCache') && resolution > cacheConf.waypointMaxResolution) {
      return null
    }
    if (!feature.get('_inGeotrip') && feature.get('hidden')) {
      return null
    }
    if (!this.state.styleCache[hash]) {
      const definition = !overviewStyle
        ? Object.assign(
          {},
          this.state.styleConfig.base,
          this.state.styleConfig.text[type],
          this.state.styleConfig.color[fstatus],
          this.state.styleConfig.newCache[newCache] || {}
        )
        : Object.assign(
          {},
          this.state.styleConfig.base,
          this.state.styleConfig.overview,
          this.state.styleConfig.color[fstatus],
          this.state.styleConfig.newCache[newCache] || {}
        )
      // deep copy for remove references
      const def = deepCopy(definition)
      if (status !== 'Available') {
        if (def.fill) {
          def.fill.color = hexToRgbA(def.fill.color, 0.5)
        }
        if (def.stroke) {
          def.stroke.color = hexToRgbA(def.stroke.color, 0.7)
        }
      }
      this.state.styleCache[hash] = createStyle({
        text: def,
        zIndex: feature.get('isCache') ? 2 : 1
      }, true)
    }
    if (feature.get('isCache') && feature.get('radiusVisible') && resolution <= cacheConf.radiusStyle.maxResolution) {
      if (!this.state.styleCache.radiusStyle) {
        this.state.styleCache.radiusStyle = createStyle(
          this.state.styleConfig.radiusStyle,
          true
        )
      }
      return [
        this.state.styleCache[hash],
        this.state.styleCache.radiusStyle
      ]
    }
    return [this.state.styleCache[hash]]
  }
}

export default Geocache
