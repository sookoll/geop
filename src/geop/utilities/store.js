import { get, set, keys, clear } from 'idb-keyval'
import { deepCopy } from './util'

const state = {}
const events = {}
const storeAvailable = !!window.indexedDB

export function getAppState () {
  return new Promise((resolve, reject) => {
    if (storeAvailable) {
      try {
        keys().then(async (keys) => {
          const storageConf = {}
          for (const key of keys) {
            const val = await get(key)
            if (typeof (val) !== 'undefined' && val !== null) {
              storageConf[key] = val
            }
          }
          resolve(deepCopy(storageConf))
        })
      } catch (e) {
        reject(e)
      }
    } else {
      reject(new Error('Storage is not available'))
    }
  })
}

export function setState (item, value, permanent = false) {
  state[item] = value
  // local storage
  if (permanent && storeAvailable) {
    set(item, value).then(() => {
      // events
      if (item in events) {
        events[item].forEach(handler => handler(state[item]))
      }
    })
  } else {
    // events
    if (item in events) {
      events[item].forEach(handler => handler(state[item]))
    }
  }
}

export function getState (item) {
  return state[item]
}

export function onchange (item, listener) {
  if (!(item in events)) {
    events[item] = []
  }
  if (events[item].indexOf(listener) === -1) {
    events[item].push(listener)
  }
}

export function clearState () {
  clear()
}
