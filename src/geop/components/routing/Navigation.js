import Component from 'Geop/Component'
import { getState, setState, onchange } from 'Utilities/store'
import { formatLength, getBearing } from 'Utilities/util'
import { getLayer } from './Routing'
import { createStyle } from 'Components/layer/StyleBuilder'
import { getDistance } from 'ol/sphere'
import { toLonLat } from 'ol/proj'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import $ from 'jquery'
import './Navigation.styl'

class Navigation extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="text-center d-none" id="navigation">
      <i class="fas fa-location-arrow"></i>
      <span></span>
      <button class="btn btn-link">
        <i class="fas fa-times"></i>
      </button>
    </div>`)
    this.state = {
      active: false,
      hide: target.find('#mouse-position, #scale-line, #bookmark'),
      to: null,
      route: new Feature(new LineString([]))
    }
    this.state.route.setStyle(createStyle({
      stroke: {
        color: 'rgba(0, 133, 203, 0.6)',
        width: 1
      }
    }))
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
  render () {
    this.el.on('click', 'button', e => {
      this.deactivate()
    })
  }
  update () {
    // calculate distance from current location to feature
    const from = getState('map/geolocation/position')
    const to = this.state.to.getGeometry().getCoordinates()
    const angle = getBearing(from, to)
    const distance = getDistance(toLonLat(from), toLonLat(to))
    this.el.find('span').html(`
      ${formatLength(null, distance, [0, 1])}
      <i>&middot;</i> ${Math.round(angle)}&deg;
    `)
    this.state.route.getGeometry().setCoordinates([from, to])
  }
  activate (feature) {
    this.state.hide.attr('style', 'display: none !important')
    this.el.removeClass('d-none')
    this.state.to = feature
    getLayer().getSource().addFeature(this.state.route)
    this.state.active = true
    this.update()
  }
  deactivate () {
    this.state.hide.removeAttr('style')
    this.el.addClass('d-none')
    this.el.find('span').html('')
    getLayer().getSource().clear()
    this.state.route.getGeometry().setCoordinates([])
    // context menu items reset
    setState('routing/stops', [])
    this.state.active = false
  }
}

export default Navigation
