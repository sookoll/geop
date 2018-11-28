import { t } from 'Utilities/translate'
import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import $ from 'jquery'
import './Compass.styl'

class Compass extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
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
    this.el.on('click', e => {
      const view = getState('map').getView()
      view.animate({
        rotation: 0,
        duration: 250
      })
    })
  }

  rotateIcon (view) {
    const viewRotation = view.getRotation()
    if (viewRotation !== 0 && this.state.removed) {
      this.create()
      this.state.removed = false
    } else if (viewRotation === 0) {
      this.el.fadeOut(400, () => {
        this.el.remove()
        this.el.show()
        this.state.removed = true
      })
    }
    this.el.find('.icon').css({
      '-webkit-transform': `rotate(${viewRotation}rad)`,
      '-moz-transform': `rotate(${viewRotation}rad)`,
      'transform': `rotate(${viewRotation}rad)`
    })
  }
}

export default Compass
