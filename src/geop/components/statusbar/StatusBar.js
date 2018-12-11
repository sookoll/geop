import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import SettingsBar from 'Components/settings/SettingsBar'
import ScaleLine from 'Components/scaleline/ScaleLine'
import FullScreen from 'Components/fullscreen/FullScreen'
import MousePosition from 'Components/mouseposition/MousePosition'
import Bookmark from 'Components/bookmark/Bookmark'
import $ from 'jquery'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<footer id="statusbar" class="panel-bar"></footer>`)
    this.create()
    this.components = {
      settings: new SettingsBar(this.el),
      fullscreen: getState('app/fullScreen') && new FullScreen(this.el),
      bookmark: getState('app/shareState') && new Bookmark(this.el),
      scaleline: getState('app/scaleLine') && new ScaleLine(this.el),
      mouseposition: getState('app/mousePosition') && new MousePosition(this.el)
    }
  }
}

export default StatusBar
