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
import $ from 'jquery'
import './StatusBar.styl'

class StatusBar extends Component {
  constructor (target) {
    super(target)
    this.state = {
      visibleMobile: 'scaleline'
    }
    this.toggleComponents = {}
    this.el = $(`<footer id="statusbar" class="panel-bar">
      <div id="settingsbar" class="slot btn-group float-left"></div>
      <div id="mouseposition" class="slot float-left d-none d-sm-block"></div>
      <div id="routinginfo" class="slot float-left d-none d-sm-block"></div>
      <div id="measure" class="slot float-left d-none d-sm-block"></div>
      <div id="screen" class="slot btn-group float-right">
        <div class="btn-group dropup d-block d-sm-none">
          <button type="button"
            class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
            data-toggle="dropdown">
          </button>
          <div class="dropdown-menu dropdown-menu-right"></div>
        </div>
      </div>
      <div id="bookmark" class="slot float-right d-none d-sm-block"></div>
      <div id="scaleline" class="slot float-right d-none d-sm-block"></div>
    </footer>`)
    this.create()
    const opts = {
      toggle: key => this.toggleMobileVisible(key)
    }
    this.toggleComponents = {
      scaleline: getState('app/scaleLine') && new ScaleLine(this.el.find('#scaleline'), opts),
      bookmark: getState('app/shareState') && new Bookmark(this.el.find('#bookmark'), opts),
      mouseposition: getState('app/mousePosition') && new MousePosition(this.el.find('#mouseposition'), opts),
      routinginfo: getState('app/routing') && new RoutingInfo(this.el.find('#routinginfo'), opts),
      measure: getState('app/measureTool') && new Measure(this.el.find('#measure'), opts)
    }
    this.components = Object.assign({}, this.toggleComponents, {
      settings: getState('app/settings') && new SettingsBar(this.el.find('#settingsbar')),
      screenlock: getState('app/screenLock') && new ScreenLock(this.el.find('#screen')),
      fullscreen: getState('app/fullScreen') && new FullScreen(this.el.find('#screen'))
    })
    this.render()
  }
  render () {
    this.el.find('#screen .dropdown-menu').html(`
      ${Object.keys(this.toggleComponents).map(key => {
    return `<a class="dropdown-item" href="#" data-visible="${key}">
          <i class="far ${key === this.state.visibleMobile ? 'fa-dot-circle' : 'fa-circle'}"></i>
          ${t(key)}
        </a>`
  }).join('')}
      </div>
    </div>`)
    this.toggleMobileVisible(this.state.visibleMobile)
    this.el.find('#screen a[data-visible]').on('click', e => {
      this.toggleMobileVisible($(e.currentTarget).data('visible'))
    })
  }
  toggleMobileVisible (key) {
    const old = this.state.visibleMobile
    this.state.visibleMobile = key
    Object.keys(this.toggleComponents).forEach(key => {
      this.el.find(`#${key}`).addClass('d-none d-sm-block')
    })
    this.el.find(`#${key}`).removeClass('d-none d-sm-block')
    this.el.find('#screen a[data-visible] i').removeClass('fa-dot-circle').addClass('fa-circle')
    this.el.find(`#screen a[data-visible=${key} ]`).find('i').removeClass('fa-circle').addClass('fa-dot-circle')
    return old
  }
}

export default StatusBar
