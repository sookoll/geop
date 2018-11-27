import {apiUrls} from 'Conf/settings'
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
    // create is called from parent
  }
  render () {
    this.el.on('click', e => {
      e.preventDefault()
      const center = toLonLat(getState('map/view/center'))
      const zoom = getState('map/view/zoom')
      window.open(apiUrls.osm_ideditor + zoom + '/' + center[1] + '/' + center[0])
    })
  }
}

export default OSMEdit
