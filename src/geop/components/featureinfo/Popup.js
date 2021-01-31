import Component from 'Geop/Component'
import { t } from 'Utilities/translate'
import { formatLength, formatArea, makeLink } from 'Utilities/util'
import { getState, setState } from 'Utilities/store'
import { findRoute } from 'Components/routing/Routing'
import { closestFeatureTo } from 'Components/map/MapEngine'
import { getDistance } from 'ol/sphere'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { toLonLat } from 'ol/proj'
import $ from 'jquery'
import './Popup.styl'

class Popup extends Component {
  constructor (target) {
    super(target)
    this.el = $('<div id="popup-map"></div>')
    this.state = {
      overlay: null,
      infoStore: [],
      geomTypes: {
        points: ['Point'],
        linestrings: ['LineString', 'MultiLineString'],
        polygons: ['Polygon', 'MultiPolygon']
      },
      offset: 0,
      open: false,
      addPoints: []
    }
    this.handlers = {
      clicked: e => {
        if (e.originalEvent.ctrlKey || getState('event/contextmenu')) {
          setState('event/contextmenu', false)
          return
        }
        this.open(e)
      }
    }
    this.format = {
      geojson: new GeoJSONFormat()
    }
    this.create()
    // store component so it can be disabled outside (by measure)
    setState('components/featureInfo', this)
  }
  render () {
    this.state.overlay = new Overlay({
      element: this.el[0],
      positioning: 'center-center',
      offset: [0, -this.state.offset]
    })
    const map = getState('map')
    if (map) {
      this.state.map = map
      this.init(map)
    } else {
      const que = getState('map/que')
      que.push(map => {
        this.state.map = map
        this.init(map)
      })
    }
  }
  init (map) {
    map.addOverlay(this.state.overlay)
    this.enable()
  }
  enable () {
    this.state.map.on('singleclick', this.handlers.clicked)
  }
  disable () {
    this.state.map.un('singleclick', this.handlers.clicked)
  }
  show (e, coords, hit, popContent) {
    this.state.overlay.setPosition(coords)
    this.el.popover(popContent.definition)
    // when popover's content is shown
    this.el.on('shown.bs.popover', evt => {
      this.state.open = true
      const h = popContent.definition.container.find('.popup').height()
      this.state.overlay.setOffset([
        0,
        h + this.state.offset + 20 > e.pixel[1] ? this.state.offset : -this.state.offset
      ])
      popContent.onShow(hit, $(evt.target).data('bs.popover').tip)
    })
    // FIXME: not called! when popover's content is hidden
    this.el.on('hidden.bs.popover', evt => {
      popContent.onHide(evt)
    })
    this.el.popover('show')
    setState('popup/show', { layerId: hit ? hit[0].get('id') : null, feature: hit ? hit[1] : null })
  }
  open (e) {
    let coords = e.coordinate
    // FIXME: multiple results
    const hit = closestFeatureTo(this.state.map, e.pixel, coords)
    if (this.state.open) {
      this.el.popover('dispose')
      this.state.open = false
      if (!hit) {
        return
      }
    }
    let popContent
    if (hit) {
      // if point, then geometry coords
      if (hit[1].getGeometry().getType() === 'Point') {
        coords = hit[1].getGeometry().getCoordinates()
      }
      if (hit[0] && this.state.infoStore[hit[0].get('id')]) {
        popContent = this.state.infoStore[hit[0].get('id')](hit[1])
      } else {
        popContent = this.getContent(hit[1], hit[0])
      }
      if (popContent) {
        this.show(e, coords, hit, popContent)
      }
      // try to find additional points
      if (hit[1].get('isCache')) {
        // hide addPoints and clear
        this.state.addPoints.forEach(point => {
          point.set('hidden', true)
        })
        this.state.addPoints = []
        // try to find cache points
        const eid = hit[1].get('eid')
        this.state.addPoints = hit[0].getSource().getFeatures().filter(feature => {
          if (feature.get('isCachePoint') && feature.get('pid') && feature.get('pid') === eid) {
            feature.set('hidden', false)
            return true
          }
          return false
        })
      }
    } else {
      // not feature hit. Try WMS GetFeatureInfo
      const viewResolution = this.state.map.getView().getResolution()
      const layers = getState('map/layer/layers').getArray().filter(layer => {
        return layer.get('conf').type === 'TileWMS' && layer.getVisible()
      })
      let url = null
      // FIXME: multiple results
      for (let i = layers.length - 1; i >= 0; i--) {
        const queryLayers = layers[i].getSource().getParams().LAYERS
        url = layers[i].getSource().getFeatureInfoUrl(
          coords, viewResolution, this.state.map.getView().getProjection(),
          { 'INFO_FORMAT': 'application/json', 'QUERY_LAYERS': queryLayers.split(',').reverse().join(','), 'FEATURE_COUNT': queryLayers.split(',').length })
        this.getWMSFeatureInfo(url, (result) => {
          if (result) {
            const features = this.format.geojson.readFeatures(result)
            if (features.length) {
              // FIXME: multiple results
              popContent = this.getContent(features[0], layers[i])
              this.show(e, coords, hit, popContent)
            }
          }
        })
      }
    }
  }
  getContent (feature, layer) {
    if (feature && layer) {
      const props = feature.getProperties()
      const geotrip = getState('geocache/trip')
      let title, content
      if (layer.get('_featureInfo')) {
        const info = layer.get('_featureInfo')
        title = typeof info.title === 'function' ? info.title(feature) : info.title
        content = typeof info.content === 'function' ? info.content(feature) : info.content
      } else {
        title = `
          <i class="fa fa-map-marker-alt"></i>
          ${t('Feature')}
          <div class="tools">
            <a href="#" class="remove-marker" title="Eemalda">
              <i class="far fa-trash-alt"></i>
            </a>
            ${feature.getGeometry() instanceof Point ? `
            <a href="#" class="cache-toggle" data-id="${feature.get('id')}" title="${t('Add to geotrip')}">
              <i class="fas ${(geotrip && geotrip.getArray().indexOf(feature) > -1) ? 'fa-minus-square' : 'fa-thumbtack'}"></i>
            </a>
            ` : ''}
          </div>`
        content = Object.keys(props).filter(key => {
          return (typeof props[key] === 'string' || typeof props[key] === 'number' || typeof props[key] === 'boolean')
        }).map(key => {
          return `${key}: ${makeLink(props[key])}`
        })
        if (this.state.geomTypes.linestrings.indexOf(feature.getGeometry().getType()) > -1) {
          content.push(`${t('Length')}: ${formatLength(feature.getGeometry())}`)
        }
        if (this.state.geomTypes.polygons.indexOf(feature.getGeometry().getType()) > -1) {
          content.push(`${t('Area')}: ${formatArea(feature.getGeometry())}`)
        }
        content = content.join('<br>')
      }
      if (
        this.state.geomTypes.points.indexOf(feature.getGeometry().getType()) > -1 &&
        getState('map/geolocation')
      ) {
        // calculate distance from current location to feature
        const position = getState('map/geolocation/position')
        const distance = getDistance(toLonLat(position),
          toLonLat(feature.getGeometry().getCoordinates()))
        content += `<div class="distance"><i class="fas fa-location-arrow"></i>
          ${formatLength(null, distance)}</div>`
      }
      return {
        definition: {
          container: this.el,
          placement: 'top',
          animation: false,
          html: true,
          title: title,
          content: content,
          template: `
            <div class="popup popover">
              <div class="arrow"></div>
              <h3 class="popover-header"></h3>
              <div class="popover-body"></div>
            </div>`
        },
        'onShow': (f, pop) => {
          const geotrip = getState('geocache/trip')
          $(pop).on('contextmenu', e => {
            e.stopPropagation()
          })
          $(pop).on('click', '.remove-marker', e => {
            e.preventDefault()
            if (f && f[0]) {
              f[0].getSource().removeFeature(f[1])
              if (geotrip) {
                geotrip.remove(f[1])
              }
              this.el.popover('dispose')
            }
          })
          $(pop).on('click', '.cache-toggle', e => {
            e.preventDefault()
            $(e.currentTarget).find('i').toggleClass('fa-thumbtack fa-minus-square')
            if (geotrip) {
              if (geotrip.getArray().indexOf(f[1]) > -1) {
                geotrip.remove(f[1])
              } else {
                geotrip.push(f[1])
              }
            }
          })
          $(pop).on('click', '.distance', e => {
            e.preventDefault()
            const coords = [
              toLonLat(getState('map/geolocation/position')),
              toLonLat(f[1].getGeometry().getCoordinates())
            ]
            findRoute(coords).then(route => {
              if (route) {
                setState('navigate/to', f[1])
              }
            }).catch(e => {
              setState('navigate/to', f[1])
            })
          })
          // call stored onShow
          if (f && f[0] && f[0].get('_featureInfo') && typeof f[0].get('_featureInfo').onShow === 'function') {
            f[0].get('_featureInfo').onShow(f, pop)
          }
        },
        'onHide': function () {}
      }
    }
  }
  getWMSFeatureInfo (url, cb) {
    $.ajax({
      type: 'GET',
      crossDomain: true,
      url: url,
      dataType: 'json',
      context: this
    })
      .done(cb)
      .fail(function (request) {
        cb(null)
      })
  }
}

export default Popup
