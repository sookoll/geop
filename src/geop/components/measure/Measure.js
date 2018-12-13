import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { uid, degToRad, radToDeg, formatLength, formatArea } from 'Utilities/util'
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
  constructor (target) {
    super(target)
    this.el = $(`
      <div class="alert small alert-warning alert-dismissible measure" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <i class="fa fa-times"></i>
        </button>
        <div class=""></div>
      </div>
    `)
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
      measureLine: new LineString([])
    }

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
            radius: 5,
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
        <button class="btn btn-link context-item-btn"><i class="far fa-dot-circle"></i></button>`,
      onClick: (e, coord) => {
        this.init(coord)
      },
      onBtnClick: (e, coord) => {
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
      //this._snapFeatures.push(this._circle);
      this.state.source.addFeatures([this.state.circle, this.state.drawing, this.state.sketch])
    } else {
      this.state.source.addFeatures([this.state.drawing, this.state.sketch])
    }
    getState('components/featureInfo') && getState('components/featureInfo').disable()
    this.enableClick()
    this.state.map.getInteractions().getArray().forEach(interaction => {
      if (interaction instanceof DoubleClickZoom) {
        interaction.setActive(false)
      }
    })
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
            radius: 4,
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
    if (this.el) {
      this.el.alert('close')
    }
    let html = ''
    if (this.state.measureType === 'circle') {
      html += `
        <div class="form-inline">
          <label for="angle">${t('Angle')}: </label>
          <input type="text" name="angle" class="form-control input-sm" readonly> &deg;
        </div>
        <div class="form-inline">
          <label for="radius">${t('Radius')}: </label>
          <input type="text" name="radius" class="form-control input-sm" readonly> m
        </div>`
    } else {
      html += `
        ${t('Length')}: ${t('to finish, click on end')}<br>
        ${t('Area')}: ${t('to finish, click on beginning')}`
    }
    this.el.find('div').html(html)
    $('body').append(this.el)
    if (this.state.measureType === 'circle') {
      this.el.on('focus', 'input', e => {
        this.interaction.modify.setActive(false)
      })
      this.el.on('blur', 'input', e => {
        const a = this.el.find('input[name=angle]').val()
        const r = this.el.find('input[name=radius]').val()
        const coords = this.state.drawing.getGeometry().getCoordinates()
        const coord2 = this.getCoordinateByAngleDistance(coords[0], Number(a), Number(r))
        this.state.drawing.getGeometry().setCoordinates([coords[0], coord2])
        this.interaction.modify.setActive(true)
      });
    }
    this.el.on('closed.bs.alert', () => {
      this.reset()
    })
  }
  updateResults () {
    if (this.state.measureType === 'circle') {
      this.updateCircleResults()
    } else {
      const len = formatLength(this.state.drawing.getGeometry())
      let html = `${t('Length')}: ${len}`
      const coords = this.state.drawing.getGeometry().getCoordinates()
      // if closed, calculate area
      if (coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]) {
        const area = formatArea(new Polygon([coords]))
        html += `<br>${t('Area')}: ${area}`
      } else {
        html += `<br>${t('Area')}: ${t('to finish, click on beginning')}`
      }
      this.el.find('div').html(html)
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
    this.el.find('input[name=angle]').val(Math.round((angle + 0.00001) * 100) / 100)
    this.el.find('input[name=radius]').val(Math.round((radius + 0.00001) * 1000) / 1000)
  }
  reset () {
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
      this.el.find('input').prop('readonly', false)
      this.finish()
    } else {
      if (coords.length > 1 && coords[0][0] === coord2[0] && coords[0][1] === coord2[1]) {
        // clicked first
        coords.push(coord2)
        this.state.drawing.getGeometry().setCoordinates(coords)
        this.finish()
      } else if (coords.length > 1 && coords[coords.length -1][0] === coord2[0] && coords[coords.length -1][1] === coord2[1]) {
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
    const coord1 = this.state.measureType === 'circle' ?
      coords[0] :
      coords[coords.length - 1]
    const coord2 = this.getSnappedCoordinate(
      e.coordinate,
      this.state.snapFeatures.getArray(),
      this.state.snapTolerance
    )
    this.state.sketch.getGeometry().setCoordinates([coord1, coord2])
    if (this.state.measureType === 'circle') {
      const r = this.getCoordinatesDistance(coord1, coord2)
      this.state.circle.getGeometry().setRadius(r)
      this.updateCircleResults()
    } else {
      const arr = coords.slice(0)
      arr.push(coord2)
      this.state.measureLine.setCoordinates(arr)
      this.el.find('div').html(`
        ${t('Length')}: ${formatLength(this.state.measureLine)}<br>
        ${t('Area')}: ${t('to finish, click on beginning')}
      `)
    }
  }
  finish () {
    this.disableClick()
    this.state.sketch.getGeometry().setCoordinates([])
    this.updateResults()
    this.state.map.addInteraction(this.interaction.modify)
    this.interaction.snap = new Snap({features: this.state.snapFeatures})
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
    lon += Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat), Math.cos(distance/R)-Math.sin(lat)*Math.sin(lat))
    // Coords back to degrees and return
    return fromLonLat([radToDeg(lon), radToDeg(lat)])
  }
  getCoordinatesDistance (coord1, coord2) {
    const a = Math.abs(coord1[0]-coord2[0])
    const b = Math.abs(coord1[1]-coord2[1])
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
