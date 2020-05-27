import Component from 'Geop/Component'
import { t } from 'Utilities/translate'
import { enableScreenLock, disableScreenLock } from 'Utilities/util'

class FullScreen extends Component {
  create () {
    this.el = this.$.create(`<button type="button"
      title="${t('Keep awake')}"
      disabled
      class="btn btn-secondary">
    </button>`)
    this.state = {
      active: false
    }
  }

  render () {
    this.el.innerHTML = '<i class="fa fa-desktop"></i>'
    if (this.test()) {
      this.el.disabled = false
      this.$.on('click', this.el, e => {
        e.preventDefault()
        this.toggle()
      })
    }
  }

  test () {
    return true
  }

  toggle () {
    if (!this.state.active) {
      this.on()
    } else {
      this.off()
    }
  }

  on () {
    this.state.active = true
    this.el.classList.add('active')
    enableScreenLock()
  }

  off () {
    this.state.active = false
    this.el.classList.remove('active')
    disableScreenLock()
  }
}

export default FullScreen
