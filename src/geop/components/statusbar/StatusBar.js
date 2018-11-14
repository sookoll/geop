import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import $ from 'jquery'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<footer id="statusbar" class="panel-bar"></footer>`)
    this.create()
    this.components = {
      sidebar: new Sidebar(this.el)
    }
  }
}

export default StatusBar
