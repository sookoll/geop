import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import './OSMEdit.styl'
import $ from 'Utilities/dom'

class OSMEdit extends Component {
  constructor (target) {
    super(target)
    this.el = $.create(`<a href="#" id="osm-edit" title="${t('Edit OSM here')}"></a>`)
    this.isRow = false
    // create is called from parent
  }
  render () {
    this.el.innerHTML = '<i class="fa fa-edit"></i>'
    $.on('click', this.el, e => {
      e.preventDefault()
      const center = getState('map/center')
      const zoom = getState('map/zoom')
      window.open(apiUrls.ideditor + zoom + '/' + center[1] + '/' + center[0])
    })
  }
}

export default OSMEdit
