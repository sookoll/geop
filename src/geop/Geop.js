import {app as appConf} from 'Conf/settings'
import translations from 'Conf/translations'
import {getState, onchange} from 'Utilities/store'
import {initLocale} from 'Utilities/translate'
import {activatePermalink} from 'Utilities/permalink'
import Component from 'Geop/Component'
import MapEngine from 'Components/map/MapEngine'
import Header from 'Components/header/Header'
import StatusBar from 'Components/statusbar/StatusBar'
import ToolBar from 'Components/toolbar/ToolBar'
import ContextMenu from 'Components/contextmenu/ContextMenu'
import StreetView from 'Components/streetview/StreetView'
import Measure from 'Components/measure/Measure'
import './Geop.styl'

class Geop extends Component {
  constructor (target) {
    super(target)
    // set locale
    initLocale(getState('locale') || appConf.locale, translations, true)
    // listen locale change
    onchange('locale', (value) => {
      window.location.reload()
    })

    if ('onhashchange' in window) {
      activatePermalink()
    }
    this.components = {
      map: new MapEngine(this.target),
      contextmenu: new ContextMenu(this.target),
      header: new Header(this.target),
      statusbar: new StatusBar(this.target),
      toolbar: new ToolBar(this.target),
      streetview: appConf.streetview_url && new StreetView(this.target),
      measure: appConf.measureTool && new Measure(this.target)
    }
  }
  init() {
    this.components.map.init()
  }

}

export default Geop
