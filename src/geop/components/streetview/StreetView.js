import { apiUrls } from 'Conf/settings'
import { getState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import Component from 'Geop/Component'
import { toLonLat } from 'ol/proj'
import $ from 'jquery'

class StreetView extends Component {
  constructor (target) {
    super(target)
    // set contextmenu
    const contextMenuItems = getState('map/contextmenu')
    contextMenuItems.push({
      content: `<i class="fa fa-street-view size-1_1"></i> ${t('Street view')}`,
      onClick: (e, coord) => {
        const formatted = toLonLat(coord).slice(0, 2).reverse().join(',')
        $('<a>').attr('href', apiUrls.google.streetview + formatted).attr('target', '_blank')[0].click()
      }
    })
  }
}

export default StreetView
