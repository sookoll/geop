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
    const permalink = getPermalink('hash')
    try {
      const storageState = await getAppState()
      const bookmarkState = permalink && permalink !== storageState['app/bookmark/loaded'] ?
        await getBookmarkState(permalink) : {}
      Object.keys(appConf).forEach(key => {
        conf['app/' + key] = appConf[key]
      })
      Object.keys(mapConf).forEach(key => {
        conf['map/' + key] = mapConf[key]
      })
      conf['map/layers'] = layersConf
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
    } catch (e) {
      reject(e)
    }
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
