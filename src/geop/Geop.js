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
  render () {
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

    // components
    this.components = {
      map: new MapEngine(this.target),
      contextmenu: new ContextMenu(this.target),
      header: new Header(this.target),
      statusbar: new StatusBar(this.target),
      toolbar: new ToolBar(this.target),
      streetview: getState('app/streetView') && new StreetView(this.target),
      tooltip: getState('app/tooltip') && new Tooltip(this.target),
      popup: getState('app/featureInfo') && new Popup(this.target),
      routing: getState('app/routing') && new Routing(this.target),
      navigation: getState('app/routing') && new Navigation(this.target)
    }
    this.components.map.init()
  }
}

export default Geop
