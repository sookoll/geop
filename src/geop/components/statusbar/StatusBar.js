import Component from 'Geop/Component'
import SideBar from 'Components/sidebar/SideBar'
import ScaleLine from 'Components/scaleline/ScaleLine'
import FullScreen from 'Components/fullscreen/FullScreen'
import MousePosition from 'Components/mouseposition/MousePosition'
import $ from 'jquery'
import {app as appConf} from 'Conf/settings'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<footer id="statusbar" class="panel-bar"></footer>`)
    this.create()
    this.components = {
      sidebar: new SideBar(this.el),
      fullscreen: appConf.fullScreen && new FullScreen(this.el),
      scaleline: appConf.scaleLine && new ScaleLine(this.el),
      mouseposition: appConf.mousePosition && new MousePosition(this.el)
    }
  }
}

export default StatusBar
