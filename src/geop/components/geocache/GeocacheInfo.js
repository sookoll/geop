import { t } from 'Utilities/translate'
import { geocache as cacheConf } from 'Conf/settings'
import { getState, onchange } from 'Utilities/store'
import { formatDate } from 'Utilities/util'
import { parseString as parseCoords } from 'Components/search/Coordinate'
import { createMarker } from 'Components/mouseposition/MousePosition'
import { fromLonLat } from 'ol/proj'
import Component from 'Geop/Component'
import './GeocacheInfo.styl'
import $ from 'jquery'

class GeocacheInfo extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-cacheinfo'
    this.icon = 'fa fa-cube'
    this.btnTextVisible = true
    this.el = $(`
      <div
        class="tab-pane fade"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.state = {
      layer: null,
      cache: null,
      logType: {
        'Found it': 'found',
        "Didn't find it": 'notfound',
        'Needs Maintenance': 'problem'
      }
    }
    this.create()
    onchange('geocache/loadend', layer => {
      this.state.layer = layer
    })
    onchange('popup/show', ({ layerId, feature }) => {
      if (this.state.layer && this.state.layer.get('id') === layerId && feature.get('isCache')) {
        this.state.cache = feature
        this.render()
      }
    })
  }
  render () {
    this.el.html(`
      <ul class="list-group mb-3">
      ${(this.state.layer && this.state.layer.get('_featureInfo') && this.state.cache)
    ? this.renderCacheInfo()
    : `<li class="list-group-item">
          <i class="fas fa-plus"></i>
          ${t('Select geocache from map')}
        </li>`}
      </ul>
      ${(this.state.layer && this.state.cache)
    ? this.renderLogs() : ''}
    `)
    // fix all images
    this.el.find('img').addClass('img-fluid').css('height', 'auto')
    // fix coords links color, if parent have it (https://www.geopeitus.ee/aare/2583)
    this.el.find('a.createMarker').each((i, el) => {
      if ($(el).parent().attr('style')) {
        $(el).attr('style', $(el).parent().attr('style'))
      }
    })
    // click on coords
    this.el.find('a.createMarker').on('click', e => {
      e.preventDefault()
      this.mapCoordinates($(e.target).data('coordinates'), $(e.target).text())
    })
  }
  renderCacheInfo () {
    const info = this.state.layer.get('_featureInfo')
    const title = typeof info.title === 'function' ? info.title(this.state.cache) : info.title
    const content = typeof info.content === 'function' ? info.content(this.state.cache) : info.content
    const description = parseCoords(this.state.cache.get('description'))
    return `
      <li class="list-group-item header">
        ${title}
      </li>
      <li class="list-group-item content">
        ${content}
      </li>
      ${description ? `
        <li class="list-group-item description">
          ${description}
        </li>` : ''}`
  }
  renderLogs () {
    const logs = this.state.cache.get('logs') || []
    const cacheUrl = this.state.cache.get('url')
    const key = Object.keys(cacheConf.logUrl).find(key => cacheUrl.indexOf(key) > -1)
    const logUrl = cacheConf.logUrl[key].replace('{id}', this.state.cache.get('id'))

    return `
      <ul class="list-group mb-3">
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <b>${t('Logs')}</b> <a href="${logUrl}" target="_blank">${t('Add log')}</a>
        </li>
        ${logs.map(log => `
          <li class="list-group-item log">
          <i class="fas fa-circle fstatus ${this.state.logType[log.type] || ''}"></i>
            <b class="text-muted">
              ${formatDate(log.date)}
            </b>
            <b>${log.finder}</b>
            <br/>
            ${parseCoords(log.text)}
          </li>`).join('')}
      </ul>`
  }
  mapCoordinates (coords, name) {
    const map = getState('map')
    coords = fromLonLat(coords)
    createMarker(coords, { name })
    map.getView().animate({
      center: coords,
      zoom: 15,
      duration: 500
    })
  }
}

export default GeocacheInfo
