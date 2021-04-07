import { parseURL } from '@/utilities/util'

interface MapHash {
  center: [number, number]
  zoom: number
  rotation: number
  baseLayer: string
}

interface Hash {
  view?: string
  icon?: string
  b?: string
}

type SubscribeFn = (hash: Hash) => void

interface PermalinkState {
  shouldUpdate: boolean
  oldURL?: URL
  newURL?: URL
  hash?: Hash
  events: SubscribeFn[]
}

const state: PermalinkState = {
  shouldUpdate: true,
  events: []
}

/**
 * Activate permalink hash change
 */
export function initPermalink(): void {
  // current state
  state.newURL = parseURL(document.URL)
  state.hash = parseHash(state.newURL.hash)

  // init listener
  window.addEventListener(
    'hashchange',
    (event) => {
      state.oldURL = state.newURL
      state.newURL = parseURL(event.newURL)
      state.hash = parseHash(state.newURL.hash)
      state.events.forEach((fn: SubscribeFn) => {
        if (typeof fn === 'function' && state.hash) {
          fn(state.hash)
        }
      })
      state.shouldUpdate = false
    },
    false
  )
}

/**
 * Parse hash string
 * @param  hash [description]
 * @return      [description]
 */
function parseHash(hash: string): Hash {
  const parsed: Hash = {}
  if (hash) {
    hash
      .slice(1)
      .split('&')
      .forEach((item) => {
        const [key, value] = item.split('=')
        switch (key) {
          case 'view':
          case 'icon':
          case 'b':
            parsed[key] = value
            break
        }
      })
  }
  return parsed
}

/**
 * [buildHash description]
 * @param  data [description]
 * @return      [description]
 */
function buildHash(data: Hash): string {
  return (
    '#' +
    Object.keys(data)
      .map((key: string) => {
        return key + '=' + data[key as keyof Hash]
      })
      .join('&')
  )
}

export function get(key: keyof Hash): Hash | string | undefined {
  let value: any
  if (state.hash) {
    switch (key) {
      case 'view':
      case 'icon':
      case 'b':
        value = state.hash[key]
        break
      default:
        value = state.hash
    }
  }
  return value
}

export function set(data: Hash): void {
  if (!state.shouldUpdate) {
    state.shouldUpdate = true
    return
  }
  let value: string
  if (!data) {
    state.hash = data
    value = ' '
  } else {
    const newHash: Hash = Object.assign(state.hash, data)
    Object.keys(newHash).forEach((key: string) => {
      if (
        newHash[key as keyof Hash] === null ||
        typeof newHash[key as keyof Hash] === 'undefined'
      ) {
        delete newHash[key as keyof Hash]
      }
    })
    state.hash = newHash
    value = buildHash(state.hash)
  }
  window.history.pushState(state.hash, 'geop', value)
}

export function onchange(cb: SubscribeFn): void {
  state.events.push(cb)
}

export function viewConfToPermalink(data: MapHash): string {
  return [
    Math.round(data.center[1] * 100000) / 100000,
    Math.round(data.center[0] * 100000) / 100000,
    Math.round(data.zoom * 100) / 100,
    data.rotation,
    data.baseLayer
  ].join('/')
}

export function permalinkToViewConf(permalink: string): MapHash {
  const parts: string[] = permalink ? permalink.split('/') : []
  return <MapHash>{
    center: [Number(parts[1]), Number(parts[0])],
    zoom: Number(parts[2]),
    rotation: Number(parts[3]),
    baseLayer: parts[4]
  }
}
