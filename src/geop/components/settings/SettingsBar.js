import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import Info from './Info'
import Config from './Config'

class SettingsBar extends Component {
  create () {
    this.el = this.$.create(`<button type="button"
      class="btn btn-secondary">
    </button>`)
  }

  render () {
    this.$.html(this.el, '<i class="fa fa-ellipsis-h"></i>')
  }

  createComponents () {
    this.sidebar = new Sidebar({
      target: this.$.get('#geop'),
      trigger: this.el,
      position: 'left',
      components: {
        Info,
        Config
      },
      activeComponent: getState('app/settingsTabOpen'),
      shadow: true
    })
    // this.$.append(this.$.get('body'), this.sidebar)
    // this.$.append(this.$.get('body'), this.shadow)
  }
}

export default SettingsBar
