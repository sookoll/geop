import {app as appConf, map as mapConf} from 'Conf/settings'
import {layers as layersConf} from 'Conf/layers'
import {getState, setState} from './store'

export function getConf () {
  const appConfig = {}
  Object.keys(appConf).forEach(item => {
    appConfig[item] = getState('app/' + item) || appConf[item]
  })
  const mapConfig = {}
  Object.keys(mapConf).forEach(item => {
    mapConfig[item] = getState('map/' + item) || mapConf[item]
  })
  mapConfig.layers = Object.assign({}, layersConf)
  return {
    app: appConfig,
    map: mapConfig
  }
}
export function storeConf (value) {
  setState('settings', value)
}
