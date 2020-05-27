import { geocache as cacheConf } from 'Conf/settings'
import { t } from 'Utilities/translate'
import log from 'Utilities/log'
import { getState } from 'Utilities/store'
import { uid, hexToRgbA } from 'Utilities/util'
import { createLayer } from 'Components/layer/LayerCreator'
import { checkCaches, importCaches } from 'Components/geocache/Geocache'
import Component from 'Geop/Component'

class GeocacheLoader extends Component {
  create () {
    this.id = 'tab-loader'
    this.icon = 'fa fa-cloud-download-alt'
    this.el = this.$.create(`<div
      class="tab-pane fade show active"
      id="${this.id}"
      role="tabpanel">
    </div>`)
  }

  render () {
    this.$.html(this.el, `
      <ul class="list-group mb-3">
        <li class="list-group-item">
          <span class="badge badge-pill badge-secondary">1</span>
          ${t('Go to')}
          <a href="${cacheConf.authUrl}" target="geopeitus">geopeitus.ee</a>
          ${t('and log in')},
        </li>
        <li class="list-group-item">
          <span class="badge badge-pill badge-secondary">2</span>
          ${t('download GPX from')}
          <a href="${cacheConf.downloadUrl.page}" target="geopeitus">${t('here')}</a>
          ${t('and drop it on map or import file from layers menu')}
          <div class="alert alert-light" role="alert">
            ${t('Quick links')}<br/>
            ${Object.keys(cacheConf.downloadUrl.gpx).map(key => {
    return `<a href="${cacheConf.downloadUrl.gpx[key]}">${t(key)}</a>`
  }).join('<br/>')}
          </div>
        </li>
        <li class="list-group-item">
          <span class="badge badge-pill badge-secondary">3</span>
          ${t('or open')}
          <a href="${cacheConf.downloadUrl.geojson}" target="geopeitus">link</a>
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
    const textarea = this.$.get('textarea', this.el)
    this.$.on('input', textarea, e => {
      const val = e.target.value.trim()
      this.$.get('button.confirm', this.el).disabled = val.length === 0
    })
    this.$.on('keyup', textarea, e => {
      if (e.keyCode === 13) {
        if (e.target.value.trim().length > '{"type":"Feature"}'.length) {
          this.addCaches(e.target.value.trim())
          e.target.value = ''
          this.$.trigger('input', e.target)
        }
      }
    })
    this.$.on('click', this.$.get('button.confirm', this.el), e => {
      this.addCaches(textarea.value.trim())
      textarea.value = ''
      this.$.trigger('input', textarea)
    })
  }

  addCaches (content) {
    let json = null
    content = this.fixme(content)
    const debug = getState('app/debug')
    try {
      json = JSON.parse(content)
      if (json.type !== 'FeatureCollection' || !json.features) {
        throw new Error('Not valid GeoJSON')
      }
    } catch (e) {
      log('error', t(e.message))
      if (debug) {
        console.debug('GeocacheLoader.addCaches: error ' + JSON.stringify(e))
      }
    }
    if (json) {
      const layer = this.createLayer(json)
      const features = layer.getSource().getFeatures()
      // if caches, then add to cache layer, else create new layer
      if (checkCaches(features)) {
        importCaches(features)
      } else {
        getState('map/layer/layers').push(layer)
        log('success', `${t('Added')} ${json.features.length} ${t('features')}`)
        if (debug) {
          console.debug('GeocacheLoader.addCaches: added ' + json.features.length)
        }
      }
    }
  }

  fixme (content) {
    // FIXME: temporary hack to fix known json falses
    return content
      .replace('Männiku "NAVY"', 'Männiku &quot;NAVY&quot;')
      .replace('Seikluse "Pärnu villad" boonusaare', 'Seikluse &quot;Pärnu villad&quot; boonusaare')
      .replace('SPA 36: "Inetu kuusepoeg"', 'SPA 36: &quot;Inetu kuusepoeg&quot;')
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
