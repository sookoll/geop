import { geocache as cacheConf, apiUrls } from 'Conf/settings'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { getState, setState, onchange } from 'Utilities/store'
import { getSessionState } from 'Utilities/session'
import { gpxExport, uid } from 'Utilities/util'
import Component from 'Geop/Component'
import Collection from 'ol/Collection'
import { createLayer } from 'Components/layer/LayerCreator'
import Sortable from 'sortablejs'
import LineString from 'ol/geom/LineString'
import Feature from 'ol/Feature'
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
      layers: props.collection,
      collection: new Collection(),
      route: new Feature(new LineString([]))
    }
    setState('geocache/trip', this.state.collection)
    this.state.layers.on('remove', e => {
      this.loadState()
    })
    this.state.collection.on('add', e => {
      this.render()
    })
    this.state.collection.on('remove', e => {
      this.render()
    })
    this.create()
    this.initEvents()
    onchange('geocache/loadend', (count) => {
      const map = getState('map')
      if (map) {
        this.loadState()
      } else {
        const que = getState('map/que')
        que.push(map => {
          this.loadState()
        })
      }
    })
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
          <button type="button" class="btn btn-secondary share" title="${t('Share trip')}">
            <i class="fas fa-share-alt"></i>
          </button>
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
        this.state.routeLayer.getSource().addFeature(this.state.route)
        this.state.routeLayer.setMap(getState('map'))
      }
      const coords = this.state.collection.getArray().map(f => {
        return f.getGeometry().getCoordinates()
      })
      this.state.route.getGeometry().setCoordinates(coords)
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
      return `<li class="list-group-item sort-item" data-id="${f.getId()}">
        <span class="badge badge-pill badge-primary">${i+1}</span>
        <a href="#">${f.get('name')}</a>
        <button type="button" class="close">
          <i class="fa fa-times"></i>
        </button>
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
  reorderTrip () {
    const order = []
    this.el.find('li.sort-item').each((i, li) => {
      order.push($(li).data('id'))
    })
    for (let i = 0, len = order.length; i < len; i++) {
      const feature = this.state.collection.getArray().filter(f => f.getId() === order[i])
      if (feature && feature[0]) {
        this.state.collection.remove(feature[0])
        this.state.collection.insertAt(i, feature[0])
      }
    }
  }
  loadState () {
    const ids = getState('geocache/trip/ids')
    this.clearTrip()
    if (ids) {
      this.state.layers.forEach(l => {
        l.getSource().forEachFeature(f => {
          if (ids.indexOf(f.getId()) > -1) {
            this.state.collection.insertAt(ids.indexOf(f.getId()), f)
          }
        })
      })
    }
  }
  clearTrip () {
    this.state.route.getGeometry().setCoordinates([])
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
      const clone = this.state.route.clone()
      clone.getGeometry().transform(getState('map/projection'), 'EPSG:4326')
      features.push(clone)
    }
    gpxExport(cacheConf.exportFileName, features)
  }
  share () {
    //https://dev.to/bauripalash/building-a-simple-url-shortener-with-just-html-and-javascript-16o4
    getSessionState()
      .then(appState => {
        const data = Object.assign({}, ...Object.keys(appState).map(k => ({[k.replace(/\//g, '_')]: appState[k]})))
        this.saveState(data)
          .then(bookmark => {
            console.log(bookmark)
          })
          .catch(e => {
            log('error', t(e))
          })
      })
      .catch(e => {
        log('error', t(e))
      })
  }
  createLayer () {
    return createLayer({
      type: 'FeatureCollection',
      title: 'Route',
      style: [{
        stroke: {
          color: 'rgba(255, 255, 255, 0.6)',
          width: 7
        }
      }, {
        stroke: {
          color: 'rgba(0, 0, 0, 0.3)',
          width: 5
        }
      }]
    })
  }
  saveState (data) {
    return new Promise((resolve, reject) => {
      if (this.xhr && typeof this.xhr.abort === 'function') {
        this.xhr.abort()
      }
      const hash = uid()
      this.xhr = $.ajax({
        type : 'POST',
        crossDomain : true,
        url : apiUrls.jsonstore + '/' + hash,
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        context: this
      })
      .done(data => {
        if (data && data.ok) {
          resolve(hash)
        } else {
          reject(new Error('Unable to save data'))
        }
      })
      .fail(request => {
        if (request.statusText === 'abort') {
          resolve(null)
        } else {
          reject(new Error('Unable to save data'))
        }
      })
    })

  }
}

export default Geotrip
