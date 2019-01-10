import Component from 'Geop/Component'
import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { uid } from 'Utilities/util'
import { createMarker } from 'Components/mouseposition/MousePosition'
import { createLayer } from 'Components/layer/LayerCreator'
import { toLonLat } from 'ol/proj'
import Polyline from 'ol/format/Polyline'
import $ from 'jquery'

class Routing extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<span class="float-right" id="scale-line"></span>`)
    this.xhr = null
    this.state = {
      from: null,
      to: null,
      route: null,
      retry: 3,
      contextmenu: {
        from: {
          content: `<i class="fas fa-directions text-success"></i> ${t('Directions from here')}`,
          onClick: (e, coord, feature) => {
            this.state.from = feature ? feature[1] : createMarker(coord)
            this.handleContextMenuItems()
            this.findRoute()
          },
          closeOnClick: true
        },
        to: {
          content: `<i class="fas fa-directions text-danger"></i> ${t('Directions to here')}`,
          onClick: (e, coord, feature) => {
            this.state.to = feature ? feature[1] : createMarker(coord)
            this.handleContextMenuItems()
            this.findRoute()
          },
          closeOnClick: true
        },
        done: {
          content: `<i class="fas fa-directions text-info"></i>
            ${t('Retry directions')}
            <button class="btn btn-link context-item-btn"><i class="fas fa-times"></i></button>`,
          onClick: (e, coord, feature) => {
            this.findRoute()
          },
          closeOnClick: true,
          onBtnClick: (e, coord, feature) => {
            this.clear()
            this.handleContextMenuItems()
          }
        }
      }
    }
    // set contextmenu
    this.handleContextMenuItems()
  }
  handleContextMenuItems () {
    const contextMenuItems = getState('map/contextmenu')
    Object.keys(this.state.contextmenu).forEach(key => {
      const idx = contextMenuItems.indexOf(this.state.contextmenu[key])
      if (idx > -1) {
        contextMenuItems.splice(idx, 1)
      }
    })
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
  findRoute () {
    if (!this.state.from || !this.state.to) {
      return false
    }
    const coordinates = [
      toLonLat(this.state.from.getGeometry().getCoordinates()).join(),
      toLonLat(this.state.to.getGeometry().getCoordinates()).join()
    ]
    if (this.xhr && typeof this.xhr.abort === 'function') {
      this.xhr.abort()
    }
    this.xhr = $.ajax({
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
        this.createRoute(response.routes[0].geometry)
      } else {
        log('error', t('Unable to find route: ' + response.code))
      }
    })
    .fail((request, textStatus) => {
      if (request.statusText === 'abort') {
        return
      }
      console.log(request, textStatus, this)
      log('error', t('Unable to find route: ' + textStatus))
    })
  }
  createRoute (polyline) {
    if (!this.state.layer) {
      this.state.layer = this.createLayer()
      this.state.layer.setMap(getState('map'))
    }
    const route = new Polyline({
      factor: 1e5
    }).readFeature(polyline, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    this.state.layer.getSource().addFeature(route)
  }
  clear () {
    this.state.from = null
    this.state.to = null
    this.state.route = null
    if (this.state.layer) {
      this.state.layer.setMap(null)
      this.state.layer.getSource().clear()
      this.state.layer = null
    }
  }
  createLayer () {
    const conf = {
      type: 'FeatureCollection',
      id: uid(),
      title: 'Route',
      style: [{
        stroke: {
          color: '#fff',
          width: 5
        }
      }, {
        stroke: {
          color: '#0ff',
          width: 3
        }
      }]
    }
    return createLayer(conf)
  }
}

export default Routing
