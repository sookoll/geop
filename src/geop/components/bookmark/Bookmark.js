import Component from 'Geop/Component'
import { apiUrls } from 'Conf/settings'
import { getSessionState } from 'Utilities/session'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { copy, uid, deepCopy, fetch } from 'Utilities/util'
import { get as getPermalink, onchange as onPermalinkChange } from 'Utilities/permalink'
import log from 'Utilities/log'
import { reloadApp } from 'Root'
import JSONP from 'jsonpack'
import QRious from 'qrious'
import Modal from 'bootstrap.native/src/components/modal-native'
import Dropdown from 'bootstrap.native/src/components/dropdown-native'
import './Bookmark.styl'

const xhr = fetch()

class Bookmark extends Component {
  create () {
    this.el = this.$.create('<div class="btn-group"></div>')
    this.modalEl = this.$.create(`
      <div class="modal fade"
        id="modal_bookmark">
      </div>`)
    this.modal = null
    this.dropdown = null
    this.state = {
      bookmarks: getState('app/bookmarks') || [],
      bookmark: getPermalink('b')
    }
    onPermalinkChange(permalink => {
      if (this.state.bookmark !== permalink.b) {
        reloadApp()
      }
    })
  }

  render () {
    this.$.html(this.el, `
      <div class="btn-group dropup">
        <button type="button" class="btn btn-secondary share" title="${t('Share')}">
          <i class="fas fa-share-alt"></i>
        </button>
        <button ${this.state.bookmarks.length ? '' : 'disabled'}
          type="button"
          class="btn btn-secondary dropdown-toggle dropdown-toggle-split"
          data-toggle="dropdown">
        </button>
        <div class="dropdown-menu dropdown-menu-right">
          ${this.state.bookmarks.map((bookmark) => {
    return `
            <li
              class="dropdown-item"
              data-id="${bookmark}">
              <i class="fas fa-star"></i>
              ${bookmark}
              <div class="tools">
                <a href="#" class="remove">
                  <i class="fa fa-times"></i>
                </a>
              </div>
            </li>`
  }).join('')}
        </div>
      </div>
    `)
    this.$.on('click', this.$.get('button.share', this.el), e => {
      e.preventDefault()
      this.share()
    })
    this.$.get('li', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        this.openModal(e.currentTarget.dataset.id)
      })
    })
    this.$.get('li .tools a.remove', this.el, true).forEach(el => {
      this.$.on('click', el, e => {
        e.preventDefault()
        e.stopPropagation()
        this.delete(e.currentTarget.closest('li').dataset.id)
      })
    })
    this.dropdown = new Dropdown(this.$.get('.dropdown-toggle', this.el))
  }

  renderComponents () {
    this.$.html(this.modalEl, `<div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">${t('Share bookmark')}</h4>
          <button type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body text-muted">
          <div class="input-group mb-5">
            <input type="text" class="form-control" name="bookmark" readonly>
            <div class="input-group-append">
              <button class="btn btn-secondary copy" type="button">
                <i class="far fa-clone"></i>
              </button>
              <a class="btn btn-secondary go" href="#" target="_blank">
                <i class="fas fa-link"></i>
              </a>
            </div>
          </div>
          <div class="mb-5 text-center display-4">
            ${t('or')}
          </div>
          <div class="mb-5 text-center">
            <canvas class="rounded mx-auto d-block img-thumbnail"></canvas>
          </div>
        </div>
      </div>
    </div>`)
    this.$.append(this.$.get('body'), this.modalEl)
    this.$.on('click', this.$.get('button.copy', this.modalEl), e => {
      e.preventDefault()
      this.copy(this.$.get('input', e.target.closest('.modal')).value)
    })
  }

  // https://dev.to/bauripalash/building-a-simple-url-shortener-with-just-html-and-javascript-16o4
  share () {
    const debug = getState('app/debug')
    getSessionState()
      .then(appState => setBookmarkState(appState))
      .then(bookmark => {
        this.state.bookmarks.push(bookmark)
        setState('app/bookmarks', this.state.bookmarks, true)
        this.render()
        this.openModal(bookmark)
        if (debug) {
          console.debug('Bookmark saved: ' + bookmark)
        }
      })
      .catch(e => {
        log('error', t(e.message))
        if (debug) {
          console.error('Bookmark error [getSessionState]: ' + JSON.stringify(e))
        }
      })
  }

  copy (content) {
    copy(content)
      .then(() => {
        log('success', `${t('URL')} ${content} ${t('copied to clipboard')}`)
      })
      .catch(() => {
        log('error', t('Unable to copy to clipboard'))
      })
  }

  delete (bookmark) {
    const debug = getState('app/debug')
    deleteBookmarkState(bookmark)
      .then(() => {
        this.state.bookmarks = this.state.bookmarks.filter(item => item !== bookmark)
        setState('app/bookmarks', this.state.bookmarks, true)
        this.render()
        log('success', `${t('Bookmark deleted!')}`)
        if (debug) {
          console.debug('Bookmark deleted: ' + bookmark)
        }
      })
      .catch(e => {
        log('error', t(e.message))
        if (debug) {
          console.error('Bookmark error [deleteBookmarkState]: ' + JSON.stringify(e))
        }
      })
  }

  bookmarkUrl (hash) {
    return window.location.origin + window.location.pathname + '#b=' + hash
  }

  openModal (bookmark) {
    this.$.get('input', this.modalEl).value = this.bookmarkUrl(bookmark)
    this.$.get('a.go', this.modalEl).href = this.bookmarkUrl(bookmark)
    const qr = new QRious({
      element: this.$.get('canvas', this.modalEl),
      size: 200
    })
    qr.value = this.bookmarkUrl(bookmark)
    this.modal = new Modal(this.modalEl)
    this.modal.show()
  }

  destroy () {
    this.modal.hide()
    super.destroy()
  }
}

function formatState (type = 'down', data = {}, hash = null) {
  let state = {}
  switch (type) {
    case 'up':
      state = deepCopy(
        Object.assign(
          {}, ...Object.keys(data).map(k => ({ [k.replace(/\//g, '_')]: data[k] }))
        )
      )
      if ('app_bookmarks' in state) {
        delete state.app_bookmarks
      }
      if ('app_bookmark_loaded' in state) {
        delete state.app_bookmark_loaded
      }
      if (getState('app/shareOnlyTripFeatures') && 'geocache_trip_ids' in state) {
        state.layer_layers && state.layer_layers.forEach(layer => {
          layer.features = layer.features
            ? layer.features.filter(f => state.geocache_trip_ids.indexOf(f.id) > -1) : []
        })
        state.layer_overlays && state.layer_overlays.forEach(layer => {
          layer.features = layer.features
            ? layer.features.filter(f => state.geocache_trip_ids.indexOf(f.id) > -1) : []
        })
      }
      break
    case 'down':
      state = deepCopy(
        Object.assign(
          {}, ...Object.keys(data).map(k => ({ [k.replace(/_/g, '/')]: data[k] }))
        )
      )
      if (hash) {
        state['app/bookmark/loaded'] = hash
      }
      break
    default:
      state = data
  }
  return state
}

function setBookmarkState (data) {
  return new Promise((resolve, reject) => {
    const hash = uid()
    xhr.post(apiUrls.jsonstore + '/' + hash, {
      body: JSON.stringify({
        state: JSONP.pack(formatState('up', data))
      })
    })
      .then(response => {
        if (response && response.ok) {
          resolve(hash)
        } else {
          reject(new Error('Unable to save bookmark'))
        }
      })
      .catch(err => reject(err))
  })
}

export function getBookmarkState (hash) {
  return new Promise((resolve, reject) => {
    xhr.get(apiUrls.jsonstore + '/' + hash)
      .then(response => {
        if (response && response.ok && response.result && response.result.state) {
          const state = formatState('down', JSONP.unpack(response.result.state), hash)
          resolve(state)
        } else {
          reject(new Error('Unable to load bookmark'))
        }
      })
      .catch(err => reject(err))
  })
}

function deleteBookmarkState (hash) {
  return new Promise((resolve, reject) => {
    xhr.abort()
    xhr.delete(apiUrls.jsonstore + '/' + hash)
      .then(response => {
        if (response && response.ok) {
          resolve()
        } else {
          reject(new Error('Unable to delete bookmark'))
        }
      })
      .catch(err => reject(err))
  })
}

export default Bookmark
