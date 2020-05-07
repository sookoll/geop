import Component from 'Geop/Component'
import { t } from 'Utilities/translate'
import { enableScreenLock, disableScreenLock } from 'Utilities/util'
import $ from 'jquery'

class FullScreen extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<button type="button"
      title="${t('Toggle screen lock')}"
      disabled
      class="btn btn-secondary">
      <i class="fa fa-desktop"></i>
    </button>`)
    this.state = {
      active: false
    }
    this.create()
  }
  render () {
    if (this.test()) {
      this.el.prop('disabled', false)
      this.el.on('click', e => {
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
    this.el.addClass('active')
    enableScreenLock()
  }
  off () {
    this.state.active = false
    this.el.removeClass('active')
    disableScreenLock()
  }
}

export default FullScreen
