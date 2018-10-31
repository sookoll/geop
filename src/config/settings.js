export const app = {
  locale: 'et',
  geocodingEnabled: true,
  locateEnabled: true,
  mouseCoordinates: true,
  featureInfo: true,
  scaleLine: true,
  measureTool: true,
  streetview_url: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='
}
export const geocache = {
  auth_url: 'http://geopeitus.ee',
  features_url: 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2',
  cache_url: 'http://geopeitus.ee/aare/'
}
export const map = {
  el: '#map',
  center: [25.5, 58.5],
  zoom: 7,
  rotation: 0,
  extent: [21, 57, 29, 60],
  crs: 'EPSG:3857',
  activeBaseLayer: 'osm',
  minZoom: 0,
  maxZoom: 20,
  clustered: false
}
export const layers = {
  baseLayers: {
    osm: {
      type: 'OSM',
      title: 'OSM',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      projection: 'EPSG:3857',
      crossOrigin: null
    },
    ma_orto : {
      type: 'Group',
      title: 'Foto',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        projection: 'EPSG:3857',
        url: 'http://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png',
        minResolution: 0.5,
        crossOrigin: null
      }, {
        type: 'TileWMS',
        url: 'http://kaart.maaamet.ee/wms/fotokaart',
        params: {
          LAYERS: 'EESTIFOTO',
          TILED: true,
          FORMAT: 'image/png',
          VERSION: '1.1.1'
        },
        maxResolution: 0.5,
        tileSize: 1024,
        gutter: 20,
        crossOrigin: null
      }]
    },
    ma_kaart: {
      type: 'Group',
      title: 'Kaart',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        projection: 'EPSG:3857',
        url: 'http://tiles.maaamet.ee/tm/tms/1.0.0/kaart@GMC/{z}/{x}/{-y}.png',
        minResolution: 0.5,
        crossOrigin: null
      }, {
        type: 'TileWMS',
        url: 'http://kaart.maaamet.ee/wms/kaart',
        params: {
          LAYERS: 'MA-KAART',
          TILED: true,
          FORMAT: 'image/png',
          VERSION: '1.1.1'
        },
        maxResolution: 0.5,
        tileSize: 1024,
        gutter: 20,
        crossOrigin: null
      }]
    },
    ma_pkaart: {
      type: 'Group',
      title: 'Põhikaart',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/vreljeef@LEST/{z}/{x}/{-y}.png',
        minResolution: 7,
        crossOrigin: null
      }, {
        type: 'XYZ',
        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/hybriid@LEST/{z}/{x}/{-y}.png',
        minResolution: 7,
        crossOrigin: null
      }, {
        type: 'XYZ',
        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/epk_vv/{z}/{x}/{-y}.png',
        minResolution: 0.5,
        maxResolution: 7.8125,
        crossOrigin: null
      }, {
        type: 'TileWMS',
        url: 'http://kaart.maaamet.ee/wms/alus',
        params: {
          LAYERS: 'pohi_vv',
          TILED: true,
          FORMAT: 'image/png',
          VERSION: '1.1.1'
        },
        maxResolution: 0.5,
        tileSize: 1024,
        gutter: 20,
        crossOrigin: null
      }]
    }
  }
}
