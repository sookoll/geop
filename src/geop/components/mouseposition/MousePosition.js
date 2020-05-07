import Component from 'Geop/Component'
import { createLayer } from 'Components/layer/LayerCreator'
import { getState, setState } from 'Utilities/store'
import log from 'Utilities/log'
import { t } from 'Utilities/translate'
import { copy, hexToRgbA, uid } from 'Utilities/util'
import MousePositionControl from 'ol/control/MousePosition'
import GeoJSONFormat from 'ol/format/GeoJSON'
import Overlay from 'ol/Overlay'
import { format } from 'ol/coordinate'
import { modulo } from 'ol/math'
import { padNumber } from 'ol/string'
import mgrs from 'mgrs'
import { transform } from 'ol/proj'
import $ from 'jquery'
import './MousePosition.styl'

const coordFormats = [
  {
    projection: 'EPSG:4326',
    srname: 'WGS (d)',
    coordinateFormat: (coordinate) => {
      return format(coordinate, '{y}, {x}', 5)
    }
  },
  {
    projection: 'EPSG:4326',
    srname: 'WGS (dm)',
    coordinateFormat: (coordinate) => {
      return toStringHDM(coordinate, 3)
    }
  },
  {
    projection: 'EPSG:4326',
    srname: 'WGS (dms)',
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

class MousePosition extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <span class="mouse-position"></span>
    `)
    this.animationEl = $(`
      <svg width="20" height="20"></svg>`)

    this.state = {
      format: 0,
      control: null,
      lock: false,
      lastCoord: null,
      overlay: new Overlay({
        element: this.animationEl[0],
        positioning: 'center-center'
      })
    }
    setState('map/coordinateFormat', this.state.format, true)
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
        return `<i class="fa fa-map-marker-alt size-1_1"></i>
          ${formatCoordinate(coord)}
          <a href="#" class="btn btn-link context-item-btn"><i class="far fa-clone"></i></a>`
      },
      onClick: (e, coord, feature) => {
        !feature && createMarker(coord)
      },
      onBtnClick: (e, coord) => {
        e.preventDefault()
        this.copy(formatCoordinate(coord))
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
          ${coordFormats.map((format, i) => {
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
      setState('map/coordinateFormat', this.state.format, true)
      this.state.control.setProjection(coordFormats[this.state.format].projection)
      this.state.control.setCoordinateFormat(coordFormats[this.state.format].coordinateFormat)
      this.el.find('a[data-format] i').removeClass('fa-dot-circle').addClass('fa-circle')
      $(e.currentTarget).find('i').removeClass('fa-circle').addClass('fa-dot-circle')
    })
    if (!this.state.control) {
      this.state.control = new MousePositionControl({
        coordinateFormat: coordFormats[this.state.format].coordinateFormat,
        projection: coordFormats[this.state.format].projection,
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
    this.el.find('.coords').html(formatCoordinate(e.coordinate))
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

function formatCoordinate (coordinate) {
  const coord = transform(
    coordinate,
    getState('map/projection'),
    coordFormats[getState('map/coordinateFormat')].projection
  )
  return coordFormats[getState('map/coordinateFormat')].coordinateFormat(coord)
}

function degreesToStringHDM (hemispheres, degrees, fractionDigits, hemispharePosition) {
  const normalizedDegrees = modulo(degrees + 180, 360) - 180
  const x = Math.abs(3600 * normalizedDegrees)
  const dflPrecision = fractionDigits || 0
  const precision = Math.pow(10, dflPrecision)
  let deg = Math.floor(x / 3600)
  let min = (x - (deg * 3600)) / 60
  min = Math.ceil(min * precision) / precision
  if (min >= 60) {
    min = 0
    deg += 1
  }
  if (hemispharePosition === 'end') {
    return deg + '\u00b0 ' + padNumber(min, 2, dflPrecision) + '\u2032' +
      (normalizedDegrees === 0 ? '' : ' ' + hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0))
  } else if (hemispharePosition === 'front') {
    return (normalizedDegrees === 0 ? '' : hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0) + ' ') +
      deg + '\u00b0 ' + padNumber(min, 2, dflPrecision) + '\u2032'
  } else {
    return deg + '\u00b0 ' + padNumber(min, 2, dflPrecision) + '\u2032'
  }
}

function toStringHDM (coordinate, fractionDigits, hemispharePosition) {
  if (coordinate) {
    return degreesToStringHDM('NS', coordinate[1], fractionDigits, hemispharePosition) + ' ' +
      degreesToStringHDM('EW', coordinate[0], fractionDigits, hemispharePosition)
  } else {
    return ''
  }
}

function degreesToStringHDMS (hemispheres, degrees, fractionDigits, hemispharePosition) {
  const normalizedDegrees = modulo(degrees + 180, 360) - 180
  const x = Math.abs(3600 * normalizedDegrees)
  const dflPrecision = fractionDigits || 0
  const precision = Math.pow(10, dflPrecision)
  let deg = Math.floor(x / 3600)
  let min = Math.floor((x - deg * 3600) / 60)
  let sec = x - (deg * 3600) - (min * 60)
  sec = Math.ceil(sec * precision) / precision
  if (sec >= 60) {
    sec = 0
    min += 1
  }
  if (min >= 60) {
    min = 0
    deg += 1
  }
  if (hemispharePosition === 'end') {
    return deg + '\u00b0 ' + padNumber(min, 2) + '\u2032 ' +
      padNumber(sec, 2, dflPrecision) + '\u2033' +
      (normalizedDegrees === 0 ? '' : ' ' + hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0))
  } else if (hemispharePosition === 'front') {
    return (normalizedDegrees === 0 ? '' : hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0) + ' ') +
      deg + '\u00b0 ' + padNumber(min, 2) + '\u2032 ' +
        padNumber(sec, 2, dflPrecision) + '\u2033'
  } else {
    return deg + '\u00b0 ' + padNumber(min, 2) + '\u2032 ' +
      padNumber(sec, 2, dflPrecision) + '\u2033'
  }
}

function toStringHDMS (coordinate, fractionDigits, hemispharePosition) {
  if (coordinate) {
    return degreesToStringHDMS('NS', coordinate[1], fractionDigits, hemispharePosition) + ' ' +
      degreesToStringHDMS('EW', coordinate[0], fractionDigits, hemispharePosition)
  } else {
    return ''
  }
}

export function createMarker (coordinate, props = null) {
  const layer = layerCreate()
  // we do not create duplicated markers on same coordinate.
  const features = layer.getSource().getFeatures().filter(feature => {
    return JSON.stringify(feature.getGeometry().getCoordinates()) === JSON.stringify(coordinate) &&
      ((props && props.name && feature.getProperties().name &&
      feature.getProperties().name === props.name) || !props)
  })
  if (features.length) {
    return features[0]
  }
  if (!props) {
    props = {
      name: formatCoordinate(coordinate)
    }
  }
  const feature = new GeoJSONFormat().readFeature({
    type: 'Feature',
    id: uid(),
    properties: props,
    geometry: {
      type: 'Point',
      coordinates: coordinate
    }
  })
  layer.getSource().addFeature(feature)
  setState('layerchange', ['overlays', layer.get('id')])
  return feature
}

function layerCreate () {
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
        color: hexToRgbA('#fff', 0.5)
      },
      circle: {
        stroke: {
          color: color
        },
        fill: {
          color: hexToRgbA('#fff', 0.9)
        }
      }
    }
  }
  const layerId = getState('layer/mousePositionId')
  let layer
  if (!layerId) {
    layer = createLayer(conf)
    getState('map/layer/overlays').push(layer)
    setState('layer/mousePositionId', layer.get('id'), true)
  } else {
    const lset = getState('map/layer/overlays').getArray().filter(l => l.get('id') === layerId)
    if (lset && lset[0]) {
      layer = lset[0]
    } else {
      layer = createLayer(conf)
      getState('map/layer/overlays').push(layer)
      setState('layer/mousePositionId', layer.get('id'), true)
    }
  }
  return layer
}

export default MousePosition
