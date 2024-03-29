import { t } from 'Utilities/translate'
import { getState } from 'Utilities/store'
import { uid, hexToRgbA } from 'Utilities/util'
// import log from 'Utilities/log'
import Component from 'Geop/Component'
import CoordinateProvider from './Coordinate'
import NominatimProvider from './Nominatim'
import FeatureProvider from './Feature'
import { createLayer } from 'Components/layer/LayerCreator'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { fromLonLat, transformExtent } from 'ol/proj'
import $ from 'jquery'
import './Search.styl'

class Search extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <div id="search" class="float-right">
        <button class="btn btn-secondary d-inline-block d-sm-none toggle" aria-label="${t('Search')}">
          <i class="fa fa-search"></i>
        </button>
        <div class="d-none d-sm-block">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="${t('Search')}">
            <div class="input-group-append fill-width">
              <button class="btn btn-secondary dropdown-toggle no-caret"
                type="button"
                data-toggle="dropdown"
                aria-expanded="true"
                disabled>
                <i class="fa fa-search"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-right scrollable-menu" role="menu"></ul>
            </span>
          </div>
        </div>
      </div>
    `)
    this.state = {
      results: [],
      open: false,
      query: null
    }
    this.providers = {
      coordinates: new CoordinateProvider(),
      features: new FeatureProvider(),
      nominatim: new NominatimProvider()
    }
    this.format = new GeoJSONFormat({
      featureProjection: getState('map/projection')
    })
    this.create()
  }
  create () {
    super.create()
    if (this.target && this.el) {
      this.resultsEl = this.el.find('ul')
      this.el.on('click', '.toggle', e => {
        this.el.find('>.toggle').toggleClass('d-none d-inline-block')
        this.el.find('>div').toggleClass('d-none')
      })
      this.el
        .find('.dropdown-toggle')
        .on('shown.bs.dropdown', () => {
          this.state.open = true
        })
        .on('hidden.bs.dropdown', () => {
          this.state.open = false
        })
        .on('click', e => {
          const val = this.el.find('input').val().trim()
          if (this.query !== val) {
            this.clear()
            this.search(val)
          }
        })
      this.el.find('input').on('keyup input', e => {
        const val = $(e.target).val().trim()
        this.el.find('.dropdown-toggle').prop('disabled', (val.length < 1))
        // clear
        if (!val.length) {
          this.clear()
        } else if (e.keyCode === 13) {
          this.clear()
          this.state.open = true
          this.search(val)
        }
      })
      this.resultsEl.on('click', '.clear', e => {
        this.clear()
        this.el.find('input').val('').trigger('keyup')
      })
      this.resultsEl.on('click', 'a', e => {
        e.preventDefault()
        e.stopPropagation()
        const map = getState('map')
        const id = $(e.currentTarget).attr('data-id')
        const item = this.state.results.filter(item => {
          return String(id) === String(item.id)
        })[0]
        if (item.bbox) {
          const bbox = transformExtent(item.bbox, 'EPSG:4326', getState('map/projection'))
          map.getView().fit(bbox, {
            padding: [50, 50, 50, 50],
            maxZoom: 17,
            duration: 500
          })
        } else {
          map.getView().animate({
            center: fromLonLat(item.geometry.coordinates),
            zoom: 15,
            duration: 500
          })
        }
      })
    }
  }
  render () {
    let provider = null
    const htmlArr = []
    this.state.results.forEach(result => {
      if (provider !== result.properties.provider) {
        htmlArr.push(`<li class="dropdown-header">${t(result.properties.provider)}</li>`)
        provider = result.properties.provider
      }
      htmlArr.push(`
        <li>
          <a href="#" class="dropdown-item"
            data-id="${result.id}" data-provider="${provider}">
            <i class="fa fa-map-marker-alt"></i>
            ${result.properties.name}
          </a>
        </li>`)
    })
    if (!htmlArr.length) {
      htmlArr.push(`
        <li class="dropdown-item">
          <i class="fa fa-frown"></i>
          ${t('No result')}
        </li>`)
    }
    htmlArr.push(`
      <div class="tools text-right">
        <button class="btn btn-link clear">
          <i class="fa fa-backspace"></i>
        </button>
        <button class="btn btn-link toggle d-inline-block d-sm-none" aria-label="${t('Close')}">
          <i class="fa fa-times"></i>
        </button>
      </div>`)
    this.el.find('.dropdown-toggle').dropdown('update')
    if (this.resultsEl) {
      this.resultsEl.html(htmlArr.join(''))
      if (this.state.open) {
        this.el.find('.dropdown-toggle').dropdown('toggle')
        this.state.open = false
      }
    }
    this.handleFeatures()
  }
  clear () {
    Object.keys(this.providers).forEach(key => {
      this.providers[key].clear()
    })
    this.state.results = []
    this.query = null
    this.render()
  }
  search (query) {
    const debug = getState('app/debug')
    this.query = query
    let counter = 0
    let stop = false
    this.searchStart()
    Object.keys(this.providers).some(key => {
      counter++
      this.providers[key].find(query)
        .then((results) => {
          if (!stop) {
            this.state.results = this.state.results.concat(results)
          }
          if (key === 'coordinates' && results.length) {
            stop = true
            counter = 1
          }
          if (debug) {
            console.debug(`Search.search: query: ${query}, results: ${results.length}`)
          }
        })
        .catch(e => {
          if (debug) {
            console.error(`Search.search: error: ${JSON.stringify(e)}`)
          }
        })
        .finally(() => {
          counter--
          if (counter === 0) {
            this.render()
            this.searchEnd()
          }
        })
    })
  }
  searchStart () {
    this.el.find('.dropdown-toggle i')
      .removeClass('fa-search')
      .addClass('fa-spinner fa-pulse')
  }

  searchEnd () {
    this.el.find('.dropdown-toggle i')
      .removeClass('fa-spinner fa-pulse')
      .addClass('fa-search')
  }

  handleFeatures () {
    if (this.state.results && this.state.results.length) {
      const layer = this.createLayer(this.query, this.state.results)
      getState('map/layer/overlays').push(layer)
    }
  }

  createLayer (title, features) {
    const color = '#000000'
    const conf = {
      type: 'FeatureCollection',
      id: uid(),
      title: `${t('Search')}: ${title}`,
      features: features,
      zIndex: 50,
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
            color: hexToRgbA('#fff', 0.5)
          },
          radius: 5
        }
      }
    }
    return createLayer(conf)
  }
}
export default Search
