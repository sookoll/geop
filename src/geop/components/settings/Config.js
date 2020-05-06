import { getState, setState, clearState } from 'Utilities/store'
import { getDebugStore } from 'Utilities/util'
import { t, getLocale, getLocales, changeLocale } from 'Utilities/translate'
import { set as setPermalink } from 'Utilities/permalink'
import log from 'Utilities/log'
import { reloadApp } from 'Root'
import Component from 'Geop/Component'
import $ from 'jquery'
import saveAs from 'file-saver'
import './Config.styl'

class Config extends Component {
  constructor (target) {
    super(target)
    this.id = 'settings-tab'
    this.icon = 'fa fa-cog'
    this.el = $(`
      <div
        class="tab-pane fade ${this.id === getState('app/settingsTabOpen') ? 'show active' : ''}"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
    this.create()
  }
  create () {
    if (this.target && this.el) {
      this.target.append(this.el)
      this.render()
    }
  }
  render () {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    this.el.html(`
      <div class="install mb-3">
        <button
          id="install"
          class="btn btn-danger btn-lg btn-block">
          <i class="fa fa-plus"></i>
          ${t('Install app to home screen')}
        </button>
        <small class="form-text text-muted">
          ${t('Install web app to your home screen.')}
        </small>
      </div>
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
      <h5>${t('Account')}</h5>
      <div class="form-group">
        <input type="text"
          class="form-control"
          id="settings-account"
          placeholder="${t('Username')}"
          value="${getState('app/account') || ''}"/>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Enter geopeitus.ee or geocaching.com username. App will reload after change!')}
      </small>
      <h5>${t('Search')}</h5>
      <div class="form-group">
        <input type="text"
          class="form-control"
          id="settings-search"
          placeholder="${t('Country codes')}"
          value="${getState('app/nominatimCountries') || ''}"/>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Limit address search with comma separated list of country codes (ee,fi - Estonia, Finland). Empty means no limit.')}
      </small>
      <h5>${t('Routing')}</h5>
      <div class="form-group">
        <select
          class="form-control"
          id="settings-routing">
          <option value="" ${routingProfile === '' ? 'selected' : ''}>${t('Disabled')}</option>
          <option value="driving" ${routingProfile === 'driving' ? 'selected' : ''}>${t('Driving')}</option>
          <option value="hiking" ${routingProfile === 'hiking' ? 'selected' : ''}>${t('Hiking')}</option>
        </select>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Select routing profile or disable routing')}
      </small>
      <div class="btn-group" role="group">
        <button type="button"
          class="btn btn-outline-primary set-route-btn ${getState('routing/infoFromRoute') ? 'active' : ''}"
          data-share="on">
          ${t('On')}
        </button>
        <button type="button"
          class="btn btn-outline-primary set-route-btn ${getState('routing/infoFromRoute') ? '' : 'active'}"
          data-share="off">
          ${t('Off')}
        </button>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Show distance and duration along route, not from beginning to end')}
      </small>
      <!-- Cache import -->
      <h5>${t('Geocache importing')}</h5>
      <div class="btn-group" role="group">
        <button type="button"
          class="btn btn-outline-primary set-cacheimport-btn ${getState('cache/import/appendLayer') ? '' : 'active'}"
          data-import="overwrite">
          ${t('Overwrite')}
        </button>
        <button type="button"
          class="btn btn-outline-primary set-cacheimport-btn ${getState('cache/import/appendLayer') ? 'active' : ''}"
          data-import="append">
          ${t('Append')}
        </button>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Set a method, how cache import works.')}<br/>
        ${t('Overwrite will delete old geocaches when import new caches from file.')}
        ${t('Append will add new geocaches without deleting old ones.')}
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
        </button>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Reset app to default. App will reload!')}
      </small>
      <h5>${t('Debug')}</h5>
      <div class="btn-group" role="group">
        <button type="button"
          class="btn btn-outline-primary set-debug-btn ${getState('app/debug') ? 'active' : ''}"
          data-debug="on">
          ${t('On')}
        </button>
        <button type="button"
          class="btn btn-outline-primary set-debug-btn ${getState('app/debug') ? '' : 'active'}"
          data-debug="off">
          ${t('Off')}
        </button>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Debug mode. Will write debug logs into file. App will reload after change!')}
      </small>
      ${getState('app/debug') ? `
      <div class="mb-3">
        <button
          id="download-log"
          class="btn btn-danger">
          <i class="fa fa-download"></i>
          ${t('Download debug log')}
        </button>
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
        reloadApp()
      })
      if (getState('app/debug')) {
        console.debug(`Config.render: Locale changed to ${$(e.currentTarget).data('locale')}`)
      }
    })
    // account name
    this.el.on('blur', '#settings-account', e => {
      if (e.target.value.trim() !== getState('app/account')) {
        setState('app/account', e.target.value.trim(), true)
        log('warning', t('Account changed, page will reload!'), () => {
          reloadApp()
        })
        if (getState('app/debug')) {
          console.debug(`Config.render: Account changed to ${e.target.value.trim()}`)
        }
      }
    })
    // search limit
    this.el.on('blur', '#settings-search', e => {
      if (e.target.value.trim() !== getState('app/nominatimCountries')) {
        setState('app/nominatimCountries', e.target.value.trim(), true)
        if (getState('app/debug')) {
          console.debug(`Config.render: Search limit changed to ${e.target.value}`)
        }
      }
    })
    // routing
    this.el.on('change', '#settings-routing', e => {
      const routingProfile = (typeof getState('routing/profile') !== 'undefined')
        ? getState('routing/profile') : getState('app/routing').profile
      if (e.target.value.trim() !== routingProfile) {
        setState('routing/profile', e.target.value.trim(), true)
        if (getState('app/debug')) {
          console.debug(`Config.render: Routing changed to ${e.target.value}`)
        }
      }
    })
    // routing
    this.el.on('click', 'button.set-route-btn', e => {
      setState('routing/infoFromRoute', $(e.currentTarget).data('share') === 'on', true)
      this.el.find('button.set-route-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    // cache import
    this.el.on('click', 'button.set-cacheimport-btn', e => {
      setState('cache/import/appendLayer', $(e.currentTarget).data('import') === 'append', true)
      this.el.find('button.set-cacheimport-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    // share change
    this.el.on('click', 'button.set-share-btn', e => {
      setState('app/shareOnlyTripFeatures', $(e.currentTarget).data('share') === 'on', true)
      this.el.find('button.set-share-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
    })
    // reset app
    this.el.on('click', '#settings-reset', e => {
      clearState()
      log('warning', t('App resetted, page will reload!'), () => {
        setPermalink(null)
        reloadApp()
      })
      if (getState('app/debug')) {
        console.debug(`Config.render: App resetted`)
      }
    })
    // debug change
    this.el.on('click', 'button.set-debug-btn', e => {
      setState('app/debug', $(e.currentTarget).data('debug') === 'on', true)
      this.el.find('button.set-debug-btn').removeClass('active')
      $(e.currentTarget).addClass('active')
      log('warning', t('Debug changed, app will reload!'), () => {
        reloadApp()
      })
      if (getState('app/debug')) {
        console.debug(`Config.render: Debug changed to ${$(e.currentTarget).data('debug')}`)
      }
    })
    // download debug log file
    this.el.on('click', '#download-log', e => {
      const logs = getDebugStore()
      const blob = new window.Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, getState('app/debugFile'))
    })
    let deferredPrompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      deferredPrompt = e
      this.el.find('.install').show()
    })
    this.el.on('click', '#install', e => {
      this.el.find('.install').hide()
      deferredPrompt.prompt()
      deferredPrompt.userChoice
        .then(choiceResult => {
          if (choiceResult.outcome === 'accepted') {
            if (getState('app/debug')) {
              console.debug(`Config.render: User accepted the A2HS prompt`)
            }
          } else {
            if (getState('app/debug')) {
              console.debug(`Config.render: User dismissed the A2HS prompt`)
            }
          }
          deferredPrompt = null
        })
    })
  }
}

export default Config
