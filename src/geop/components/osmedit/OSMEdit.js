import {app as appConf} from 'Conf/settings'
import {getState} from 'Utilities/store'
import {t} from 'Utilities/translate'
import Component from 'Geop/Component'
import {toLonLat} from 'ol/proj'
import './OSMEdit.styl'
import $ from 'jquery'

class OSMEdit extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <a href="#" id="osm-edit" title="${t('Edit OSM here')}">
        <i class="fa fa-edit"></i>
      </a>
    `)
    this.isRow = false
    this.create()
  }
  render (target) {
    this.target = target
    this.target.append(this.el)
    this.el.on('click', e => {
      e.preventDefault()
      const center = toLonLat(getState('map/view/center'))
      const zoom = getState('map/view/zoom')
      window.open(appConf.osm_ideditor_url + zoom + '/' + center[1] + '/' + center[0])
    })
  }
}

export default OSMEdit
