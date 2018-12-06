import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import $ from 'jquery'

class GeocacheLoader extends Component {
  constructor (target) {
    super(target)
    this.id = 'tab-loader'
    this.icon = 'fa fa-cloud-download-alt'
    this.el = $(`
      <div
        class="tab-pane fade show active"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.create()
  }
  render () {
    this.el.html(`
      <h5>${t('Load geocaches')}</h5>
      <ul class="list-group mb-3">
        <li class="list-group-item">
          <span class="badge badge-pill badge-info">1</span>
          ${t('Go to')}
          <a href="${cacheConf.auth_url}" target="geopeitus">geopeitus.ee</a>
          ${t('and log in')}
        </li>
        <li class="list-group-item">
          <span class="badge badge-pill badge-info">2</span>
          ${t('Download GPX from')}
          <a href="${cacheConf.download_url}" target="geopeitus">here</a>
          ${t('and drop it on map or import file from layers menu')}
        </li>
        <li class="list-group-item">
          <span class="badge badge-pill badge-info">3</span>
          ${t('or open')}
          <a href="${cacheConf.features_url}" target="geopeitus">link</a>
          ${t('and copy page content to textbox')}
        </li>
      </ul>
      <div class="mb-3">
        <textarea class="form-control" rows="6"></textarea>
      </div>
      <button disabled
        type="button"
        class="btn btn-secondary confirm">
        ${t('Add geocaches to map')}
      </button>
    `)
    this.el.on('click', 'button.confirm', e => {
      const txt = this.el.find('textarea')
      this.addCaches(txt.val().trim())
      txt.val('')
    })
  }
  addCaches (content) {
    let json = null
    content = this.fixme(content)
    try {
      json = JSON.parse(content)
    } catch (err) {
      log('error', t('Not valid GeoJSON'))
    }
    if (json) {
      const layer = this.createLayer(json)
      getState('map/layer/layers').push(layer)
      log('success', `${t('Added')} ${json.features.length} ${t('features')}`)
    }
  }
  fixme (content) {
    // FIXME: temporary hack to fix known json false
    return content.replace('"NAVY"', 'NAVY')
  }
}

export default GeocacheLoader
