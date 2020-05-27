import { t } from 'Utilities/translate'
import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import './Compass.styl'

class Compass extends Component {
  create () {
    this.el = this.$.create(`
      <button id="compass" class="btn btn-link" title="${t('North up!')}">
        <i class="icon"></i>
      </button>
    `)
    this.state = {
      removed: true
    }
    const que = getState('map/que')
    que.push(map => {
      const view = map.getView()
      this.rotateIcon(view)
      view.on('change:rotation', e => {
        this.rotateIcon(view)
      })
    })
  }

  render () {
    this.$.on('click', this.el, e => {
      const view = getState('map').getView()
      view.animate({
        rotation: 0,
        duration: 250,
        anchor: getState('map/anchor') && getState('map/anchor').getCoordinates()
      })
    })
  }

  rotateIcon (view) {
    const viewRotation = view.getRotation()
    if (viewRotation !== 0 && this.state.removed) {
      this.create()
      this.state.removed = false
    } else if (viewRotation === 0) {
      this.$.fadeOut(this.el, 400, () => {
        this.el.remove()
        this.state.removed = true
      })
    }
    if (this.el) {
      this.$.css(this.$.get('.icon', this.el), {
        '-webkit-transform': `rotate(${viewRotation}rad)`,
        '-moz-transform': `rotate(${viewRotation}rad)`,
        transform: `rotate(${viewRotation}rad)`
      })
    }
  }
}

export default Compass
