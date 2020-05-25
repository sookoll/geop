import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import Sidebar from 'Components/sidebar/Sidebar'
import Info from './Info'
import Config from './Config'
import $ from 'Utilities/dom'

class SettingsBar extends Component {
  constructor (target) {
    super(target)
    this.el = $.create(`<button type="button"
      class="btn btn-secondary">
    </button>`)
    this.create()
    this.sidebar = new Sidebar({
      target: $.get('#geop'),
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
      $.append(this.target, this.el)
      $.append($.get('body'), this.sidebar)
      $.append($.get('body'), this.shadow)
    }
  }
  render () {
    $.html(this.el, '<i class="fa fa-ellipsis-h"></i>')
  }
}

export default SettingsBar
