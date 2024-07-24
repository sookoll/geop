import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/SideBar'
import Info from './Info'
import Config from './Config'
import $ from 'jquery'

class SettingsBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<button type="button"
      class="btn btn-secondary">
      <i class="fa fa-ellipsis-h"></i>
    </button>`)
    this.create()
    this.sidebar = new Sidebar({
      target: $('#geop'),
      trigger: this.el,
      position: 'left',
      components: {
        Info,
        Config
      },
      activeComponent: getState('app/settingsTabOpen'),
      shadow: true
    })
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      $('body')
        .append(this.sidebar)
        .append(this.shadow)
    }
  }
}

export default SettingsBar
