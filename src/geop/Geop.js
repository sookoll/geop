import {app as appConf} from 'Conf/settings'
import translations from 'Conf/translations'
import {initLocale} from 'Utilities/translate'
//import log from 'Utilities/log'
//import {getState} from 'Utilities/store'
import {activatePermalink} from 'Utilities/permalink'
//import $ from 'jquery'
import Component from 'Geop/Component'
import MapEngine from 'Components/map/MapEngine'
import ToolBar from 'Components/toolbar/ToolBar'
import './Geop.styl'

class Geop extends Component {
  constructor (target) {
    super(target)
    // set locale
    initLocale(appConf.locale, translations)

    if ('onhashchange' in window) {
      activatePermalink()
    }
    this.components = {
      map: new MapEngine(this.target),
      toolbar: new ToolBar(this.target)
    }
  }

  render () {

  }

  init() {
    this.render()
    this.components.map.init()
  }

}

export default Geop
