import {getState, setState, clearState} from 'Utilities/store'
import {enableScreenLock, disableScreenLock, getDebugStore} from 'Utilities/util'
import {t, getLocale, getLocales, changeLocale} from 'Utilities/translate'
import { set as setPermalink } from 'Utilities/permalink'
import log from 'Utilities/log'
import Component from 'Geop/Component'
import $ from 'jquery'
import saveAs from 'file-saver';

class Config extends Component {
  constructor (target) {
    super(target)
    this.id = 'settings-tab'
    this.icon = 'fa fa-cog'
    this.el = $(`<div class="tab-pane fade ${this.id === getState('app/sideBarTab') ? 'show active' : ''}" id="${this.id}" role="tabpanel"></div>`)
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
      <div class="btn-group" role="group">
        ${getLocales().map(locale => {
          return `
            <button type="button"
              class="btn btn-outline-primary set-locale-btn ${getLocale() === locale ? 'active' : ''}"
              data-locale="${locale}">
              ${locale}
            </button>`
        }).join('')}
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Change language. App will reload after change!')}
      </small>
      <h5>${t('Keep awake')}</h5>
      <div class="btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-outline-secondary">
          <input type="checkbox" id="settings-awake" autocomplete="off">
          <i class="fa fa-mobile-alt"></i>
          <span>${t('Off')}</span>
        </label>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Keep screen on. Use with caution, might train device battery!')}
      </small>
      <h5>${t('Account')}</h5>
      <div class="form-group">
        <input type="text"
          class="form-control"
          id="settings-account"
          placeholder="${t('Username')}"
          value="${getState('app/account') || ''}">
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Enter geopeitus.ee or geocaching.com username. App will reload after change!')}
      </small>
      <h5>${t('Share only geotrip features')}</h5>
      <div class="btn-group" role="group">
        <button type="button"
          class="btn btn-outline-primary set-share-btn ${getState('app/shareOnlyTripFeatures') ? 'active' : ''}"
          data-share="on">
          ${t('On')}
        </button>
        <button type="button"
          class="btn btn-outline-primary set-share-btn ${getState('app/shareOnlyTripFeatures') ? '' : 'active'}"
          data-share="off">
          ${t('Off')}
        </button>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Share only features added to geotrip.')}<br/>
        ${t('NB! Turning this off and sharing bookmark will store possibly big amount of data in service. It might fail. Use with caution!')}
      </small>
      <h5>${t('Reset app')}</h5>
      <div>
        <button
          id="settings-reset"
          class="btn btn-warning">
          <i class="fa fa-sync-alt"></i>
          ${t('Reset')}
        </a>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Reset app to default. App will reload!')}
      </small>
      ${getState('app/debug') ? `
      <h5>${t('Debug')}</h5>
      <div class="mb-3">
        <button
          id="download-log"
          class="btn btn-danger">
          <i class="fa fa-download"></i>
          ${t('Download debug log')}
        </a>
        <input type="file" style="display:none;" />
      </div>
      ` : ''}
    `)
    // language change
    this.el.on('click', 'button.set-locale-btn', e => {
      changeLocale($(e.currentTarget).data('locale'))
      this.el.find('button.set-locale-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
      log('warning', t('Language changed, page will reload!'), () => {
        window.location.reload()
      })
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
      log('warning', t('Account changed, page will reload!'), () => {
        window.location.reload()
      })
    })
    // share change
    this.el.on('click', 'button.set-share-btn', e => {
      setState('app/shareOnlyTripFeatures', $(e.currentTarget).data('share') === 'on' ? true : false, true)
      this.el.find('button.set-share-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    // reset app
    this.el.on('click', '#settings-reset', e => {
      clearState()
      log('warning', t('App resetted, page will reload!'), () => {
        setPermalink(null, null, ' ')
        window.location.reload()
      })
    })
    // download debug log file
    this.el.on('click', '#download-log', e => {
      const logs = getDebugStore()
      const blob = new window.Blob([logs.join('\n')], {type: "text/plain;charset=utf-8"})
      saveAs(blob, getState('app/debugFile'))
    })
  }
}

export default Config
