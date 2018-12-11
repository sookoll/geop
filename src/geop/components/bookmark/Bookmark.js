import Component from 'Geop/Component'
import { apiUrls } from 'Conf/settings'
import { getSessionState } from 'Utilities/session'
import { getState, setState } from 'Utilities/store'
import { t } from 'Utilities/translate'
import { copy, uid } from 'Utilities/util'
import { get as getPermalink } from 'Utilities/permalink'
import log from 'Utilities/log'
import $ from 'jquery'

class Bookmark extends Component {
  constructor (target) {
    super(target)
    this.el = $(`
      <div class="btn-group float-right" id="bookmark"></div>
    `)
    this.state = {
      bookmarks: getState('app/bookmarks') || [],
      bookmark: getPermalink()
    }
    this.modal = $(`
      <div class="modal fade"
        id="modal_bookmark">
        <div class="modal-dialog">
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
                    ${t('Copy')}
                  </button>
                </div>
              </div>
              <div class="mb-5 text-center display-4">
                ${t('or')}
              </div>
              <div class="mb-5 text-center">
                <img
                  class="rounded mx-auto d-block img-thumbnail"
                  src=""
                  alt="qr code" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `)
    this.create()
    $('body').append(this.modal)
    this.el.on('click', 'button.share', e => {
      e.preventDefault()
      this.share()
    })
    this.modal.on('click', 'button.copy', e => {
      this.copy($(e.target).closest('.modal').find('input').val())
    })
    console.log(this.state.permalink)
  }
  render () {
    this.el.html(`
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
              <a class="dropdown-item" href="${window.location.origin}/#${bookmark}">
                <i class="fas fa-star"></i>
                ${bookmark}
                <button type="button" class="close">
                  <i class="fa fa-times"></i>
                </button>
              </a>`
          }).join('')}
        </div>
      </div>
    `)
  }
  share () {
    //https://dev.to/bauripalash/building-a-simple-url-shortener-with-just-html-and-javascript-16o4
    getSessionState()
      .then(appState => {
        const data = Object.assign({}, ...Object.keys(appState).map(k => ({[k.replace(/\//g, '_')]: appState[k]})))
        if ('app_bookmarks' in data) {
          delete data.app_bookmarks
        }
        this.saveState(data)
          .then(bookmark => {
            this.state.bookmarks.push(bookmark)
            setState('app/bookmarks', this.state.bookmarks, true)
            this.render()
            this.modal.find('input').val(window.location.origin + '/#' + bookmark)
            this.modal.find('img').attr('src', apiUrls.qrcode + encodeURI(window.location.origin + '/#' + bookmark))
            this.modal.modal()
          })
          .catch(e => {
            log('error', t(e))
          })
      })
      .catch(e => {
        log('error', t(e))
      })
  }
  saveState (data) {
    return new Promise((resolve, reject) => {
      if (this.xhr && typeof this.xhr.abort === 'function') {
        this.xhr.abort()
      }
      const hash = uid()
      resolve(hash)
      this.xhr = $.ajax({
        type : 'POST',
        crossDomain : true,
        url : apiUrls.jsonstore + '/' + hash,
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        context: this
      })
      .done(data => {
        if (data && data.ok) {
          resolve(hash)
        } else {
          reject(new Error('Unable to save data'))
        }
      })
      .fail(request => {
        if (request.statusText === 'abort') {
          resolve(null)
        } else {
          reject(new Error('Unable to save data'))
        }
      })
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
}

export default Bookmark
