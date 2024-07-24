import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { uid, scaleFactor, formatDate, hexToRgbA, deepCopy } from 'Utilities/util'
import { getState, setState, onchange } from 'Utilities/store'
import log from 'Utilities/log'
import { toLonLat } from 'ol/proj'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/SideBar'
import GeocacheLoader from './GeocacheLoader'
import GeocacheInfo from './GeocacheInfo'
import Filter from './Filter'
import Geotrip from './Geotrip'
import { createStyle } from 'Components/layer/StyleBuilder'
import { createLayer } from 'Components/layer/LayerCreator'
import Circle from 'ol/geom/Circle'
import geopeitusJSON from './GeopeitusJSON'
import projectGCJSON from './ProjectGCJSON'
import geocacheGPX from './GeocacheGPX'
import './Geocache.styl'
import $ from 'jquery'

const cacheFormatParsers = [
  geopeitusJSON,
  projectGCJSON,
  geocacheGPX
]

const state = {
  layer: null,
  layerOnMap: false,
  styleCache: {},
  styleConfig: cacheConf.styles,
  cacheFormatParser: null,
  stat: {
    'Not Found': 'far fa-square',
    'Found': 'far fa-check-square',
    'Owner': 'fas fa-user'
  },
  featureCount: 0
}

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
    // radiusStyle geometry function
    state.styleConfig.radiusStyle.geometry = feature => {
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
        GeocacheInfo,
        Filter,
        Geotrip
      },
      activeComponent: 'tab-loader',
      shadow: false
    })
    const listenLayer = e => {
      let featureCount = getCacheCount()
      this.el.find('button > span').html(featureCount || t('Caches'))
      this.sidebar.getComponent('Filter').get('tab').find('span').html(featureCount || t('Filter'))
    }
    const layers = getState('map/layer/layers')
    // initial cache layer
    layers.forEach(layer => {
      if (
        layer &&
        typeof layer.getSource().getFeatures === 'function' &&
        checkCaches(layer.getSource().getFeatures())
      ) {
        state.layer = this.createLayer(layer)
        state.layerOnMap = true
        importCaches(layer.getSource().getFeatures(), true)
      }
    })
    // remove layer
    layers.on('remove', e => {
      if (e.element.get('id') === state.layer.get('id') && getState('ui/layermanager/sorting') !== true) {
        state.layer.getSource().clear()
        // run for onchange events
        setState('geocache/loadend', state.layer)
        listenLayer()
        state.layerOnMap = false
      }
    })
    if (!state.layer) {
      state.layer = this.createLayer()
    }
    let count = 0
    state.layer.getSource().on('addfeature', e => {
      count++
      if (count >= state.featureCount) {
        listenLayer()
        state.featureCount = 0
        count = 0
      }
    })
    state.layer.getSource().on('clear', listenLayer)
    onchange('geocache/filter', () => {
      listenLayer()
      setState('layerchange', ['layers', state.layer.get('id')])
    })
    listenLayer()
  }
  createLayer (layer = null) {
    if (!layer) {
      layer = createLayer({
        type: 'FeatureCollection',
        id: uid(),
        title: t('Caches'),
        visible: true
      })
    }
    layer.set('_featureInfo', {
      title: f => {
        const geotrip = getState('geocache/trip')
        const inTrip = geotrip && geotrip.getArray().indexOf(f) > -1
        const styleType = state.styleConfig.text[f.get('type')]
        if (f.get('isCache')) {
          // FIXME: all other attributes but class are removed on popup. Why and where?
          return `
            <i
              class="fstatus ${styleType ? styleType.class : state.styleConfig.base.class} ${f.get('status') !== 'Available' ? 'unavailable' : ''}"
              style="color:${state.styleConfig.color[f.get('fstatus')].fill.color}"></i>
            <a href="${f.get('url')}" target="_blank" class="${f.get('status') === 'Archived' ? 'archived' : ''}">${t(f.get('name'))}</a>
            <div class="tools">
              <a href="#" class="cache-toggle" data-id="${f.getId()}" title="${t('Add to geotrip')}">
                <i class="fas ${inTrip ? 'fa-minus-square' : 'fa-thumbtack'}"></i>
              </a>
            </div>`
        } else {
          return `
            <i class="${styleType ? styleType.class : state.styleConfig.base.class}"></i>
            <a href="${f.get('url')}" target="_blank">${t(f.get('name'))}</a>
            <div class="tools">
              <a href="#" class="cache-toggle" data-id="${f.getId()}" title="${t('Add to geotrip')}">
                <i class="fas ${inTrip ? 'fa-minus-square' : 'fa-thumbtack'}"></i>
              </a>
            </div>`
        }
      },
      content: f => {
        const styleType = state.styleConfig.text[f.get('type')]
        if (f.get('isCache')) {
          return `
            <p class="text-muted metadata">
              <i class="fas fa-clock"></i> ${f.get('time') ? formatDate(f.get('time')) : ''}<br/>
              <i class="fa fa-user"></i> ${f.get('owner')}<br/>
              <i class="${styleType ? styleType.class : state.styleConfig.base.class}"></i>
              ${t(f.get('type'))}<br/>
              <i class="fa fa-chart-area"></i> ${f.get('terrain')}
              <i class="fa fa-star ml-2"></i> ${f.get('difficulty')}
              <i class="fa fa-expand-arrows-alt ml-2"></i> ${t(f.get('container'))}<br/>
              ${f.get('cmt') ? `<i class="fa fa-hand-point-right"></i> ${f.get('cmt')}` : ''}
            </p>
            <p class="toggle-found">
              <i class="${state.stat[f.get('fstatus')]}"></i> <span>${t(f.get('fstatus'))}</span>
            </p>`
        } else {
          return `
            <p>
              ${f.get('desc')}
            </p>`
        }
      },
      onShow: (f, pop) => {
        const fstatus = f[1].get('fstatus')
        // FIXME: Workaround for removed style attribute in popup
        if (fstatus) {
          $(pop).find('h3 i.fstatus').css('color', state.styleConfig.color[fstatus].fill.color)
        }
        const geotrip = getState('geocache/trip')
        $(pop).on('click', '.toggle-found', e => {
          const inTrip = geotrip && geotrip.getArray().indexOf(f[1]) > -1
          const found = fstatus === 'Found'
          $(e.currentTarget).find('i').removeClass(state.stat[f[1].get('fstatus')])
          f[1].set('fstatus', found ? 'Not Found' : 'Found')
          f[1].set('fstatus_timestamp', !found ? Date.now() : null)
          $(e.currentTarget).find('span').html(t(f[1].get('fstatus')))
          $(e.currentTarget).find('i').addClass(state.stat[f[1].get('fstatus')])
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
    layer.setStyle(styleGeocache)
    return layer
  }
}

function getCacheCount () {
  return state.layer.getSource().getFeatures().filter(f => {
    return (f.get('isCache') && !f.get('hidden'))
  }).length
}

function styleGeocache (feature, resolution) {
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
  if (!state.styleCache[hash]) {
    const definition = !overviewStyle
      ? Object.assign(
        {},
        state.styleConfig.base,
        state.styleConfig.text[type],
        state.styleConfig.color[fstatus],
        state.styleConfig.newCache[newCache] || {}
      )
      : Object.assign(
        {},
        state.styleConfig.base,
        state.styleConfig.overview,
        state.styleConfig.color[fstatus],
        state.styleConfig.newCache[newCache] || {}
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
    state.styleCache[hash] = createStyle({
      text: def,
      zIndex: feature.get('isCache') ? 2 : 1
    }, true)
  }
  if (
    feature.get('isCache') && feature.get('radiusVisible') &&
    type !== 'Geocache|Locationless Cache' &&
    type !== 'Geocache|Virtual Cache' &&
    type !== 'Geocache|Webcam Cache' &&
    type !== 'Geocache|Event Cache' &&
    type !== 'Geocache|Earthcache' &&
    status !== 'Archived' &&
    resolution <= cacheConf.radiusStyle.maxResolution
  ) {
    if (!state.styleCache.radiusStyle) {
      state.styleCache.radiusStyle = createStyle(
        state.styleConfig.radiusStyle,
        true
      )
    }
    return [
      state.styleCache[hash],
      state.styleCache.radiusStyle
    ]
  }
  return [state.styleCache[hash]]
}

export function checkCaches (features) {
  if (features) {
    for (let i = 0, len = cacheFormatParsers.length; i < len; i++) {
      if (cacheFormatParsers[i].test(features)) {
        state.cacheFormatParser = cacheFormatParsers[i]
        return true
      }
    }
  }
  return false
}

export function importCaches (features, disableLog = false) {
  if (!features || features.length === 0 || !state.cacheFormatParser) {
    log('error', t('No caches to add!'))
    return false
  }
  if (!state.layerOnMap) {
    getState('map/layer/layers').push(state.layer)
    state.layerOnMap = true
  }
  if (!getState('cache/import/appendLayer')) {
    state.layer.getSource().clear()
  }
  state.cacheFormatParser.formatFeatures({
    features: features,
    newCacheDays: cacheConf.newCacheDays,
    mapping: cacheConf.mapping,
    user: getState('app/account'),
    uid: uid,
    url: cacheConf.cacheUrl,
    date: formatDate
  })
  state.featureCount = features.length
  state.layer.getSource().addFeatures(features)
  // run for onchange events
  setState('geocache/loadend', state.layer)
  setState('layerchange', ['layers', state.layer.get('id')])
  if (!disableLog) {
    log('success', `${t('Imported')} ${getCacheCount()} ${t('caches')}`)
  }
  if (getState('app/debug')) {
    console.debug('Geocache.createCacheLayer: ' + features.length)
  }
}

export default Geocache
