import {app as appConf} from 'Conf/settings'
import translations from 'Conf/translations'
import {initLocale} from 'Utilities/translate'
//import log from 'Utilities/log'
//import {getState} from 'Utilities/store'
import {activatePermalink} from 'Utilities/permalink'
import Component from 'Geop/Component'
import MapEngine from 'Components/map/MapEngine'
import LayerManager from 'Components/layer/LayerManager'
import $ from 'jquery'

class Geop extends Component {
  constructor () {
    super()
    // set locale
    initLocale(appConf.locale, translations)

    if ('onhashchange' in window) {
      activatePermalink()
    }
    this.components = {
      map: new MapEngine(),
      lyrmngr: new LayerManager()
    }
    $('#toolbar').append(this.components.lyrmngr.render())
  }

}

export default Geop
