import Component from 'Geop/Component'
import Settings from 'Components/settings/Settings'
import $ from 'jquery'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<footer id="statusbar" class="panel-bar"></footer>`)
    this.create()
    this.components = {
      settings: new Settings(this.el)
    }
  }
}

export default StatusBar
