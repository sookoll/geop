import Component from 'Geop/Component'
import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { degToRad } from 'Utilities/util'
import log from 'Utilities/log'
import {createLayer } from 'Components/layer/LayerCreator'
import { createStyle } from 'Components/layer/StyleBuilder'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import Circle from 'ol/geom/Circle'
import LineString from 'ol/geom/LineString'
import Feature from 'ol/Feature'
import Geolocation from 'ol/Geolocation'
import { toLonLat } from 'ol/proj'
import $ from 'jquery'
import './GeoLocation.styl'

class GeoLocation extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <button id="geolocation" class="btn btn-link" disabled title="${t('My location')}">
        <i class="fa fa-location-arrow"></i>
      </button>
    `)
    this.markerEl = $('<i id="geolocation_marker" class="far fa-stop-circle" />')
    this.state = {
      active: 0,
      status: ['', 'active', 'tracking'],
      position: new Overlay({
        positioning: 'center-center',
        element: this.markerEl[0],
        stopEvent: false,
        offset: [0, 0]
      }),
      track: new LineString([], ('XYZM')),
      accuracy: new Feature({
        id: 'accuracy',
        radius: 0,
        geometry: new Point([])
      }),
      zoom: 16,
      layer: this.createLayer(),
      locator: new Geolocation({
        projection: getState('map/projection'),
        trackingOptions: {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 600000
        }
      })
    }
    this.handlers = {
      rotate: (e) => {
        const angle = getState('map').getView().getRotation()
        this.rotateMarker(angle)
      },
      disableTracking: (e) => {
        this.disableTracking()
      }
    }
    if (this.test()) {
      this.create()
      this.init()
    }
  }
  render () {
    this.el.prop('disabled', false)
    this.el.on('click', e => {
      this.state.active = (this.state.active + 1 >= this.state.status.length) ?
        0 : this.state.active + 1
      if (this.state.active === 0) {
        this.disable()
        $(e.currentTarget).removeClass(this.state.status.join(' '))
      } else {
        this.enable()
        $(e.currentTarget).addClass(this.state.status[this.state.active])
      }
    })
  }
  test () {
    return !!navigator.geolocation
  }
  init () {
    this.state.accuracy.setStyle(createStyle({
      fill: {
        color: 'rgba(51, 153, 204, 0.15)'
      }
    }))
    this.state.layer.getSource().addFeatures([
      this.state.accuracy,
      new Feature(this.state.track)
    ])
    this.state.locator.on('change', e => {
      this.positionChanged(e)
    })
    this.state.locator.on('error', e => {
      console.error('geolocation error', e)
      this.disable()
      this.el.removeClass(this.state.status.join(' '))
      log('error', t('Unable to find location'))
    })
  }
  enable () {
    const map = getState('map')
    const view = map.getView()
    if (this.state.status[this.state.active] === 'active') {
      getState('map/layer/overlays').push(this.state.layer)
      map.addOverlay(this.state.position)
      this.state.locator.setTracking(true)
      view.on('change:rotation', this.handlers.rotate)
    } else if (this.state.status[this.state.active] === 'tracking') {
      view.un('change:rotation', this.handlers.rotate)
      this.rotateMarker(0)
      const coords = this.state.track.getCoordinates()
      if (coords.length) {
        this.updateView(
          [coords[coords.length - 1][0], coords[coords.length - 1][1]],
          coords[coords.length - 1][2]
        )
      }
      map.on('pointerdrag', this.handlers.disableTracking)
    }
  }
  disable () {
    const map = getState('map')
    this.state.locator.setTracking(false)
    this.state.position.setPosition(null)
    this.state.accuracy.getGeometry().setCoordinates([])
    if (this.state.track.getCoordinates().length > 0) {
      this.state.layer.getSource().addFeature(
        new Feature(this.state.track.clone())
      )
    }
    this.state.track.setCoordinates([])
    map.getView().setRotation(0)
    map.removeOverlay(this.state.position)
    getState('map/layer/overlays').remove(this.state.layer)
    map.un('postcompose', this.handlers.updateView)
    map.un('pointerdrag', this.handlers.disableTracking)
    this.rotateMarker(0)
    this.state.active = 0
  }
  disableTracking () {
    const map = getState('map')
    map.un('postcompose', this.handlers.updateView)
    map.un('pointerdrag', this.handlers.disableTracking)
    map.getView().on('change:rotation', this.handlers.rotate)
    this.el.removeClass(this.state.status[this.state.active])
    this.state.active = this.state.status.indexOf('active')
  }
  createLayer () {
    return createLayer({
      type: 'FeatureCollection',
      title: 'Track',
      style: {
        stroke: {
          color: 'rgba(255, 0, 0, 0.5)',
          width: 3,
          lineDash: [5, 5]
        },
        fill: {
          color: 'rgba(255, 0, 0, 0.1)'
        },
        geometry: feature => {
          if (feature.get('id') === 'accuracy') {
            const coordinates = feature.getGeometry().getCoordinates()
            const lonlat = toLonLat(coordinates)
            const scaleF = 1 / Math.cos(degToRad(lonlat[1]))
            return new Circle(coordinates, (feature.get('radius') * scaleF))
          }
          return feature.getGeometry()
        }
      }
    })
  }
  positionChanged (e) {
    const position = this.state.locator.getPosition()
    const radius = this.state.locator.getAccuracy()
    const speed = this.state.locator.getSpeed() || 0
    const coords = this.state.track.getCoordinates()
    let heading = this.state.locator.getHeading() || 0
    // if no movement, then heading is previous heading
    if (speed === 0 && coords.length > 0) {
      heading = coords[coords.length - 1][2]
    }
    console.debug(`positionChanged: ${position[0]} ${position[1]} ${radius} ${speed} ${heading}`)
    if (position && !isNaN(position[0]) && !isNaN(position[1]) && typeof heading !== 'undefined') {
      this.addPosition(position, heading, Date.now(), speed, radius)
      this.updateView(position, heading)
    }
  }
  addPosition (position, heading, m, speed, radius) {
    const view = getState('map').getView()
    this.state.track.appendCoordinate([position[0], position[1], heading, m])
    this.state.position.setPosition([position[0], position[1]])
    this.state.accuracy.getGeometry().setCoordinates([position[0], position[1]])
    this.state.accuracy.set('radius', radius)
    if (speed) {
      this.markerEl
        .removeClass('fa-stop-circle')
        .addClass('fa-play-circle')
      // if not tracking, then rotate icon
      if (this.state.status[this.state.active] === 'active') {
        const angle = view.getRotation() + heading
        this.rotateMarker(angle)
      }
    } else {
      this.markerEl
        .removeClass('fa-play-circle')
        .addClass('fa-stop-circle')
    }
  }
  rotateMarker (angle) {
    angle += degToRad(-90)
    this.markerEl.css({
      '-webkit-transform': 'rotate(' + angle + 'rad)',
      '-moz-transform': 'rotate(' + angle + 'rad)',
      'transform': 'rotate(' + angle + 'rad)'
    })
  }
  /**
   * recenters the view by putting the given coordinates
   * at 3/4 from the top or the screen
   */
  getCenterWithHeading (position, rotation, resolution) {
    const size = getState('map').getSize()
    return [
      position[0] - Math.sin(rotation) * size[1] * resolution * 1 / 4,
      position[1] + Math.cos(rotation) * size[1] * resolution * 1 / 4
    ]
  }
  updateView (position, heading) {
    const view = getState('map').getView()
    const coords = this.state.track.getCoordinates()
    // if not tracking
    if (coords.length === 1) {
      view.setCenter(position)
      view.setZoom(this.state.zoom)
    }
    if (this.state.status[this.state.active] === 'tracking') {
      view.setCenter(this.getCenterWithHeading(position, -heading, view.getResolution()))
      view.setRotation(-heading)
    }
  }
}

export default GeoLocation
