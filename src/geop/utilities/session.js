import {app as appConf, map as mapConf} from 'Conf/settings'
import {layers as layersConf} from 'Conf/layers'
import {getState, setState} from './store'

export function getConf () {
  const conf = getState('settings') || {}
  return Object.assign({
    app: Object.assign({}, appConf),
    map: Object.assign({}, mapConf, {
      layers: Object.assign({}, layersConf)
    })
  }, conf)
}
export function setConf (type, value) {
  setState(type, value)
}
