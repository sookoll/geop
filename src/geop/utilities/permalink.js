import {parseURL} from 'Utilities/util'

const state = {
  oldURL: null,
  newURL: null,
  hash: null
}
const events = []

export function activatePermalink () {
  // current state
  state.newURL = parseURL(document.URL)
  state.hash = parseHash(parseURL(document.URL).hash)
  // init listener
  window.addEventListener('hashchange', (event) => {
    state.oldURL = state.newURL
    state.newURL = parseURL(event.newURL)
    state.hash = parseHash(state.newURL.hash)
    events.forEach(fn => {
      fn(state.hash)
    })
  }, false)
}

function parseHash (hash) {
  const parsed = {}
  if (hash) {
    hash.slice(1).split('&').forEach(item => {
      const parts = item.split('=')
      parsed[parts[0]] = parts[1]
    })
  }
  return parsed
}

export function get (id) {
  return id ? state.hash[id] : state.hash
}

export function set (data, title, value) {
  window.history.replaceState(data, title, value)
}

export function onchange (cb) {
  events.push(cb)
}
