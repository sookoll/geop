import { get, set, del, clear } from 'idb-keyval'

const state = {}
const events = {}
let storeAvailable = false;
(async () => {
  storeAvailable = await test()
  console.log('IndexedDB available: ' + storeAvailable)
})()

export function setState (item, value, permanent = false) {
  if (state[item] !== value) {
    state[item] = value
    // local storage
    if (permanent && storeAvailable) {
      set(item, value)
    }
    // events
    if (item in events) {
      events[item].forEach(handler => handler(state[item]))
    }
  }
}

async function getStorageItem (item) {
  const result = await get(item)
  return result
}

export function getState (item) {
  const value = getStorageItem(item)
  if (value && item in state && state[item] !== value) {
    state[item] = value
  } else if (value && !(item in state)) {
    state[item] = value
  }
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

async function test () {
  try {
    await set('hello', 'world')
    const result = await get('hello')
    console.log(result)
    await del('hello')
    return result === 'world'
  } catch (e) {
    return false
  }
}
