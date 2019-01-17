import Component from 'Geop/Component'
import {getState} from 'Utilities/store'
import { t } from 'Utilities/translate'
import Overlay from 'ol/Overlay'
import $ from 'jquery'
import './Tooltip.styl'

class Tooltip extends Component {
  constructor (target) {
    super(target)
    this.el = $('<div id="tooltip"></div>')
    this.state = {
      tooltipVisible: false,
      overlay: null,
      currentFeature: null
    }
    this.create()
  }
  render () {
    this.state.overlay = new Overlay({
      element: this.el[0],
      autoPan: false,
      positioning: 'center-center',
      offset: [0, -14],
      stopEvent: false
    })
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
      this.el.html('')
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
      this.el.html(t(feature.get('name') || feature.get('title')))
      this.state.overlay.setPosition(coord)
      this.state.currentFeature = feature
    }
    return true
  }
}

export default Tooltip
