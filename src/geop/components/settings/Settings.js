//import {app as appConf} from 'Conf/settings'
//import {getState, setState} from 'Utilities/store'
import {t, getLocale, getLocales, changeLocale} from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'
import './Settings.styl'

class Settings extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-left" id="settings-open"></div>`)
    this.shadow = $(`<div id="settings-shadow" class=""></div>`)
    this.sidebar = $(`<nav id="settings-sidebar" class=""></nav>`)
    this.state = {

    }
    this.create()
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      $('body')
        .append(this.sidebar)
        .append(this.shadow)
      this.render()
    }
  }
  render () {
    this.el.html(`
      <button type="button"
        title="${t('Settings')}"
        class="btn btn-secondary">
        <i class="fa fa-ellipsis-h"></i>
      </button>
    `)
    this.sidebar.html(`
      <div class="sidebar-header">
        <button type="button" class="close">
          <i class="fa fa-times"></i>
        </button>
        <h3>${t('Settings')}</h3>
      </div>
      <div class="sidebar-content">
        <h5>${t('Language')}</h5>
        <div class="btn-group" role="group" aria-label="Basic example">
          ${getLocales().map(locale => {
            return `
              <button type="button"
                class="btn btn-secondary set-locale-btn ${getLocale() === locale ? 'active' : ''}"
                data-locale="${locale}">
                ${locale}
              </button>`
          }).join('')}
        </div>

      </div>
    `)
    this.el.on('click', 'button', e => {
      this.openSidebar()
    })
    this.sidebar.on('click', '.sidebar-header button', e => {
      this.closeSidebar()
    })
    this.sidebar.on('click', 'button.set-locale-btn', e => {
      changeLocale($(e.currentTarget).data('locale'))
      this.sidebar.find('button.set-locale-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
  }

  openSidebar () {
    this.sidebar.addClass('active')
    this.shadow.addClass('active')
  }

  closeSidebar () {
    this.sidebar.removeClass('active')
    this.shadow.removeClass('active')
  }
}

export default Settings
