//import {app as appConf} from 'Conf/settings'
import {getState, setState} from 'Utilities/store'
import {t, getLocale, getLocales, changeLocale} from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'
import './SideBar.styl'

class Sidebar extends Component {
  constructor (target) {
    super(target)
    this.el = $(`<div class="btn-group float-left" id="sidebar-open"></div>`)
    this.shadow = $(`<div id="sidebar-shadow" class=""></div>`)
    this.sidebar = $(`<nav id="sidebar" class="bg-light"></nav>`)
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
        <div class="btn-group mb-3" role="group">
          ${getLocales().map(locale => {
            return `
              <button type="button"
                class="btn btn-outline-secondary set-locale-btn ${getLocale() === locale ? 'active' : ''}"
                data-locale="${locale}">
                ${locale}
              </button>`
          }).join('')}
        </div>
        <h5>${t('Account')}</h5>
        <div class="form-group mb-3">
          <input type="text"
            class="form-control"
            id="account"
            placeholder="${t('Username')}"
            value="${getState('app/account') || ''}">
          <small class="form-text text-muted">${t('Enter geopeitus.ee username')}</small>
        </div>
      </div>
    `)
    this.el.on('click', 'button', e => {
      this.openSidebar()
    })
    this.sidebar.on('click', '.sidebar-header button', e => {
      this.closeSidebar()
    })
    this.shadow.on('click', e => {
      this.closeSidebar()
    })
    this.sidebar.on('click', 'button.set-locale-btn', e => {
      changeLocale($(e.currentTarget).data('locale'))
      this.sidebar.find('button.set-locale-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    this.sidebar.on('blur', '#account', e => {
      setState('app/account', e.target.value, true)
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

export default Sidebar
