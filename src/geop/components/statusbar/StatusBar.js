import { getState } from 'Utilities/store'
import Component from 'Geop/Component'
import SettingsBar from 'Components/settings/SettingsBar'
import ScaleLine from 'Components/scaleline/ScaleLine'
import FullScreen from 'Components/screen/FullScreen'
import ScreenLock from 'Components/screen/ScreenLock'
import MousePosition from 'Components/mouseposition/MousePosition'
import Bookmark from 'Components/bookmark/Bookmark'
import RoutingInfo from 'Components/routing/RoutingInfo'
import Measure from 'Components/measure/Measure'
import { t } from 'Utilities/translate'
import './StatusBar.styl'

class StatusBar extends Component {
  create () {
    this.state = {
      visibleMobile: 'scaleline'
    }
    this.el = this.$.create('<footer id="statusbar" class="panel-bar"></footer>')
  }

  render () {
    this.$.html(this.el, `<div id="settingsbar" class="slot btn-group float-left"></div>
      <div id="mouseposition" class="slot slot-xs-block float-left d-none d-lg-block"></div>
      <div id="routinginfo" class="slot slot-xs-block float-left d-none d-lg-block"></div>
      <div id="measure" class="slot slot-xs-block float-left d-none d-lg-block"></div>
      <div id="screen" class="slot btn-group float-right">
        <div class="btn-group dropup d-block d-lg-none">
          <button type="button"
            class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
            data-toggle="dropdown">
          </button>
          <div class="dropdown-menu dropdown-menu-right"></div>
        </div>
      </div>
      <div id="bookmark" class="slot float-right d-none d-lg-block"></div>
      <div id="scaleline" class="slot float-right d-none d-lg-block"></div>`)
  }

  createComponents () {
    const opts = {
      toggle: key => this.toggleMobileVisible(key)
    }
    this.toggleComponents = {
      scaleline: getState('app/scaleLine') && new ScaleLine(this.$.get('#scaleline', this.el), opts),
      bookmark: getState('app/shareState') && new Bookmark(this.$.get('#bookmark', this.el), opts),
      mouseposition: getState('app/mousePosition') && new MousePosition(this.$.get('#mouseposition', this.el), opts),
      routinginfo: getState('app/routing') && new RoutingInfo(this.$.get('#routinginfo', this.el), opts),
      measure: getState('app/measureTool') && new Measure(this.$.get('#measure', this.el), opts)
    }
    this.components = Object.assign({}, this.toggleComponents, {
      settings: getState('app/settings') && new SettingsBar(this.$.get('#settingsbar', this.el)),
      screenlock: getState('app/screenLock') && new ScreenLock(this.$.get('#screen', this.el)),
      fullscreen: getState('app/fullScreen') && new FullScreen(this.$.get('#screen', this.el))
    })
  }

  renderComponents () {
    this.$.html(this.$.get('#screen .dropdown-menu', this.el), `
      ${Object.keys(this.toggleComponents).map(key => {
    return `<a class="dropdown-item" href="#" data-visible="${key}">
          <i class="far ${key === this.state.visibleMobile ? 'fa-dot-circle' : 'fa-circle'}"></i>
          ${t(key)}
        </a>`
  }).join('')}`)
    this.toggleMobileVisible(this.state.visibleMobile)
    this.$.get('#screen a[data-visible]', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        this.toggleMobileVisible(e.currentTarget.dataList.visible)
      })
    })
  }

  toggleMobileVisible (key) {
    const old = this.state.visibleMobile
    this.state.visibleMobile = key
    Object.keys(this.toggleComponents).forEach(k => {
      this.$.get(`#${k}`, this.el).classList.add('d-none', 'd-lg-block')
    })
    this.$.get(`#${key}`, this.el).classList.remove('d-none', 'd-lg-block')
    this.$.get('#screen a[data-visible] i', this.el, true).forEach(el => {
      el.classList.remove('fa-dot-circle')
      el.classList.add('fa-circle')
    })
    this.$.get(`#screen a[data-visible=${key}] i`, this.el).classList.remove('fa-circle')
    this.$.get(`#screen a[data-visible=${key}] i`, this.el).classList.add('fa-dot-circle')
    return old
  }
}

export default StatusBar
