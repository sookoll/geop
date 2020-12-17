import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { uid, degToRad, radToDeg, formatLength, formatArea } from 'Utilities/util'
import log from 'Utilities/log'
import { createLayer } from 'Components/layer/LayerCreator'
import Component from 'Geop/Component'
import { createStyle } from 'Components/layer/StyleBuilder'
import Feature from 'ol/Feature'
import { MultiPoint, LineString, Polygon, Circle } from 'ol/geom'
import { Modify, DoubleClickZoom, Snap } from 'ol/interaction'
import Collection from 'ol/Collection'
import { toLonLat, fromLonLat } from 'ol/proj'
import { never, always, doubleClick } from 'ol/events/condition'
import { getLength } from 'ol/sphere'
import $ from 'jquery'
import './Measure.styl'

class Measure extends Component {
  constructor (target, opts) {
    super(target)
    this.id = 'measure'
    this.el = $(`<span class="text-center d-none">
      <i class="fa fa-ruler-combined"></i>
      <span></span>
      <button class="btn btn-link">
        <i class="fas fa-times"></i>
      </button>
    </span>`)
    this.state = {
      map: null,
      measureType: null,
      snapTolerance: 10,
      snapFeatures: null,
      layer: null,
      source: null,
      drawing: new Feature({
        geometry: new LineString([])
      }),
      circle: new Feature(),
      sketch: new Feature({
        geometry: new LineString([])
      }),
      measureLine: new LineString([]),
      prev: null
    }
    this.toggleFn = opts.toggle
    this.create()
    this.interaction = {
      snap: null,
      modify: new Modify({
        features: new Collection([this.state.drawing]),
        insertVertexCondition: e => {
          if (this.state.measureType === 'circle') {
            return never(e)
          } else {
            return always(e)
          }
        },
        deleteCondition: e => {
          return doubleClick(e)
        },
        style: createStyle({
          circle: {
            radius: 6,
            stroke: {
              color: 'black',
              width: 1
            },
            fill: {
              color: 'white'
            }
          }
        })
      })
    }
    this.handlers = {
      onmodify: (e) => {
        this.onmodify(e)
      },
      clicked: (e) => {
        this.clicked(e)
      },
      mousemoved: (e) => {
        this.mousemoved(e)
      }
    }
    // set contextmenu
    const contextMenuItems = getState('map/contextmenu')
    contextMenuItems.push({
      content: `<i class="fa fa-ruler-combined"></i> ${t('Measure')}
        <a href="#" class="btn btn-link context-item-btn"><i class="far fa-dot-circle"></i></a>`,
      onClick: (e, coord) => {
        this.init(coord)
      },
      onBtnClick: (e, coord) => {
        e.preventDefault()
        this.init(coord, 'circle')
      },
      closeOnClick: true
    })
  }
  init (coord, type = 'distance') {
    if (!this.state.map) {
      this.state.map = getState('map')
    }
    if (!this.state.layer) {
      this.state.layer = this.createLayer()
      this.state.source = this.state.layer.getSource()
      this.state.layer.setMap(this.state.map)
    }
    this.reset()
    this.state.measureType = type
    this.render()
    // get all features
    this.state.snapFeatures = new Collection(this.getAllFeatures())
    this.state.drawing.getGeometry().setCoordinates([coord])
    this.state.snapFeatures.push(this.state.drawing)
    if (type === 'circle') {
      this.state.circle.setGeometry(new Circle(coord))
      // this._snapFeatures.push(this._circle);
      this.state.source.addFeatures([this.state.circle, this.state.drawing, this.state.sketch])
      log('info', t('Measure angle and distance'))
    } else {
      this.state.source.addFeatures([this.state.drawing, this.state.sketch])
      log('info', t('Measure distance and area. Click to last point finish measurement. Click to first point calculates area.'))
    }
    getState('components/featureInfo') && getState('components/featureInfo').disable()
    this.enableClick()
    this.state.map.getInteractions().getArray().forEach(interaction => {
      if (interaction instanceof DoubleClickZoom) {
        interaction.setActive(false)
      }
    })
    this.state.prev = this.toggleFn(this.id)
    this.el.removeClass('d-none')
  }
  createLayer () {
    const conf = {
      type: 'FeatureCollection',
      id: uid(),
      title: 'Measure',
      style: [
        {
          stroke: {
            color: 'black',
            width: 1
          },
          fill: {
            color: 'rgba(255, 255, 255, 0)'
          }
        },
        {
          circle: {
            radius: 5,
            stroke: {
              color: 'black',
              width: 1
            },
            fill: {
              color: 'white'
            }
          },
          geometry: feature => {
            if (feature.getGeometry() instanceof LineString) {
              var coordinates = feature.getGeometry().getCoordinates()
              return new MultiPoint(coordinates)
            }
          }
        }
      ]
    }
    return createLayer(conf)
  }
  render () {
    this.el.on('click', 'button', e => {
      this.reset()
    })
    const el = this.el.find('span')
    el.html(this.renderResults())
    if (this.state.measureType === 'circle') {
      el.on('focus', 'input', e => {
        this.interaction.modify.setActive(false)
      })
      el.on('blur', 'input', e => {
        const a = el.find('input[name=angle]').val()
        const r = el.find('input[name=radius]').val()
        const coords = this.state.drawing.getGeometry().getCoordinates()
        const coord2 = this.getCoordinateByAngleDistance(coords[0], Number(a), Number(r))
        this.state.drawing.getGeometry().setCoordinates([coords[0], coord2])
        this.interaction.modify.setActive(true)
      })
    }
  }
  renderResults () {
    let html = ''
    if (this.state.measureType === 'circle') {
      html += `
        <label for="angle" class="d-none d-sm-inline-block">${t('Angle')}: </label>
        <input type="text" name="angle" class="input-sm" disabled> <b class="angle-unit">&deg</b>
        <label for="radius" class="d-none d-sm-inline-block">${t('Radius')}: </label>
        <input type="text" name="radius" class="input-sm" disabled> <b class="radius-unit">m</b>`
    } else {
      html += `
        <label for="length" class="d-none d-sm-inline-block">${t('Length')}: </label>
        <input type="text" name="length" class="input-sm" disabled> <b class="length-unit">m</b>
        <label for="area" class="d-none d-sm-inline-block">${t('Area')}: </label>
        <input type="text" name="area" class="input-sm" disabled> <b class="area-unit">m<sup>2</sup></b>`
    }
    return html
  }
  updateResults (geometry = null) {
    if (this.state.measureType === 'circle') {
      this.updateCircleResults()
    } else {
      const len = formatLength(geometry || this.state.drawing.getGeometry(), null, [2, 2], true)
      const coords = this.state.drawing.getGeometry().getCoordinates()
      let area
      // if closed, calculate area
      if (coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]) {
        area = formatArea(new Polygon([coords]), null, [2, 2], true)
      }
      const el = this.el.find('span')
      el.find('input[name=length]').val(len[0])
      el.find('b.length-unit').html(len[1])
      if (area) {
        el.find('input[name=area]').val(area[0])
        el.find('b.area-unit').html(area[1])
      }
    }
  }
  updateCircleResults () {
    let g = this.state.sketch.getGeometry()
    let coords = g.getCoordinates()
    if (coords.length === 0) {
      g = this.state.drawing.getGeometry()
      coords = g.getCoordinates()
    }
    const coord1 = coords[0]
    const coord2 = coords[coords.length - 1]
    let angle = radToDeg(Math.atan2(coord2[0] - coord1[0], coord2[1] - coord1[1]))
    if (angle < 0) {
      angle = 360 + angle
    }
    const radius = getLength(g)
    const el = this.el.find('span')
    el.find('input[name=angle]').val(Math.round((angle + 0.00001) * 100) / 100)
    el.find('input[name=radius]').val(Math.round((radius + 0.00001) * 100) / 100)
  }
  reset () {
    this.toggleFn(this.state.prev)
    this.el.addClass('d-none')
    this.el.find('span').html('')
    this.state.drawing.getGeometry().un('change', this.handlers.onmodify)
    this.state.map.removeInteraction(this.interaction.modify)
    this.state.map.removeInteraction(this.interaction.snap)
    this.state.snapFeatures = null
    this.disableClick()
    getState('components/featureInfo') && getState('components/featureInfo').enable()
    this.state.drawing.getGeometry().setCoordinates([])
    this.state.sketch.getGeometry().setCoordinates([])
    if (this.state.measureType === 'circle') {
      this.state.circle.setGeometry(null)
    }
    this.state.source.clear()
    this.state.map.getInteractions().getArray().forEach(interaction => {
      if (interaction instanceof DoubleClickZoom) {
        interaction.setActive(true)
      }
    })
    $(document).off('keydown')
  }
  enableClick () {
    this.state.map.on('click', this.handlers.clicked)
    this.state.map.on('pointermove', this.handlers.mousemoved)
  }
  disableClick () {
    this.state.map.un('click', this.handlers.clicked)
    this.state.map.un('pointermove', this.handlers.mousemoved)
  }
  clicked (e) {
    this.state.sketch.getGeometry().setCoordinates([])
    const coords = this.state.drawing.getGeometry().getCoordinates()
    const coord2 = this.getSnappedCoordinate(
      e.coordinate,
      this.state.snapFeatures.getArray(),
      this.state.snapTolerance
    )
    if (this.state.measureType === 'circle') {
      const coord1 = coords[0]
      this.state.drawing.getGeometry().setCoordinates([coord1, coord2])
      this.el.find('input[name=angle],input[name=radius]').prop('disabled', false)
      this.finish()
    } else {
      if (coords.length > 1 && coords[0][0] === coord2[0] && coords[0][1] === coord2[1]) {
        // clicked first
        coords.push(coord2)
        this.state.drawing.getGeometry().setCoordinates(coords)
        this.finish()
      } else if (coords.length > 1 && coords[coords.length - 1][0] === coord2[0] && coords[coords.length - 1][1] === coord2[1]) {
        // clicked last
        this.finish()
      } else {
        coords.push(coord2)
        this.state.drawing.getGeometry().setCoordinates(coords)
      }
    }
  }
  onmodify (e) {
    if (this.state.measureType === 'circle') {
      const coords = this.state.drawing.getGeometry().getCoordinates()
      const g = this.state.circle.getGeometry()
      const r = this.getCoordinatesDistance(coords[0], coords[1])
      g.setCenter(coords[0])
      g.setRadius(r)
    }
    this.updateResults()
  }
  mousemoved (e) {
    const coords = this.state.drawing.getGeometry().getCoordinates()
    const coord1 = this.state.measureType === 'circle'
      ? coords[0]
      : coords[coords.length - 1]
    const coord2 = this.getSnappedCoordinate(
      e.coordinate,
      this.state.snapFeatures.getArray(),
      this.state.snapTolerance
    )
    this.state.sketch.getGeometry().setCoordinates([coord1, coord2])
    if (this.state.measureType === 'circle') {
      const r = this.getCoordinatesDistance(coord1, coord2)
      this.state.circle.getGeometry().setRadius(r)
      this.updateResults()
    } else {
      const arr = coords.slice(0)
      arr.push(coord2)
      this.state.measureLine.setCoordinates(arr)
      this.updateResults(this.state.measureLine)
    }
  }
  finish () {
    this.disableClick()
    this.state.sketch.getGeometry().setCoordinates([])
    this.updateResults()
    this.state.map.addInteraction(this.interaction.modify)
    this.interaction.snap = new Snap({ features: this.state.snapFeatures })
    this.state.map.addInteraction(this.interaction.snap)
    this.state.drawing.getGeometry().on('change', this.handlers.onmodify)
  }
  getSnappedCoordinate (needle, haystack, tolerance) {
    let coord = needle
    const calculatePxDistance = (c1, c2) => {
      const p1 = this.state.map.getPixelFromCoordinate(c1)
      const p2 = this.state.map.getPixelFromCoordinate(c2)
      return this.getCoordinatesDistance(p1, p2)
    }
    for (let i = 0, len = haystack.length; i < len; i++) {
      const c = haystack[i].getGeometry().getCoordinates()
      // if point
      if (c && typeof c[0] === 'number') {
        const dist = calculatePxDistance(c, needle)
        if (dist <= tolerance) {
          coord = c
          break
        }
      } else {
        const test = c.filter(item => {
          const dist = calculatePxDistance(item, needle)
          if (dist <= tolerance) {
            return true
          }
        })
        if (test.length > 0) {
          coord = test[0]
        }
      }
    }
    return coord
  }
  getCoordinateByAngleDistance (coord, bearing, distance) {
    // distance in KM, bearing in degrees
    const R = 6378137
    const lonlat = toLonLat(coord)
    const brng = degToRad(bearing)
    let lat = degToRad(lonlat[1])
    let lon = degToRad(lonlat[0])
    // Do the math magic
    lat = Math.asin(Math.sin(lat) * Math.cos(distance / R) + Math.cos(lat) * Math.sin(distance / R) * Math.cos(brng))
    lon += Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat), Math.cos(distance / R) - Math.sin(lat) * Math.sin(lat))
    // Coords back to degrees and return
    return fromLonLat([radToDeg(lon), radToDeg(lat)])
  }
  getCoordinatesDistance (coord1, coord2) {
    const a = Math.abs(coord1[0] - coord2[0])
    const b = Math.abs(coord1[1] - coord2[1])
    return Math.sqrt(a * a + b * b)
  }
  getAllFeatures () {
    let fset = []
    getState('map/layer/layers').forEach(layer => {
      if (layer.get('conf').type === 'FeatureCollection') {
        fset = fset.concat(layer.getSource().getFeatures())
      }
    })
    getState('map/layer/overlays').forEach(layer => {
      if (layer.get('conf').type === 'FeatureCollection' && layer.get('title') !== 'Measure') {
        fset = fset.concat(layer.getSource().getFeatures())
      }
    })
    return fset
  }
}

export default Measure
