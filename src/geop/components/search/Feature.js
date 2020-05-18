import { getState } from 'Utilities/store'
import Provider from 'Geop/Provider'
import VectorLayer from 'ol/layer/Vector'
import GeoJSONFormat from 'ol/format/GeoJSON'
import { t } from 'Utilities/translate'

class Feature extends Provider {
  constructor () {
    super()
    this.title = 'Features'
    this.layers = getState('map/layer/layers')
    this.geojson = new GeoJSONFormat({
      featureProjection: getState('map/projection'),
      dataProjection: 'EPSG:4326'
    })
  }
  test (query) {
    return (query.length >= 3)
  }

  find (query) {
    return new Promise((resolve, reject) => {
      if (!this.test(query)) {
        throw new Error(t('Query string too short, aborting!'))
      }
      this.searchFeatures(query, (results) => {
        resolve(results)
      })
    })
  }

  searchFeatures (query, cb) {
    const fset = this.getAllFeatures()
    const result = fset.filter(f => {
      const name = f.get('name')
      return (name && name.search(new RegExp(query, 'i')) > -1)
    }).map(f => {
      return this.format(f)
    })
    if (typeof cb === 'function') {
      cb(result)
    }
  }

  getAllFeatures () {
    let fset = []
    this.layers.forEach(layer => {
      if (layer instanceof VectorLayer) {
        fset = fset.concat(layer.getSource().getFeatures())
      }
    })
    return fset
  }

  format (feature) {
    const jsonFeature = this.geojson.writeFeatureObject(feature)
    const props = {}
    if (jsonFeature.properties.id) {
      props.id = jsonFeature.properties.id
    }
    if (jsonFeature.properties.name) {
      props.name = jsonFeature.properties.name
    }
    props.provider = this.title
    jsonFeature.properties = props
    return jsonFeature
  }
}

export default Feature
