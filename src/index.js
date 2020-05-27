import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import { initConf } from 'Utilities/session'
import { activatePermalink } from 'Utilities/permalink'
import './app.styl'
import { initServiceWorker } from 'Utilities/util'
import $ from 'Utilities/dom'
import Geop from 'Geop/Geop'

let app = null
const target = $.get('#geop')

function createApp () {
  initConf().then(conf => {
    const app = new Geop({ target })
    app.render()
  })
}

export function reloadApp () {
  if (app) {
    app.destroy()
    app = null
    $.html(target, '')
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
