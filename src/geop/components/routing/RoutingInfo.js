import Component from 'Geop/Component'
import { setState, onchange } from 'Utilities/store'
import { clear } from './Routing'
import './RoutingInfo.styl'

class Navigation extends Component {
  constructor (opts) {
    super(opts)
    this.toggleFn = opts.toggle
  }

  create () {
    this.id = 'routinginfo'
    this.el = this.$.create(`<span class="text-center d-none">
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
    onchange('routing/info', data => {
      if (!this.state.active && data) {
        this.activate()
      }
      if (!data) {
        this.deactivate()
      } else {
        this.$.html(this.$.get('span', this.el), data)
      }
    })
  }

  render () {
    this.$.on('click', this.$.get('button', this.el), e => {
      clear()
      setState('routing/stops', [])
      setState('routing/info', null)
      setState('navigate/to', null)
    })
  }

  activate (feature) {
    this.state.prev = this.toggleFn(this.id)
    this.el.classList.remove('d-none')
    this.state.active = true
  }

  deactivate () {
    this.toggleFn(this.state.prev)
    this.el.classList.add('d-none')
    this.$.html(this.$.get('span', this.el), '')
    this.state.active = false
  }
}

export default Navigation
