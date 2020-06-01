import { getState } from 'Utilities/store'
import { initLocale } from 'Utilities/translate'
import { initDebug } from 'Utilities/util'
import translations from 'Conf/translations'
import Component from 'Geop/Component'
import MapEngine from 'Components/map/MapEngine'
import Header from 'Components/header/Header'
import StatusBar from 'Components/statusbar/StatusBar'
import ToolBar from 'Components/toolbar/ToolBar'
import ContextMenu from 'Components/contextmenu/ContextMenu'
import StreetView from 'Components/streetview/StreetView'
import Tooltip from 'Components/featureinfo/Tooltip'
import Popup from 'Components/featureinfo/Popup'
import Routing from 'Components/routing/Routing'
import Navigation from 'Components/routing/Navigation'
import './Geop.styl'

class Geop extends Component {
  create () {
    // debug
    const debug = getState('app/debug')
    if (debug) {
      initDebug()
      console.debug('Debug mode enabled')
    }
    // set locale
    initLocale(getState('app/locale'), translations)
    if (debug) {
      console.debug('Locale: ' + getState('app/locale'))
    }
  }

  createComponents () {
    const target = this.target
    // components
    this.components = {
      map: new MapEngine({ target }),
      contextmenu: new ContextMenu(), // no target
      header: new Header({ target }),
      statusbar: new StatusBar({ target }),
      toolbar: new ToolBar({ target }),
      streetview: getState('app/streetView') && new StreetView({ target }),
      tooltip: getState('app/tooltip') && new Tooltip({ target }),
      popup: getState('app/featureInfo') && new Popup({ target }),
      routing: getState('app/routing') && new Routing({ target }),
      navigation: getState('app/routing') && new Navigation({ target })
    }
    this.components.map.init()
  }
}

export default Geop
