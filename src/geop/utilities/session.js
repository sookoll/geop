import { get as getPermalink } from 'Utilities/permalink'
import { app as appConf, map as mapConf } from 'Conf/settings'
import { layers as layersConf } from 'Conf/layers'
import { getAppState, clearState, setState } from './store'
import { getBookmarkState } from 'Components/bookmark/Bookmark'

/**
 * Init conf - merge static conf with saved store
 */
export function initConf () {
  return new Promise(async (resolve, reject) => {
    const conf = {}
    const permalink = getPermalink('p')
    let storageState
    let bookmarkState
    try {
      storageState = await getAppState()
      bookmarkState = permalink && permalink.length ?
        await getBookmarkState(permalink) : {}
    } catch (e) {
      storageState = {}
      bookmarkState = {}
    }
    Object.keys(appConf).forEach(key => {
      conf['app/' + key] = appConf[key]
    })
    Object.keys(mapConf).forEach(key => {
      conf['map/' + key] = mapConf[key]
    })
    Object.keys(layersConf).forEach(key => {
      conf['layer/' + key] = layersConf[key]
    })
    const state = Object.assign({}, conf, storageState, bookmarkState)
    // disable bookmarks if not supported
    if (!'onhashchange' in window) {
      state['app/shareState'] = false
    }
    // set state
    Object.keys(state).forEach(key => {
      setState(key, state[key])
    })
    resolve(state)
  })
}

export function clear () {
  clearState()
}

export function getSessionState () {
  return new Promise((resolve, reject) => {
    getAppState()
      .then(resolve)
      .catch(reject)
  })
}
