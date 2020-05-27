import Component from 'Geop/Component'
import { t } from 'Utilities/translate'

class FullScreen extends Component {
  create () {
    this.el = this.$.create(`<button type="button"
      title="${t('Toggle fullscreen')}"
      disabled
      class="btn btn-secondary">
    </button>`)
    this.state = {
      active: false
    }
  }

  render () {
    this.el.innerHTML = '<i class="fa fa-expand-arrows-alt"></i>'
    if (this.test()) {
      this.el.disabled = false
      this.$.on('click', this.el, e => {
        e.preventDefault()
        this.toggle()
      })
      this.$.on('fullscreenchange', document, e => {
        this.toggleState()
      })
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

      this.el.classList.add('active')
    } else {
      this.state.active = false
      this.el.classList.remove('active')
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
