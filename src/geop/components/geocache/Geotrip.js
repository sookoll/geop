import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import { getState, setState } from 'Utilities/store'
import { gpxExport } from 'Utilities/util'
import Component from 'Geop/Component'
import Collection from 'ol/Collection'
import { createLayer } from 'Components/layer/LayerCreator'
import Sortable from 'sortablejs'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import Feature from 'ol/Feature'
import { getLength } from 'ol/sphere'
import lineSliceAlong from '@turf/line-slice-along'
import $ from 'jquery'
import './Geotrip.styl'

class Geotrip extends Component {
  constructor (target, props) {
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
      collection: new Collection()
    }
    setState('geocache/trip', this.state.collection)
    getState('map/layer/layers').on('remove', e => {
      this.loadState()
    })
    getState('map/layer/overlays').on('remove', e => {
      this.loadState()
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
    this.el.html(`
      <ul class="list-group mb-3">
      ${this.state.collection.getLength() ?
        this.renderTrip(this.state.collection) :
        `<li class="list-group-item">
          <i class="fas fa-plus"></i>
          ${t('Add features from map')}
        </li>`}
      </ul>
      ${this.state.collection.getLength() ?
        `<div class="btn-group float-right" role="group">
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
      setState('geocache/trip/ids', this.state.collection.getArray().map(f => f.getId()), true)
    }
  }
  renderTrip (collection) {
    return collection.getArray().map((f, i) => {
      return `
        <li class="list-group-item sort-item" data-id="${f.getId()}">
          <button type="button" class="close" aria-label="${t('Close')}">
            <i class="fa fa-times"></i>
          </button>
          <span class="badge badge-pill badge-primary">${i+1}</span>
          <a href="#">${t(f.get('name'))}</a>
        </li>`
    }).join('')
  }
  initEvents () {
    // remove element
    this.el.on('click', 'li button.close', e => {
      this.remove($(e.currentTarget).closest('li').data('id'))
    })
    // zoom to
    this.el.on('click', 'li a', e => {
      e.preventDefault()
      this.zoomTo($(e.currentTarget).closest('li').data('id'))
    })
    // clear trip
    this.el.on('click', 'button.clear', e => {
      this.clearTrip()
    })
    // export trip
    this.el.on('click', 'a.export', e => {
      e.preventDefault()
      this.export()
    });
    // share trip
    this.el.on('click', 'button.share', e => {
      this.share()
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
  loadState () {
    const ids = getState('geocache/trip/ids')
    this.clearTrip()
    if (ids) {
      this.getTripFeaturesFromGroup(getState('map/layer/layers'), ids, this.state.collection)
      this.getTripFeaturesFromGroup(getState('map/layer/overlays'), ids, this.state.collection)
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
    const features = this.state.collection.getArray().map(f => {
      const clone = f.clone()
      clone.getGeometry().transform(getState('map/projection'), 'EPSG:4326')
      return clone
    })
    if (features.length > 1) {
      let coords = []
      this.state.routeLayer.getSource().getFeatures().forEach(f => {
        const clone = f.clone()
        coords = coords.concat(clone.getGeometry().getCoordinates())
      })
      features.push(new Feature(new LineString(coords).transform(getState('map/projection'), 'EPSG:4326')))
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
