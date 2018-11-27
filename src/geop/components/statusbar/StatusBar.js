import Component from 'Geop/Component'
import SideBar from 'Components/sidebar/SideBar'
import ScaleLine from 'Components/scaleline/ScaleLine'
import FullScreen from 'Components/fullscreen/FullScreen'
import MousePosition from 'Components/mouseposition/MousePosition'
import $ from 'jquery'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<footer id="statusbar" class="panel-bar"></footer>`)
    this.create()
    this.components = {
      sidebar: new SideBar(this.el),
      fullscreen: this.$conf.app.fullScreen && new FullScreen(this.el),
      scaleline: this.$conf.app.scaleLine && new ScaleLine(this.el),
      mouseposition: this.$conf.app.mousePosition && new MousePosition(this.el)
    }
  }
}

export default StatusBar
