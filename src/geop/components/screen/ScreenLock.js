import Component from 'Geop/Component'
import { t } from 'Utilities/translate'
import { enableScreenLock, disableScreenLock } from 'Utilities/util'
import $ from 'jquery'

class FullScreen extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-right" id="screenlock"></div>`)
    this.state = {
      active: false
    }
    this.create()
  }
  render () {
    this.el.html(`
      <button type="button"
        title="${t('Toggle screen lock')}"
        disabled
        class="btn btn-secondary">
        <i class="fa fa-desktop"></i>
      </button>
    `)
    if (this.test()) {
      this.el.find('button').prop('disabled', false)
      this.el.on('click', 'button', e => {
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
    this.el.find('button').addClass('active')
    enableScreenLock()
  }
  off () {
    this.state.active = false
    this.el.find('button').removeClass('active')
    disableScreenLock()
  }
}

export default FullScreen
