import {app as appConf} from 'Conf/settings'
import translations from 'Conf/translations'
import {initLocale} from 'Utilities/translate'
import {activatePermalink} from 'Utilities/permalink'
import Component from 'Geop/Component'
import MapEngine from 'Components/map/MapEngine'
import ToolBar from 'Components/toolbar/ToolBar'
import StatusBar from 'Components/statusbar/StatusBar'
import './Geop.styl'

class Geop extends Component {
  constructor (target) {
    super(target)
    // set locale
    initLocale(appConf.locale, translations, true, value => {
      console.log(value)
    })

    if ('onhashchange' in window) {
      activatePermalink()
    }
    this.components = {
      map: new MapEngine(this.target),
      toolbar: new ToolBar(this.target),
      statusbar: new StatusBar(this.target)
    }
  }
  init() {
    this.components.map.init()
  }

}

export default Geop
