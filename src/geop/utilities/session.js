import {app as appConf, map as mapConf} from 'Conf/settings'
import {layers as layersConf} from 'Conf/layers'
import {getState} from './store'

export function getConf () {
  const appConfig = {}
  Object.keys(appConf).forEach(async (item) => {
    appConfig[item] = await getState('app/' + item) || appConf[item]
  })
  console.log(Object.keys(appConfig))
  const mapConfig = {}
  Object.keys(mapConf).forEach(async (item) => {
    mapConfig[item] = await getState('map/' + item) || mapConf[item]
  })
  mapConfig.layers = Object.assign({}, layersConf)
  return {
    app: appConfig,
    map: mapConfig
  }
}
