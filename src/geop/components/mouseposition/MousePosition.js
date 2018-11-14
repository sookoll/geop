import Component from 'Geop/Component'
import {getState} from 'Utilities/store'
import MousePositionControl from 'ol/control/MousePosition'
import {format} from 'ol/coordinate'
import {toLonLat} from 'ol/proj'
import $ from 'jquery'
import './MousePosition.styl'

class MousePosition extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <span id="mouse-position" class="mouse-position float-left"></span>
    `)

    this.state = {
      projection: 'EPSG:4326',
      control: null,
      lock: true,
      clickHandler: (e) => {
        this.clicked(e)
      }
    }
    this.create()
  }
  render () {
    this.el.html(`
      <a href="#" class="btn lock float-left">
        <i class="fa fa-${this.state.lock ? 'lock' : 'unlock'}"></i>
      </a>
      <div class="float-left coords"></div>
    `)
    this.el.on('click', 'a.lock', e => {
      e.preventDefault()
      this.state.lock = !this.state.lock
      this.activate(getState('map'))
      $(e.currentTarget).find('i').toggleClass('fa-lock fa-unlock')
    })
    if (!this.state.control) {
      this.state.control = new MousePositionControl({
        coordinateFormat: coord => format(coord, '{y}, {x}', 5),
        projection: this.state.projection,
        className: 'float-left coords',
        target: this.el[0],
        undefinedHTML: ''
      })
      const map = getState('map')
      if (map) {
        this.activate(map)
      } else {
        const que = getState('map/que')
        que.push(map => {
          this.activate(map)
        })
      }
    }
  }
  activate (map) {
    if (this.state.lock) {
      map.removeControl(this.state.control)
      this.el.find('.coords').show()
      map.on('click', this.state.clickHandler)
    } else {
      this.el.find('.coords').hide()
      map.un('click', this.state.clickHandler)
      map.addControl(this.state.control)
    }
  }
  clicked (e) {
    const coord = toLonLat(e.coordinate)
    this.el.find('.coords').html(format(coord, '{y}, {x}', 5))
  }
}

export default MousePosition
