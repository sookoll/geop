import Component from 'Geop/Component'
import { setState, onchange } from 'Utilities/store'
import { clear } from './Routing'
import $ from 'jquery'
import './RoutingInfo.styl'

class Navigation extends Component {
  constructor (target, opts) {
    super(target, opts)
    this.id = 'routinginfo'
    this.el = $(`<span class="text-center d-none">
      <i class="fas fa-location-arrow"></i>
      <span></span>
      <button class="btn btn-link">
        <i class="fas fa-times"></i>
      </button>
    </span>`)
    this.state = {
      active: false,
      prev: null
    }
    this.toggleFn = opts.toggle
    this.create()
    onchange('routing/info', data => {
      if (!this.state.active && data) {
        this.activate()
      }
      if (!data) {
        this.deactivate()
      } else {
        this.el.find('span').html(data)
      }
    })
  }
  render () {
    this.el.on('click', 'button', e => {
      clear()
      setState('routing/stops', [])
      setState('routing/info', null)
      setState('navigate/to', null)
    })
  }
  activate (feature) {
    this.state.prev = this.toggleFn(this.id)
    this.el.removeClass('d-none')
    this.state.active = true
  }
  deactivate () {
    this.toggleFn(this.state.prev)
    this.el.addClass('d-none')
    this.el.find('span').html('')
    this.state.active = false
  }
}

export default Navigation
