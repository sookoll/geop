import Component from 'Geop/Component'
import {getState, setState} from 'Utilities/store'
import log from 'Utilities/log'
import {t} from 'Utilities/translate'
import {copy} from 'Utilities/util'
import MousePositionControl from 'ol/control/MousePosition'
import {format, toStringHDMS} from 'ol/coordinate'
import mgrs from 'mgrs'
import {transform} from 'ol/proj'
import $ from 'jquery'
import './MousePosition.styl'

class MousePosition extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <span id="mouse-position" class="mouse-position float-left"></span>
    `)
    this.coordFormats = [
      {
        projection: 'EPSG:4326',
        srname: 'WGS',
        coordinateFormat: (coordinate) => {
          return format(coordinate, '{y}, {x}', 4)
        }
      },
      {
        projection: 'EPSG:4326',
        srname: 'WGS dms',
        coordinateFormat: (coordinate) => {
          return toStringHDMS(coordinate, 1)
        }
      },
      {
        projection: 'EPSG:3301',
        srname: 'L-EST',
        coordinateFormat: (coordinate) => {
          return format(coordinate, '{y}, {x}', 0)
        }
      },
      {
        projection: 'EPSG:4326',
        srname: 'MGRS',
        coordinateFormat: (coordinate) => {
          return mgrs.forward(coordinate)
        }
      }
    ]

    this.state = {
      format: 0,
      projection: null,
      control: null,
      lock: false,
      lastCoord: null
    }
    this.clickHandler = (e) => {
      this.clicked(e)
    }
    this.create()
    // set contextmenu
    let contextMenuItems = getState('map/contextmenu')
    if (!contextMenuItems) {
      setState('map/contextmenu', [])
      contextMenuItems = getState('map/contextmenu')
    }
    contextMenuItems.push({
      icon: 'far fa-clone',
      content: coord => {
        return this.format(coord)
      },
      onclick: (e, coord) => {
        this.copy(e.currentTarget)
      },
      closeonclick: true
    })
  }
  render () {
    this.el.html(`
      <div class="btn-group dropup float-left">
        <button type="button" class="btn btn-secondary lock">
          <i class="fa fa-${this.state.lock ? 'lock' : 'lock-open'}"></i>
        </button>
        <button type="button"
          class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
          data-toggle="dropdown">
        </button>
        <div class="dropdown-menu">
          ${this.coordFormats.map((format, i) => {
            return `
              <a class="dropdown-item" href="#" data-format="${i}">
                <i class="far ${i === this.state.format ? 'fa-dot-circle' : 'fa-circle'}"></i>
                ${format.srname}
              </a>`
          }).join('')}
        </div>
      </div>
      <button type="button" class="btn btn-link copy float-left">
        <i class="far fa-clone"></i>
        <span>${this.coordFormats[this.state.format].srname}</span>
      </button>
    `)
    this.el.on('click', '.lock', e => {
      this.state.lock = !this.state.lock
      this.activate(getState('map'))
      $(e.currentTarget).find('i').toggleClass('fa-lock fa-lock-open')
    })
    this.el.on('click', '.copy', e => {
      const coordsEl = this.el.find('.coords')
      this.copy(coordsEl[0])
    })
    this.el.on('click', 'a[data-format]', e => {
      this.state.format = $(e.currentTarget).data('format')
      this.state.control.setProjection(this.coordFormats[this.state.format].projection)
      this.state.control.setCoordinateFormat(this.coordFormats[this.state.format].coordinateFormat)
      this.el.find('a[data-format] i').removeClass('fa-dot-circle').addClass('fa-circle')
      $(e.currentTarget).find('i').removeClass('fa-circle').addClass('fa-dot-circle')
      this.el.find('button.copy span').html(this.coordFormats[this.state.format].srname)
    })
    if (!this.state.control) {
      this.state.control = new MousePositionControl({
        coordinateFormat: this.coordFormats[this.state.format].coordinateFormat,
        projection: this.coordFormats[this.state.format].projection,
        className: 'float-left coords',
        target: this.el[0],
        undefinedHTML: ''
      })
      const map = getState('map')
      if (map) {
        this.state.projection = map.getView().getProjection().getCode()
        this.activate(map)
      } else {
        const que = getState('map/que')
        que.push(map => {
          this.state.projection = map.getView().getProjection().getCode()
          this.activate(map)
        })
      }
    }
  }
  activate (map) {
    if (this.state.lock) {
      map.removeControl(this.state.control)
      this.el.append('<div class="float-left coords"></div>')
      map.on('click', this.clickHandler)
    } else {
      this.el.find('.coords').remove()
      map.un('click', this.clickHandler)
      map.addControl(this.state.control)
    }
  }
  clicked (e) {
    this.el.find('.coords').html(this.format(e.coordinate))
  }
  copy (el) {
    copy(el)
      .then(() => {
        log('success', `${t('Coordinates')} ${el.innerText} ${t('copied to clipboard')}`)
      })
      .catch(() => {
        log('error', t('Unable to copy to clipboard'))
      })
  }
  format (coordinate) {
    const coord = transform(
      coordinate,
      this.state.projection,
      this.coordFormats[this.state.format].projection
    )
    return this.coordFormats[this.state.format].coordinateFormat(coord)
  }
}

export default MousePosition
