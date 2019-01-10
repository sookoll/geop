import Component from 'Geop/Component'
import { apiUrls } from 'Conf/settings'
import { getState, setState, onchange } from 'Utilities/store'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { uid } from 'Utilities/util'
import { createMarker } from 'Components/mouseposition/MousePosition'
import { createLayer } from 'Components/layer/LayerCreator'
import { toLonLat } from 'ol/proj'
import Polyline from 'ol/format/Polyline'
import $ from 'jquery'

let xhr = null
let routeLayer = null

class Routing extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<span class="float-right" id="scale-line"></span>`)
    this.state = {
      from: null,
      to: null,
      contextmenu: {
        from: {
          content: `<i class="fas fa-directions text-success size-1_1"></i> ${t('Directions from here')}`,
          onClick: (e, coord, feature) => {
            const fromFeature = feature ? feature[1] : createMarker(coord)
            this.state.from = fromFeature.getGeometry().getCoordinates()
            setState('routing/stops', [toLonLat(this.state.from), this.state.to && toLonLat(this.state.to)])
            this.findRoute()
          },
          closeOnClick: true
        },
        to: {
          content: `<i class="fas fa-directions text-danger size-1_1"></i> ${t('Directions to here')}`,
          onClick: (e, coord, feature) => {
            const toFeature = feature ? feature[1] : createMarker(coord)
            this.state.to = toFeature.getGeometry().getCoordinates()
            setState('routing/stops', [this.state.from && toLonLat(this.state.from), toLonLat(this.state.to)])
            this.findRoute()
          },
          closeOnClick: true
        },
        done: {
          content: `<i class="fas fa-directions text-info size-1_1"></i>
            ${t('Retry directions')}
            <button class="btn btn-link context-item-btn"><i class="fas fa-times"></i></button>`,
          onClick: (e, coord, feature) => {
            this.findRoute()
          },
          closeOnClick: true,
          onBtnClick: (e, coord, feature) => {
            this.clear()
          }
        }
      }
    }
    // set contextmenu
    this.handleContextMenuItems()
    onchange('routing/stops', () => {
      this.handleContextMenuItems()
    })
  }
  handleContextMenuItems () {
    const contextMenuItems = getState('map/contextmenu')
    Object.keys(this.state.contextmenu).forEach(key => {
      const idx = contextMenuItems.indexOf(this.state.contextmenu[key])
      if (idx > -1) {
        contextMenuItems.splice(idx, 1)
      }
    })
    if (routeLayer && routeLayer.getSource().getFeatures().length) {
      contextMenuItems.push(this.state.contextmenu.done)
    } else {
      if (!this.state.from) {
        contextMenuItems.push(this.state.contextmenu.from)
      }
      if (!this.state.to) {
        contextMenuItems.push(this.state.contextmenu.to)
      }
      if (this.state.from && this.state.to) {
        contextMenuItems.push(this.state.contextmenu.done)
      }
    }
  }
  findRoute () {
    const coords = getState('routing/stops')
    findRoute(coords).then(route => {
      const routeCoords = route.getGeometry().getCoordinates()
      routeCoords.unshift(this.state.from)
      routeCoords.push(this.state.to)
      route.getGeometry().setCoordinates(routeCoords)
    }).catch(e => {})
  }
  clear () {
    this.state.from = null
    this.state.to = null
    if (routeLayer) {
      routeLayer.setMap(null)
      routeLayer.getSource().clear()
      routeLayer = null
    }
    setState('routing/stops', [])
    setState('navigate/to', null)
  }
}

export function findRoute (coords) {
  if (routeLayer && routeLayer.getSource().getFeatures().length) {
    routeLayer.getSource().clear()
  }
  return new Promise((resolve, reject) => {
    const coordinates = coords.filter(lonLat => !!lonLat).map(lonLat => {
      return lonLat.slice(0, 2).join()
    })
    if (coordinates.length < 2) {
      throw new Error(t('Less than 2 pair of coordinates, aborting!'))
    }
    if (xhr && typeof xhr.abort === 'function') {
      xhr.abort()
    }
    xhr = $.ajax({
      type : 'GET',
      crossDomain : true,
      url : apiUrls.osrm + coordinates.join(';'),
      data: {
        overview: 'full'
      },
      dataType: 'json'
    })
    .done(response => {
      if (response.code === 'Ok') {
        const route = createRoute(response.routes[0].geometry)
        setState('routing/stops', coords)
        resolve(route)
      } else {
        log('error', t('Unable to find route') + ': ' + response.code)
        if (getState('app/debug')) {
          console.error('routing error', JSON.stringify(response))
        }
        reject(new Error(t('Unable to find route') + ': ' + response.code))
      }
    })
    .fail((request, textStatus) => {
      if (request.statusText === 'abort') {
        return
      }
      log('error', t('Unable to find route') + ': ' + (request.responseJSON ? request.responseJSON.message : textStatus))
      if (getState('app/debug')) {
        console.error('routing error', JSON.stringify(request))
      }
      reject(new Error(t('Unable to find route') + ': ' + (request.responseJSON ? request.responseJSON.message : textStatus)))
    })
  })
}

function createRoute (polyline) {
  if (!routeLayer) {
    routeLayer = layerCreate()
    routeLayer.setMap(getState('map'))
  }
  const route = new Polyline({
    factor: 1e5
  }).readFeature(polyline, {
    dataProjection: 'EPSG:4326',
    featureProjection: getState('map/projection')
  })
  routeLayer.getSource().addFeature(route)
  return route
}

function layerCreate () {
  const conf = {
    type: 'FeatureCollection',
    id: uid(),
    zIndex: 99,
    title: 'Route',
    style: [{
      stroke: {
        color: 'rgba(255, 255, 255, 0.7)',
        width: 7
      }
    }, {
      stroke: {
        color: 'rgba(0, 133, 203, 1)',
        width: 3
      }
    }]
  }
  return createLayer(conf)
}

export function getLayer () {
  if (!routeLayer) {
    routeLayer = layerCreate()
    routeLayer.setMap(getState('map'))
  }
  return routeLayer
}

export default Routing
