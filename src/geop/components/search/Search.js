import {map as mapConf} from 'Conf/settings'
import {t} from 'Utilities/translate'
import {getState} from 'Utilities/store'
import {uid, hexToRgbA} from 'Utilities/util'
//import log from 'Utilities/log'
import Component from 'Geop/Component'
import Coordinate from './Coordinate'
import {FeatureLayer} from 'Components/layer/LayerCreator'
import GeoJSONFormat from 'ol/format/GeoJSON'
import $ from 'jquery'
import './Search.styl'

class Search extends Component {
  constructor (target) {
    super(target)
    this.state = {
      layers: getState('map/layer/overlays'),
      results: [],
      open: false
    }
    this.providers = {
      coordinates: new Coordinate()
    }
    this.format = new GeoJSONFormat({
      featureProjection: mapConf.projection
    })
    this.render()
  }
  render () {
    const html = $(`
      <div id="search" class="input-group float-right">
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
      </div>`)
    this.target.append(html)
    this.el = this.target.find('#search')
    this.resultsEl = this.el.find('ul')
    this.el
      .find('.dropdown-toggle')
      .on('shown.bs.dropdown', () => {
        this.state.open = true
      })
      .on('hidden.bs.dropdown', () => {
        this.state.open = false
      })
      .on('click', e => {
        const val = $(e.target).val().trim()
        if (!this.state.results.length && val.length > 1) {
          this.search(val)
        }
      })
      this.el.find('input').on('keyup', e => {
        // clear
        if (this.state.results.length) {
          this.clear()
        }
        const val = $(e.target).val().trim()
        this.el.find('.dropdown-toggle').prop('disabled', (val.length < 1))
        if (e.keyCode === 13 && val.length > 1) {
          this.search(val)
        }
      })
  }
  renderResults () {
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
            ${result.properties.title}
          </a>
        </li>`)
    })
    this.resultsEl.html(htmlArr.join(''))
    if (this.state.open) {
      this.el.find('.dropdown-toggle').dropdown('toggle')
      this.state.open = false
    }
    this.handleFeatures()
  }
  clear () {
    Object.keys(this.providers).forEach(key => {
      this.providers[key].clear()
    })
    this.state.results = []
    this.renderResults()
  }
  search (query) {
    let counter = 0
    this.searchStart()
    Object.keys(this.providers).forEach(key => {
      counter++
      this.providers[key].find(query, (title, results) => {
        this.state.results = this.state.results.concat(results)
        this.state.open = true
        this.renderResults()
        counter--
        if (counter <= 0) {
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
    if (!this.state.layer) {
      this.state.layer = this.createLayer()
      this.state.layers.push(this.state.layer)
    }
    this.state.layer.getSource().clear()
    const features = this.state.results.map(item => {
      return this.format.readFeature(item)
    })
    this.state.layer.getSource().addFeatures(features)
  }

  createLayer () {
    const color = '#000000'
    const conf = {
      id: uid(),
      title: 'Search',
      style: {
        stroke: {
          color: color,
          width: 2
        },
        fill: {
          color: hexToRgbA(color, 0.5)
        },
        image: {
          stroke: {
            color: color
          },
          fill: {
            color: hexToRgbA(color, 0.3)
          }
        }
      }
    }
    return new FeatureLayer(conf)
  }



}

export default Search
