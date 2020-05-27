import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import './OSMEdit.styl'

class OSMEdit extends Component {
  create () {
    this.el = this.$.create(`<a href="#" id="osm-edit" title="${t('Edit OSM here')}"></a>`)
    this.isRow = false
  }

  render () {
    this.el.innerHTML = '<i class="fa fa-edit"></i>'
    this.$.on('click', this.el, e => {
      e.preventDefault()
      const center = getState('map/center')
      const zoom = getState('map/zoom')
      window.open(apiUrls.ideditor + zoom + '/' + center[1] + '/' + center[0])
    })
  }
}

export default OSMEdit
