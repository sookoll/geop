import { openDB, DBSchema, deleteDB, IDBPDatabase } from 'idb'
import { LayerConfig, LayerGroupType } from '@/models/layer-config'
// @ts-ignore
import config from '@/config/settings'
// @ts-ignore
import layers from '@/config/layers'

interface GeopDB extends DBSchema {
  settings: {
    key: string
    value: any
  }
  layers: {
    value: LayerConfig
    key: string
    indexes: { 'by-group': LayerGroupType }
  }
}

let db: IDBPDatabase<GeopDB>

/**
 * Create DB
 * @return Promise
 */
export function initDB(): Promise<boolean> {
  return new Promise((resolve) => {
    openDB<GeopDB>(config.app.dbName, config.app.dbVersion, {
      upgrade(idb, oldVersion) {
        if (oldVersion < 1) {
          // remove old database
          deleteDB('keyval-store')
          idb.createObjectStore('settings')
          const layersStore = idb.createObjectStore('layers', {
            keyPath: 'id'
          })
          layersStore.createIndex('by-group', 'group')
        }
      }
    }).then((geopdb: IDBPDatabase<GeopDB>) => {
      db = geopdb
      resolve(true)
    })
  })
}

/**
 * Create initial DB state
 * @return Promise
 */
export function initDBState(): Promise<boolean> {
  return new Promise((resolve) => {
    Promise.all([populateConfigStore(), populateLayersStore()]).then(() => {
      resolve(true)
    })
  })
}

async function populateConfigStore(): Promise<any> {
  if (!('onhashchange' in window)) {
    config.app.shareState = false
  }
  const promises: Promise<any>[] = []
  // config
  const tx = db.transaction('settings', 'readwrite')
  const storedKeys = await tx.store.getAllKeys()
  let keys = Object.keys(config.app)
  for (let i = 0, len = keys.length; i < len; i++) {
    if (!storedKeys.includes('app/' + keys[i])) {
      promises.push(tx.store.add(config.app[keys[i]], 'app/' + keys[i]))
    }
  }
  keys = Object.keys(config.map)
  for (let i = 0, len = keys.length; i < len; i++) {
    if (!storedKeys.includes('map/' + keys[i])) {
      promises.push(tx.store.add(config.map[keys[i]], 'map/' + keys[i]))
    }
  }
  promises.push(tx.done)
  return Promise.all(promises)
}

async function populateLayersStore(): Promise<any> {
  const promises: Promise<any>[] = []
  // layers
  const tx = db.transaction('layers', 'readwrite')
  const storedKeys = await tx.store.getAllKeys()
  for (let i = 0, len = layers.base.length; i < len; i++) {
    if (!storedKeys.includes(layers.base[i].id)) {
      layers.base[i].group = LayerGroupType.base
      layers.base[i].visible = false
      promises.push(tx.store.add(layers.base[i]))
    }
  }
  for (let i = 0, len = layers.layers.length; i < len; i++) {
    if (!storedKeys.includes(layers.layers[i].id)) {
      layers.layers[i].group = LayerGroupType.layers
      layers.layers[i].visible = false
      promises.push(tx.store.add(layers.layers[i]))
    }
  }
  for (let i = 0, len = layers.overlays.length; i < len; i++) {
    if (!storedKeys.includes(layers.overlays[i].id)) {
      layers.overlays[i].group = LayerGroupType.overlays
      layers.overlays[i].visible = false
      promises.push(tx.store.add(layers.overlays[i]))
    }
  }
  promises.push(tx.done)
  return Promise.all(promises)
}

// export async function get(key: string) {
//   return await db.get(config.app.dbStoreName, key)
// }
// export async function set(key: string, val: any) {
//   return await db.put(config.app.dbStoreName, val, key)
// }
// export async function del(key: string) {
//   return await db.delete(config.app.dbStoreName, key)
// }
// export async function clear() {
//   return await db.clear(config.app.dbStoreName)
// }
// export async function keys() {
//   return await db.getAllKeys(config.app.dbStoreName)
// }
