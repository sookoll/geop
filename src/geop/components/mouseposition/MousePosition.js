import Component from 'Geop/Component'
import { createLayer } from 'Components/layer/LayerCreator'
import { getState, setState } from 'Utilities/store'
import log from 'Utilities/log'
import { t } from 'Utilities/translate'
import { copy, hexToRgbA, uid } from 'Utilities/util'
import MousePositionControl from 'ol/control/MousePosition'
import GeoJSONFormat from 'ol/format/GeoJSON'
import Overlay from 'ol/Overlay'
import { format, toStringHDMS } from 'ol/coordinate'
import mgrs from 'mgrs'
import { transform } from 'ol/proj'
import $ from 'jquery'
import './MousePosition.styl'

class MousePosition extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <span id="mouse-position" class="mouse-position float-left d-none d-sm-block"></span>
    `)
    this.animationEl = $(`
      <svg width="20" height="20"></svg>`)
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
      lastCoord: null,
      layer: null,
      overlay: new Overlay({
        element: this.animationEl[0],
        positioning: 'center-center'
      })
    }
    this.handlers = {
      onclick: e => {
        this.clicked(e)
      },
      animate: e => {
        this.animate(e)
      }
    }
    this.create()
    // set contextmenu
    const contextMenuItems = getState('map/contextmenu')
    contextMenuItems.push({
      content: coord => {
        return `<i class="fa fa-map-marker-alt"></i>
          ${this.format(coord)}
          <button class="btn btn-link context-item-btn"><i class="far fa-clone"></i></button>`
      },
      onClick: (e, coord) => {
        this.createMarker(coord)
      },
      onBtnClick: (e, coord) => {
        this.copy(this.format(coord))
      },
      closeOnClick: true
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
      const coords = this.el.find('.coords').html()
      this.copy(coords)
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
    // activate animation
    map.addOverlay(this.state.overlay)
    map.on('singleclick', this.handlers.animate)
    if (this.state.lock) {
      map.removeControl(this.state.control)
      this.el.append('<div class="float-left coords"></div>')
      map.on('click', this.handlers.onclick)
    } else {
      this.el.find('.coords').remove()
      map.un('click', this.handlers.onclick)
      map.addControl(this.state.control)
    }
  }
  clicked (e) {
    this.el.find('.coords').html(this.format(e.coordinate))
  }
  copy (content) {
    copy(content)
      .then(() => {
        log('success', `${t('Coordinates')} ${content} ${t('copied to clipboard')}`)
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
  createMarker (coordinate) {
    if (!this.state.layer) {
      const layerId = getState('layer/mousePositionId')
      if (layerId) {
        const layer = getState('map/layer/overlays').getArray().filter(l => l.get('id') === layerId)
        if (layer && layer[0]) {
          this.state.layer = layer[0]
        }
      }
      if (!this.state.layer) {
        this.state.layer = this.createLayer()
        getState('map/layer/overlays').push(this.state.layer)
      }
      setState('layer/mousePositionId', this.state.layer.get('id'), true)
    }
    const feature = new GeoJSONFormat().readFeature({
      type: 'Feature',
      id: uid(),
      properties: {
        name: this.format(coordinate)
      },
      geometry: {
        type: 'Point',
        coordinates: coordinate
      }
    })
    this.state.layer.getSource().addFeature(feature)
    setState('layerchange', this.state.layer.get('id'))
  }
  createLayer () {
    const color = '#000000'
    const conf = {
      type: 'FeatureCollection',
      id: uid(),
      title: 'Features',
      style: {
        stroke: {
          color: color,
          width: 2
        },
        fill: {
          color: hexToRgbA(color, 0.5)
        },
        circle: {
          stroke: {
            color: color
          },
          fill: {
            color: hexToRgbA(color, 0.3)
          }
        }
      }
    }
    return createLayer(conf)
  }
  animate (e) {
    const coord = e.coordinate
    this.state.overlay.setPosition(coord)
    this.animationEl.html(`<circle id="map-click-animation" cx="10" cy="10" r="0" fill="#000" opacity="0.5"/>`)
    setTimeout(() => {
      this.state.overlay.setPosition(undefined)
      this.animationEl.html('')
    }, 500)
  }
}

export default MousePosition
