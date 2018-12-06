import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import Info from './Info'
import Config from './Config'
import $ from 'jquery'

class SettingsBar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-left" id="sidebar-open"></div>`)
    this.create()
    this.sidebar = new Sidebar({
      trigger: this.el.find('button'),
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
      this.render()
    }
  }
  render () {
    this.el.html(`
      <button type="button"
        class="btn btn-secondary">
        <i class="fa fa-ellipsis-h"></i>
      </button>
    `)
  }
}

export default SettingsBar
