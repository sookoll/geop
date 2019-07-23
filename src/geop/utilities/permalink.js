import { parseURL } from 'Utilities/util'

let shouldUpdate = true
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
  window.addEventListener('hashchange', event => {
    state.oldURL = state.newURL
    state.newURL = parseURL(event.newURL)
    state.hash = parseHash(state.newURL.hash)
    events.forEach(fn => {
      fn(state.hash)
    })
    shouldUpdate = false
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

function buildHash (data) {
  return '#' + Object.keys(data).map(key => {
    return key + '=' + data[key]
  }).join('&')
}

export function get (id) {
  return id ? state.hash[id] : state.hash
}

export function set (data) {
  if (!shouldUpdate) {
    shouldUpdate = true
    return
  }
  let value
  if (!data) {
    state.hash = data
    value = ' '
  } else {
    const newHash = Object.assign(state.hash, data)
    Object.keys(newHash).forEach(k => {
      if (newHash[k] === null || typeof newHash[k] === 'undefined') {
        delete newHash[k]
      }
    })
    state.hash = newHash
    value = buildHash(state.hash)
  }
  window.history.pushState(state.hash, 'geop', value)
}

export function onchange (cb) {
  events.push(cb)
}

export function viewConfToPermalink (data) {
  return [
    Math.round(data.center[1] * 100000) / 100000,
    Math.round(data.center[0] * 100000) / 100000,
    Math.round(data.zoom * 100) / 100,
    parseInt(data.rotation),
    data.baseLayer
  ].join('-')
}
