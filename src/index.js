import { initConf } from 'Utilities/session'
import { activatePermalink } from 'Utilities/permalink'
import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import './app.styl'
import 'bootstrap/js/dist/dropdown'
import 'bootstrap/js/dist/modal'
import 'bootstrap/js/dist/tab'
import 'bootstrap/js/dist/button'
import 'bootstrap/js/dist/popover'
import 'bootstrap/js/dist/alert'
import { initServiceWorker } from 'Utilities/util'
import Geop from 'Geop/Geop'
import $ from 'jquery'

let app = null
const el = $('#geop')

function createApp () {
  initConf().then(conf => {
    const app = new Geop(el)
    app.render()
  })
}

export function reloadApp () {
  if (app) {
    app.destroy()
    app = null
    el.html('')
  }
  // createApp()
  window.location.reload()
}

(function () {
  // service worker
  initServiceWorker()
  // permalink
  if ('onhashchange' in window) {
    activatePermalink()
  }
  // run app
  createApp()
})()
