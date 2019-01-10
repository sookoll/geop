import Component from 'Geop/Component'
import { getState, onchange } from 'Utilities/store'
import { formatLength, radToDeg } from 'Utilities/util'
import { getDistance } from 'ol/sphere'
import { toLonLat } from 'ol/proj'
import $ from 'jquery'
import './Navigation.styl'

class Navigation extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="text-center d-none" id="navigation"></div>`)
    this.state = {
      active: false,
      hide: target.find('#mouse-position, #scale-line'),
      to: null
    }
    this.create()
    onchange('navigate/to', (feature) => {
      if (feature) {
        this.activate(feature)
      } else {
        this.deactivate()
      }
    })
    onchange('map/geolocation/position', () => {
      if (this.state.active) {
        this.update()
      }
    })
  }
  update () {
    // calculate distance from current location to feature
    const from = getState('map/geolocation/position')
    const to = this.state.to.getGeometry().getCoordinates()
    let angle = radToDeg(Math.atan2(to[0] - from[0], to[1] - from[1]))
    if (angle < 0) {
      angle = 360 + angle
    }
    const distance = getDistance(toLonLat(from),
      toLonLat(to))
    this.el.html(`
      <i class="far fa-compass"></i> ${Math.round(angle)}&deg;
      <i class="fas fa-location-arrow"></i> ${formatLength(null, distance)}
    `)
  }
  activate (feature) {
    this.state.hide.attr('style', 'display: none !important')
    this.el.removeClass('d-none')
    this.state.to = feature
    this.state.active = true
    this.update()
  }
  deactivate () {
    this.state.hide.removeAttr('style')
    this.el.addClass('d-none')
    this.el.html('')
    this.state.active = false
  }
}

export default Navigation
