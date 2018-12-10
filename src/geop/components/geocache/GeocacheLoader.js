import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { getState } from 'Utilities/store'
import { uid, hexToRgbA } from 'Utilities/util'
import { createLayer } from 'Components/layer/LayerCreator'
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
      <ul class="list-group mb-3">
        <li class="list-group-item">
          <span class="badge badge-pill badge-primary">1</span>
          ${t('Go to')}
          <a href="${cacheConf.auth_url}" target="geopeitus">geopeitus.ee</a>
          ${t('and log in')},
        </li>
        <li class="list-group-item">
          <span class="badge badge-pill badge-primary">2</span>
          ${t('download GPX from')}
          <a href="${cacheConf.download_url.page}" target="geopeitus">${t('here')}</a>
          ${t('and drop it on map or import file from layers menu')}
          <div class="alert alert-light" role="alert">
            ${t('Quick links')}<br/>
            ${Object.keys(cacheConf.download_url.gpx).map(key => {
              return `<a href="${cacheConf.download_url.gpx[key]}" target="geopeitus">${t(key)}</a>`
            }).join('<br/>')}
          </div>
        </li>
        <li class="list-group-item">
          <span class="badge badge-pill badge-primary">3</span>
          ${t('or open')}
          <a href="${cacheConf.download_url.geojson}" target="geopeitus">link</a>
          ${t('and copy page content to textbox below')}
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
    this.el.find('textarea').on('input', e => {
      const val = this.el.find('textarea').val().trim()
      this.el.find('button.confirm').prop('disabled', val.length === 0)
    })
    this.el.find('textarea').on('keyup', e => {
      if (e.keyCode === 13) {
        const txt = this.el.find('textarea')
        this.addCaches(txt.val().trim())
        txt.val('').trigger('input')
      }
    })
    this.el.on('click', 'button.confirm', e => {
      const txt = this.el.find('textarea')
      this.addCaches(txt.val().trim())
      txt.val('').trigger('input')
    })
  }
  addCaches (content) {
    let json = null
    content = this.fixme(content)
    try {
      json = JSON.parse(content)
      if (json.type !== 'FeatureCollection' || !json.features) {
        throw new Error('Not valid GeoJSON')
      }
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
  createLayer (geojson) {
    const color = '#000000'
    geojson.features && geojson.features.forEach(f => {
      f.id = uid()
    })
    const conf = {
      type: 'FeatureCollection',
      id: uid(),
      title: 'Geocaches',
      features: geojson.features,
      style: {
        stroke: {
          color: color,
          width: 2
        },
        fill: {
          color: hexToRgbA(color, 0.5)
        },
        circle: {
          stroke: {
            color: color
          },
          fill: {
            color: hexToRgbA(color, 0.3)
          },
          radius: 5
        }
      }
    }
    return createLayer(conf)
  }
}

export default GeocacheLoader