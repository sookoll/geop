import Component from 'Geop/Component'
import { getState } from 'Utilities/store'
import ScaleLineControl from 'ol/control/ScaleLine'
import './ScaleLine.styl'

class ScaleLine extends Component {
  constructor (target) {
    super(target)
    this.state = {
      control: null
    }
    this.render()
  }
  render () {
    if (!this.state.control) {
      this.state.control = new ScaleLineControl({
        className: 'ol-scale-line',
        target: this.target
      })
      const map = getState('map')
      if (map) {
        map.addControl(this.state.control)
      } else {
        const que = getState('map/que')
        que.push(map => {
          map.addControl(this.state.control)
        })
      }
    }
  }
}

export default ScaleLine
