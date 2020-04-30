import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { getState, setState } from 'Utilities/store'
import { gpxExport, formatDate, formatTime } from 'Utilities/util'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import { findRoute, optimize } from 'Components/routing/Routing'
import Collection from 'ol/Collection'
import { createLayer } from 'Components/layer/LayerCreator'
import Sortable from 'sortablejs'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import Feature from 'ol/Feature'
import { toLonLat } from 'ol/proj'
import { getLength } from 'ol/sphere'
import lineSliceAlong from '@turf/line-slice-along'
import $ from 'jquery'
import './Geotrip.styl'

class Geotrip extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-geotrip'
    this.icon = 'fa fa-thumbtack'
    this.btnTextVisible = true
    this.el = $(`
      <div
        class="tab-pane fade"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.state = {
      tab: null,
      routeLayer: null,
      layers: getState('map/layer/layers'),
      collection: new Collection(),
      init: false
    }
    setState('geocache/trip', this.state.collection)
    getState('map/layer/layers').on('remove', e => {
      // disable loadState when remove layer for reordering
      if (!getState('ui/layermanager/sorting')) {
        this.loadState()
      }
    })
    getState('map/layer/overlays').on('remove', e => {
      // disable loadState when remove layer for reordering
      if (!getState('ui/layermanager/sorting')) {
        this.loadState()
      }
    })
    this.state.collection.on('add', e => {
      // allow only points
      if (e.element.getGeometry() instanceof Point) {
        e.element.set('_inGeotrip', true)
        this.render()
      } else {
        this.state.collection.remove(e.element)
      }
    })
    this.state.collection.on('remove', e => {
      e.element.set('_inGeotrip', false)
      this.render()
    })
    this.create()
    this.initEvents()
    const map = getState('map')
    if (map) {
      this.loadState()
    } else {
      const que = getState('map/que')
      que.push(map => {
        this.loadState()
      })
    }
  }
  render () {
    const found = this.state.collection.getArray().filter(f => {
      return !!f.get('fstatus_timestamp') && f.get('fstatus') === 'Found'
    })
    this.el.html(`
      <ul class="list-group mb-3">
      ${this.state.collection.getLength()
    ? this.renderTrip(this.state.collection)
    : `<li class="list-group-item">
          <i class="fas fa-plus"></i>
          ${t('Add features from map')}
        </li>`}
      </ul>
      ${this.state.collection.getLength()
    ? `<div class="dropdown sort">
          <button class="btn btn-link dropdown-toggle"
            type="button"
            id="geotripSort"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false">
            <i class="fas fa-sort-amount-down"></i>
          </button>
          <div class="dropdown-menu" aria-labelledby="geotripSort">
            <a class="dropdown-item sortby-found ${found.length ? '' : 'disabled'}" href="#">${t('Found')}</a>
            <a class="dropdown-item sortby-routing" href="#">${t('Optimize')}</a>
          </div>
        </div>
        <button type="button" class="btn btn-link routing">
          <i class="fas fa-directions"></i> ${t('Routing')}
        </button>
        <div class="btn-group float-right" role="group">
          <a role="button" class="btn btn-secondary export" title="${t('Download')}">
            <i class="fas fa-download"></i> GPX
          </a>
          <button type="button" class="btn btn-secondary clear" title="${t('Clear trip')}">
            <i class="fas fa-trash"></i>
          </button>
        </div>` : ''}
    `)
    this.state.tab && this.state.tab.find('span').html(this.state.collection.getLength() || t('Geotrip'))
    if (this.state.collection.getLength()) {
      // route
      if (!this.state.routeLayer) {
        this.state.routeLayer = this.createLayer()
        this.state.routeLayer.setMap(getState('map'))
      }
      this.state.routeLayer.getSource().clear()
      const fset = this.state.collection.getArray().map(f => f.getGeometry().getCoordinates())
      const coords = []
      if (fset.length > 1) {
        for (let i = 0, len = fset.length; i < len; i++) {
          if (i !== len - 1) {
            coords[i] = [fset[i], fset[i + 1]]
          } else {
            coords[i - 1][1] = fset[i]
          }
        }
        coords.forEach(coord => {
          this.state.routeLayer.getSource().addFeature(new Feature(new LineString(coord)))
        })
      }
      // sortable
      Sortable.create(this.el.find('ul')[0], {
        draggable: 'li.sort-item',
        handle: '.badge',
        onUpdate: e => {
          this.reorderTrip()
          this.render()
        }
      })
    }
    if (this.state.init) {
      setState('geocache/trip/ids',
        this.state.collection.getArray().map(f => f.getId()), true)
      setState('geocache/trip/found',
        found.map(f => {
          return {
            id: f.getId(),
            fstatus: f.get('fstatus'),
            timestamp: f.get('fstatus_timestamp')
          }
        }), true)
    }
    this.state.init = true
  }
  renderTrip (collection) {
    return collection.getArray().map((f, i) => {
      return `
        <li class="list-group-item sort-item" data-id="${f.getId()}">
          <button type="button" class="close" aria-label="${t('Close')}">
            <i class="fa fa-times"></i>
          </button>
          <span class="badge badge-pill badge-primary">${i + 1}</span>
          <a href="#">${t(f.get('name'))}</a>
          <i class="fas fa-circle fstatus ${f.get('fstatus') === 'Found' ? 'found' : ''}"></i>
          ${f.get('fstatus_timestamp')
    ? `<div class="text-muted small timestamp">
              ${t('Found')}:
              ${formatDate(f.get('fstatus_timestamp'), true) + ' ' +
              formatTime(f.get('fstatus_timestamp'))}</div>` : ''}
        </li>`
    }).join('')
  }
  initEvents () {
    // remove element
    this.el.on('click', 'li button.close', e => {
      e.preventDefault()
      this.remove($(e.currentTarget).closest('li').data('id'))
    })
    // zoom to
    this.el.on('click', 'li a', e => {
      e.preventDefault()
      this.zoomTo($(e.currentTarget).closest('li').data('id'))
    })
    // clear trip
    this.el.on('click', 'button.clear', e => {
      e.preventDefault()
      this.clearTrip()
    })
    // export trip
    this.el.on('click', 'a.export', e => {
      e.preventDefault()
      this.export()
    })
    // order trip by found date
    this.el.on('click', 'a.sortby-found', e => {
      e.preventDefault()
      this.sortByFound()
    })
    // order trip by routing
    this.el.on('click', 'a.sortby-routing', e => {
      e.preventDefault()
      this.sortByRouting()
    })
    // routing
    this.el.on('click', 'button.routing', e => {
      e.preventDefault()
      this.routing()
    })
  }
  reorderCollection (collection, order) {
    for (let i = 0, len = order.length; i < len; i++) {
      const feature = collection.getArray().filter(f => f.getId() === order[i])
      if (feature && feature[0]) {
        collection.remove(feature[0])
        collection.insertAt(i, feature[0])
      }
    }
  }
  reorderTrip () {
    const order = []
    this.el.find('li.sort-item').each((i, li) => {
      order.push($(li).data('id'))
    })
    this.reorderCollection(this.state.collection, order)
  }
  sortByFound () {
    function compare (a, b) {
      if (a.timestamp < b.timestamp) { return -1 }
      if (a.timestamp > b.timestamp) { return 1 }
      return 0
    }
    const found = getState('geocache/trip/found')
    found.sort(compare)
    this.reorderCollection(this.state.collection, found.map(item => item.id))
  }
  sortByRouting () {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    if (routingProfile) {
      const position = getState('map/geolocation/position')
      const locations = this.state.collection.getArray().map(f => toLonLat(f.getGeometry().getCoordinates()))
      let start = locations[0]
      let end = locations[locations.length - 1]
      if (position) {
        start = toLonLat(position)
      }
      optimize(start, end, locations)
        .then(route => {
          const order = route.steps
            .filter(item => item.type === 'job')
            .map(item => {
              const f = this.state.collection.getArray()[item.job]
              return f.getId()
            })
          this.reorderCollection(this.state.collection, order)
          log('success', t('Geotrip reordered by optimum path'))
        })
        .catch(e => {
          console.error(e)
          log('error', t('Unable to determine ordering'))
        })
    } else {
      log('error', t('Routing disabled'))
    }
  }
  routing () {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    if (routingProfile) {
      const position = getState('map/geolocation/position')
      const locations = this.state.collection.getArray().map(f => toLonLat(f.getGeometry().getCoordinates()))
      if (position) {
        locations.unshift(toLonLat(position))
      }
      findRoute(locations, true)
        .then(route => {

        })
        .catch(e => log('error', t('Unable to find route') + e))
    } else {
      log('error', t('Routing disabled'))
    }
  }
  loadState () {
    const ids = getState('geocache/trip/ids')
    const found = getState('geocache/trip/found')
    this.clearTrip()
    if (ids) {
      this.getTripFeaturesFromGroup(getState('map/layer/layers'), ids, this.state.collection)
      this.getTripFeaturesFromGroup(getState('map/layer/overlays'), ids, this.state.collection)
      found && this.state.collection.forEach(f => {
        const foundItem = found.filter(item => item.id === f.getId())[0]
        if (foundItem) {
          f.set('fstatus', foundItem.fstatus)
          f.set('fstatus_timestamp', foundItem.timestamp)
        }
      })
      this.reorderCollection(this.state.collection, ids)
    }
  }
  getTripFeaturesFromGroup (group, test, target) {
    group.getArray()
      .filter(l => {
        return (l.get('conf') && l.get('conf').type === 'FeatureCollection')
      })
      .forEach(l => {
        l.getSource().forEachFeature(f => {
          if (test.indexOf(f.getId()) > -1) {
            target.push(f)
          }
        })
      })
  }
  clearTrip () {
    this.state.routeLayer && this.state.routeLayer.getSource().clear()
    this.state.collection.clear()
  }
  remove (id) {
    const feature = this.state.collection.getArray().filter(f => f.getId() === id)
    if (feature && feature[0]) {
      this.state.collection.remove(feature[0])
    }
  }
  zoomTo (id) {
    const feature = this.state.collection.getArray().filter(f => f.getId() === id)
    if (feature && feature[0]) {
      getState('map').getView().animate({
        center: feature[0].getGeometry().getCoordinates(),
        zoom: 15,
        duration: 500
      })
    }
  }
  export () {
    let coords = []
    const features = this.state.collection.getArray().map(f => {
      const clone = f.clone()
      clone.getGeometry().transform(getState('map/projection'), 'EPSG:4326')
      coords.push(clone.getGeometry().getCoordinates())
      return clone
    })
    if (features.length > 1) {
      features.push(new Feature(new LineString(coords)))
    }
    gpxExport(cacheConf.exportFileName, features)
  }
  createLayer () {
    const view = getState('map').getView()
    const proj = getState('map/projection')
    return createLayer({
      type: 'FeatureCollection',
      title: 'Route',
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      style: (feature, resolution, factory) => {
        const geom = feature.getGeometry()
        const distance = (6 * view.getResolution()) / 1000
        const length = getLength(geom) / 1000
        const clone = geom.clone().transform(proj, 'EPSG:4326')
        if (length - (2 * distance) > distance) {
          const trimLine = lineSliceAlong({
            type: 'LineString',
            coordinates: clone.getCoordinates()
          }, distance, length - (distance * 1.5))
          clone.setCoordinates(trimLine.geometry.coordinates)
          clone.transform('EPSG:4326', proj)
          const coords = clone.getCoordinates()
          const dx = coords[coords.length - 1][0] - coords[coords.length - 2][0]
          const dy = coords[coords.length - 1][1] - coords[coords.length - 2][1]
          const rotation = Math.atan2(dy, dx)
          return [
            factory({
              stroke: {
                color: 'white',
                width: 5
              },
              geometry: clone
            }),
            factory({
              stroke: {
                color: 'rgba(0, 0, 0, 0.6)',
                width: 3
              },
              geometry: clone
            }),
            factory({
              shape: {
                fill: {
                  color: 'rgba(0, 0, 0, 0.6)'
                },
                stroke: {
                  color: 'white',
                  width: 1
                },
                points: 3,
                radius: 8,
                rotateWithView: true,
                rotation: -rotation,
                angle: 33
              },
              geometry: new Point(clone.getLastCoordinate())
            })
          ]
        }
        return null
      }
    })
  }
}

export default Geotrip
