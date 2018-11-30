import { get, set, keys, clear } from 'idb-keyval'

const state = {}
const events = {}
let storeAvailable = !!window.indexedDB;

export function initState (conf) {
  return new Promise((resolve, reject) => {
    if (storeAvailable) {
      try {
        keys().then(async (keys) => {
          const storageConf = {}
          for (const key of keys) {
            if (Object.keys(conf).indexOf(key) > -1) {
              const val = await get(key)
              if (typeof(val) !== 'undefined' && val !== null) {
                storageConf[key] = val
              }
            }
          }
          const stateConf = Object.assign(conf, storageConf)
          Object.keys(stateConf).forEach(key => {
            state[key] = stateConf[key]
          })
          resolve()
        })
      } catch (e) {
        reject(e)
      }
    } else {
      Object.keys(conf).forEach(key => {
        state[key] = conf[key]
      })
      resolve()
    }
  })
}

export function setState (item, value, permanent = false) {
  if (state[item] !== value) {
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
