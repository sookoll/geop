import {app as appConf} from 'Conf/settings'
import {getState, setState} from 'Utilities/store'
import {t, getLocale, getLocales, changeLocale} from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'

class Settings extends Component {
  constructor (target) {
    super(target)
    this.id = 'settings-tab'

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
      <h5>${t('Account')}</h5>
      <div class="form-group mb-3">
        <input type="text"
          class="form-control"
          id="account"
          placeholder="${t('Username')}"
          value="${getState('app/account') || ''}">
        <small class="form-text text-muted">${t('Enter geopeitus.ee username')}</small>
      </div>
    `)
    this.el.on('click', 'button.set-locale-btn', e => {
      changeLocale($(e.currentTarget).data('locale'))
      this.el.find('button.set-locale-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    this.el.on('blur', '#account', e => {
      setState('app/account', e.target.value, true)
    })
  }
}

export default Settings
