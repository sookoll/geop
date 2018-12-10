
import { app as appConf, map as mapConf } from 'Conf/settings'
import { layers as layersConf } from 'Conf/layers'
import { initState, clearState, exportState } from './store'

/**
 * Init conf - merge static conf with saved store
 */
export function initConf () {
  return new Promise((resolve, reject) => {
    const conf = {}
    Object.keys(appConf).forEach(key => {
      conf['app/' + key] = appConf[key]
    })
    Object.keys(mapConf).forEach(key => {
      conf['map/' + key] = mapConf[key]
    })
    conf['map/layers'] = layersConf
    initState(conf)
      .then(resolve)
      .catch(reject)
  })
}

export function clear () {
  clearState()
}

export function getSessionState () {
  return new Promise((resolve, reject) => {
    exportState()
      .then(resolve)
      .catch(reject)
  })
}
