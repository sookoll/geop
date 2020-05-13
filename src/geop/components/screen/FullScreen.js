import Component from 'Geop/Component'
import { t } from 'Utilities/translate'
import $ from 'jquery'

class FullScreen extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<button type="button"
      title="${t('Toggle fullscreen')}"
      disabled
      class="btn btn-secondary">
      <i class="fa fa-expand-arrows-alt"></i>
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
      $(document).on(
        'webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange',
        e => {
          this.toggleState()
        }
      )
    }
  }
  test () {
    if (document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.msFullscreenEnabled ||
      document.mozFullScreenEnabled) {
      return true
    }
    return false
  }
  toggle () {
    if (!this.state.active) {
      this.on()
    } else {
      this.off()
    }
  }
  toggleState () {
    if (document.fullscreenElement ||
      document.msFullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement) {
      this.state.active = true
      this.el.addClass('active')
    } else {
      this.state.active = false
      this.el.removeClass('active')
    }
  }
  on () {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen()
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen()
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(window.Element.ALLOW_KEYBOARD_INPUT)
    }
  }
  off () {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
}

export default FullScreen
