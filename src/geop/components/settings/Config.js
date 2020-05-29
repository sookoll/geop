import { getState, setState, clearState } from 'Utilities/store'
import { getDebugStore } from 'Utilities/util'
import { t, getLocale, getLocales, changeLocale } from 'Utilities/translate'
import { set as setPermalink } from 'Utilities/permalink'
import log from 'Utilities/log'
import { reloadApp } from 'Root'
import Component from 'Geop/Component'
import saveAs from 'file-saver'
import './Config.styl'

class Config extends Component {
  create () {
    this.id = 'settings-tab'
    this.icon = 'fa fa-cog'
    this.el = this.$.create(`
      <div
        class="tab-pane fade ${this.id === getState('app/settingsTabOpen') ? 'show active' : ''}"
        id="${this.id}"
        role="tabpanel">
      </div>
    `)
  }

  render () {
    const routingProfile = (typeof getState('routing/profile') !== 'undefined')
      ? getState('routing/profile') : getState('app/routing').profile
    this.$.html(this.el, `
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
          tabindex="-1"
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
          tabindex="-1"
          placeholder="${t('Country codes')}"
          value="${getState('app/nominatimCountries') || ''}"/>
      </div>
      <small class="form-text text-muted mb-3">
        ${t('Limit address search with comma separated list of country codes (ee,fi - Estonia, Finland). Empty means no limit.')}
      </small>
      <h5>${t('Routing')}</h5>
      <div class="form-group">
        <select
          tabindex="-1"
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
    this.$.get('button.set-locale-btn', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        changeLocale(e.currentTarget.dataset.locale)
        this.$.get('button.set-locale-btn', this.el, true).forEach(elem => {
          elem.classList.remove('active')
        })
        e.currentTarget.classList.add('active')
        log('warning', t('Language changed, page will reload!'), () => {
          reloadApp()
        })
        if (getState('app/debug')) {
          console.debug(`Config.render: Locale changed to ${e.currentTarget.dataset.locale}`)
        }
      })
    })
    // account name
    this.$.on('blur', this.$.get('#settings-account', this.el), e => {
      if (getState('app/settingsTabOpen') && e.target.value.trim() !== getState('app/account')) {
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
    this.$.on('blur', this.$.get('#settings-search', this.el), e => {
      if (getState('app/settingsTabOpen') && e.target.value.trim() !== getState('app/nominatimCountries')) {
        setState('app/nominatimCountries', e.target.value.trim(), true)
        if (getState('app/debug')) {
          console.debug(`Config.render: Search limit changed to ${e.target.value}`)
        }
      }
    })
    // routing
    this.$.on('change', this.$.get('#settings-routing', this.el), e => {
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
    this.$.get('button.set-locale-btn', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        setState('routing/infoFromRoute', e.currentTarget.dataset.share === 'on', true)
        this.$.get('button.set-locale-btn', this.el, true).forEach(elem => {
          elem.classList.remove('active')
        })
        e.currentTarget.classList.add('active')
      })
    })
    // cache import
    this.$.get('button.set-cacheimport-btn', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        setState('cache/import/appendLayer', e.currentTarget.dataset.import === 'append', true)
        this.$.get('button.set-cacheimport-btn', this.el, true).forEach(elem => {
          elem.classList.remove('active')
        })
        e.currentTarget.classList.add('active')
      })
    })
    // share change
    this.$.get('button.set-share-btn', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        setState('app/shareOnlyTripFeatures', e.currentTarget.dataset.share === 'on', true)
        this.$.get('button.set-share-btn', this.el, true).forEach(elem => {
          elem.classList.remove('active')
        })
        e.currentTarget.classList.add('active')
      })
    })
    // reset app
    this.$.on('click', this.$.get('#settings-reset', this.el), e => {
      clearState()
      log('warning', t('App resetted, page will reload!'), () => {
        setPermalink(null)
        reloadApp()
      })
      if (getState('app/debug')) {
        console.debug('Config.render: App resetted')
      }
    })
    // debug change
    this.$.get('button.set-debug-btn', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        setState('app/debug', e.currentTarget.dataset.debug === 'on', true)
        this.$.get('button.set-debug-btn', this.el, true).forEach(elem => {
          elem.classList.remove('active')
        })
        e.currentTarget.classList.add('active')
        log('warning', t('Debug changed, app will reload!'), () => {
          reloadApp()
        })
        if (getState('app/debug')) {
          console.debug(`Config.render: Debug changed to ${e.currentTarget.dataset.debug}`)
        }
      })
    })
    // download debug log file
    if (getState('app/debug')) {
      this.$.on('click', this.$.get('#download-log', this.el), e => {
        const logs = getDebugStore()
        const blob = new window.Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' })
        saveAs(blob, getState('app/debugFile'))
      })
    }
    let deferredPrompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      deferredPrompt = e
      this.$.show(this.$.get('.install', this.el))
    })
    this.$.on('click', this.$.get('#install', this.el), e => {
      this.$.hide(this.$.get('.install', this.el))
      deferredPrompt.prompt()
      deferredPrompt.userChoice
        .then(choiceResult => {
          if (choiceResult.outcome === 'accepted') {
            if (getState('app/debug')) {
              console.debug('Config.render: User accepted the A2HS prompt')
            }
          } else {
            if (getState('app/debug')) {
              console.debug('Config.render: User dismissed the A2HS prompt')
            }
          }
          deferredPrompt = null
        })
    })
  }
}

export default Config
