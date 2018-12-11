import { getState } from 'Utilities/store'
import { initLocale } from 'Utilities/translate'
import { activatePermalink } from 'Utilities/permalink'
import { initDebug } from 'Utilities/util'
import translations from 'Conf/translations'
import Component from 'Geop/Component'
import MapEngine from 'Components/map/MapEngine'
import Header from 'Components/header/Header'
import StatusBar from 'Components/statusbar/StatusBar'
import ToolBar from 'Components/toolbar/ToolBar'
import ContextMenu from 'Components/contextmenu/ContextMenu'
import StreetView from 'Components/streetview/StreetView'
import Measure from 'Components/measure/Measure'
import Tooltip from 'Components/featureinfo/Tooltip'
import Popup from 'Components/featureinfo/Popup'
import './Geop.styl'

class Geop extends Component {
  constructor (target) {
    super(target)
    // debug
    if (getState('app/debug')) {
      initDebug()
    }
    // set locale
    initLocale(getState('app/locale'), translations)

    // permalink
    if (getState('app/shareState') && 'onhashchange' in window) {
      activatePermalink()

    }

    this.components = {
      map: new MapEngine(this.target),
      contextmenu: new ContextMenu(this.target),
      header: new Header(this.target),
      statusbar: new StatusBar(this.target),
      toolbar: new ToolBar(this.target),
      streetview: getState('app/streetView') && new StreetView(this.target),
      measure: getState('app/measureTool') && new Measure(this.target),
      tooltip: getState('app/tooltip') && new Tooltip(this.target),
      popup: getState('app/featureInfo') && new Popup(this.target)
    }
  }
  init() {
    this.components.map.init()
  }

}

export default Geop
