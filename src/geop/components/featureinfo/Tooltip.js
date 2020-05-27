import Component from 'Geop/Component'
import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Overlay from 'ol/Overlay'
import './Tooltip.styl'

class Tooltip extends Component {
  create () {
    this.el = this.$.create('<div id="tooltip"></div>')
    this.state = {
      overlay: new Overlay({
        element: this.el,
        autoPan: false,
        positioning: 'center-center',
        offset: [0, -14],
        stopEvent: false
      }),
      tooltipVisible: false,
      currentFeature: null
    }
    const map = getState('map')
    if (map) {
      this.init(map)
    } else {
      const que = getState('map/que')
      que.push(map => {
        this.init(map)
      })
    }
  }

  init (map) {
    map.addOverlay(this.state.overlay)
    map.on('pointermove', e => {
      if (e.dragging) {
        return
      }
      const pixel = map.getEventPixel(e.originalEvent)
      const hit = map.hasFeatureAtPixel(pixel)
      map.getTarget().style.cursor = hit ? 'pointer' : ''
      this.state.tooltipVisible = this.open(hit ? e.originalEvent : false, map)
    })
  }

  open (e, map) {
    // if !px then remove tooltip and return false
    if (!e) {
      this.$.html(this.el, '')
      this.state.overlay.setPosition(undefined)
      this.state.currentFeature = null
      return false
    }
    // get feature
    let coord = map.getEventCoordinate(e)
    const feature = map.forEachFeatureAtPixel(
      map.getEventPixel(e),
      (feature, layer) => feature
    )
    // if not same feature
    if (feature !== this.state.currentFeature && (feature.get('name') || feature.get('title'))) {
      // if point, then geometry coords
      if (feature.getGeometry().getType() === 'Point') {
        coord = feature.getGeometry().getCoordinates()
      }
      this.$.html(this.el, t(feature.get('name') || feature.get('title')))
      this.state.overlay.setPosition(coord)
      this.state.currentFeature = feature
    }
    return true
  }
}

export default Tooltip
