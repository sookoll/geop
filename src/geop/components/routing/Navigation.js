import Component from 'Geop/Component'
import { getState, setState, onchange } from 'Utilities/store'
import { formatLength, getBearing } from 'Utilities/util'
import { getLayer } from './Routing'
import { createStyle } from 'Components/layer/StyleBuilder'
import { getDistance } from 'ol/sphere'
import { toLonLat } from 'ol/proj'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'

class Navigation extends Component {
  create () {
    this.el = null
    this.state = {
      active: false,
      to: null,
      route: new Feature(new LineString([]))
    }
    this.state.route.setStyle(createStyle({
      stroke: {
        color: 'rgba(0, 133, 203, 0.6)',
        width: 1
      }
    }))
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
    const angle = getBearing(from, to)
    const distance = getDistance(toLonLat(from), toLonLat(to))
    setState('routing/info', `
      ${formatLength(null, distance, [0, 1])}
      <i>&middot;</i> ${Math.round(angle)}&deg;
    `)
    this.state.route.getGeometry().setCoordinates([from, to])
  }

  activate (feature) {
    this.state.to = feature
    getLayer().getSource().addFeature(this.state.route)
    this.state.active = true
    this.update()
  }

  deactivate () {
    // clear()
    this.state.route.getGeometry().setCoordinates([])
    this.state.active = false
  }
}

export default Navigation
