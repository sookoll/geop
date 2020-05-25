import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'Utilities/dom'
import './Info.styl'

class Info extends Component {
  constructor (target) {
    super(target)
    this.id = 'info-tab'
    this.icon = 'fa fa-info-circle'
    this.el = $.create(`
      <div
        class="tab-pane fade ${this.id === getState('app/settingsTabOpen') ? 'show active' : ''}"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.create()
  }
  render () {
    $.html(this.el, `
      <h5>
        Geop
        <i class="text-muted small">${window.geop.version}</i>
      </h5>
      <span class="attribution small">
        <a href="http://openstreetmap.org" >OSM</a> |
        <a href="http://www.maaamet.ee" >maa-amet</a> |
        <a href="http://sookoll.ee" >oo</a>
      </span>
      <ul>
        <li>${t('Geop is progressive web application with partial offline support.')}</li>
        <li>${t('Install it to Your home screen.')}</li>
        <li>${t('Add any GPX, GeoJSON, KML files or WMS layers to map from layers menu or drag and drop file.')}</li>
        <li>${t('App will recognize if geocaches are added to map.')}</li>
        <li>${t('Filter and search caches on map.')}</li>
        <li>${t('Search and display coordinates in WGS, L-Est, UTM and MGRS system.')}</li>
        <li>${t('Find streetview link and measure tools from context menu.')}</li>
        <li>${t('Add caches and map objects to geotrip. Reorder geotrip.')}</li>
        <li>${t('Navigate to cache with two tracking mode')}</li>
        <li>${t('Driving directions between points or from your current location')}</li>
        <li>${t('Share snapshot of app state via link or QR-code. Download geotrip as GPX-file.')}</li>
      </ul>
      <h5>${t('Search coordinates')}</h5>
      <ul>
        <li>WGS'84: lat, lon; kk.nnnn; kk° mm.nnn; kk° mm' ss''</li>
        <li>L-EST'97: x, y; y, x</li>
        <li>UTM zone 34N: x, y; y, x</li>
        <li>UTM zone 35N: x, y; y, x</li>
        <li>MGRS</li>
      </ul>
    `)
  }
}

export default Info
