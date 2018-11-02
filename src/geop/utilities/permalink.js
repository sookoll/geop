import {parseURL} from 'Utilities/util'

const state = {
  oldURL: null,
  newURL: parseURL(document.URL),
  hash: parseHash(parseURL(document.URL).hash)
}

export function activatePermalink () {
  window.addEventListener('hashchange', (event) => {
    state.oldURL = state.newURL
    state.newURL = parseURL(event.newURL)
    state.hash = parseHash(state.newURL.hash)
  }, false)
}

function parseHash (hash) {
  const parsed = {}
  console.log(hash)
  if (hash) {
    hash.slice(1).split('/').forEach(item => {
      const parts = item.split('=')
      parsed[parts[0]] = parts[1]
    })
  }
  return parsed
}

export function get (id) {
  return state.hash[id]
}
