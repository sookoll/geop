import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import SettingsBar from 'Components/settings/SettingsBar'
import ScaleLine from 'Components/scaleline/ScaleLine'
import FullScreen from 'Components/screen/FullScreen'
import ScreenLock from 'Components/screen/ScreenLock'
import MousePosition from 'Components/mouseposition/MousePosition'
import Bookmark from 'Components/bookmark/Bookmark'
import Navigation from 'Components/routing/Navigation.js'
import $ from 'jquery'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<footer id="statusbar" class="panel-bar"></footer>`)
    this.create()
    this.components = {
      settings: getState('app/settings') && new SettingsBar(this.el),
      fullscreen: getState('app/fullScreen') && new FullScreen(this.el),
      screenlock: getState('app/screenLock') && new ScreenLock(this.el),
      bookmark: getState('app/shareState') && new Bookmark(this.el),
      scaleline: getState('app/scaleLine') && new ScaleLine(this.el),
      mouseposition: getState('app/mousePosition') && new MousePosition(this.el),
      navigation: getState('app/routing') && new Navigation(this.el)
    }
  }
}

export default StatusBar
