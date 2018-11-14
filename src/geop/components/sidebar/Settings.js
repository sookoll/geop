import {app as appConf} from 'Conf/settings'
import {getState, setState} from 'Utilities/store'
import {enableScreenLock, disableScreenLock} from 'Utilities/util'
import {t, getLocale, getLocales, changeLocale} from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'

class Settings extends Component {
  constructor (target) {
    super(target)
    this.id = 'settings-tab'
    this.icon = 'fa fa-cog'
    this.el = $(`<div class="tab-pane fade ${this.id === appConf.sideBarTab ? 'show active' : ''}" id="${this.id}" role="tabpanel"></div>`)
    this.create()
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      this.render()
    }
  }
  render () {
    this.el.html(`
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
      <h5>${t('Keep awake')}</h5>
      <div class="btn-group-toggle mb-3" data-toggle="buttons">
        <label class="btn btn-outline-secondary">
          <input type="checkbox" id="settings-awake" autocomplete="off">
          <i class="fa fa-mobile-alt"></i>
          <span>${t('Off')}</span>
        </label>
      </div>
      <h5>${t('Account')}</h5>
      <div class="form-group mb-3">
        <input type="text"
          class="form-control"
          id="settings-account"
          placeholder="${t('Username')}"
          value="${getState('app/account') || ''}">
        <small class="form-text text-muted">${t('Enter geopeitus.ee username')}</small>
      </div>
    `)
    // language change
    this.el.on('click', 'button.set-locale-btn', e => {
      changeLocale($(e.currentTarget).data('locale'))
      this.el.find('button.set-locale-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    // keep awake
    this.el.on('change', '#settings-awake', e => {
      if (e.target.checked) {
        enableScreenLock()
        $(e.target).closest('label').find('span').html(t('On'))
      } else {
        disableScreenLock()
        $(e.target).closest('label').find('span').html(t('Off'))
      }
      $(e.target).closest('label').toggleClass('btn-outline-secondary btn-success')
    })
    // account name
    this.el.on('blur', '#settings-account', e => {
      setState('app/account', e.target.value, true)
    })
  }
}

export default Settings
