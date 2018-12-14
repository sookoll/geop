export const layers = {
  baseLayers: {
    osm: {
      type: 'XYZ',
      title: 'OSM',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      projection: 'EPSG:3857',
      crossOrigin: null
    },
    okaart: {
      type: 'XYZ',
      title: 'O-kaart',
      url: 'https://okaart.osport.ee/{z}/{x}/{y}.png',
      projection: 'EPSG:3857',
      crossOrigin: null
    },
    maorto : {
      type: 'Group',
      title: 'Satellite',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        projection: 'EPSG:3857',
        url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png',
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
        maxResolution: 0.75,
        tileSize: 1024,
        gutter: 20,
        crossOrigin: null
      }]
    },
    makaart: {
      type: 'Group',
      title: 'Map',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        projection: 'EPSG:3857',
        url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/kaart@GMC/{z}/{x}/{-y}.png',
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
        maxResolution: 0.75,
        tileSize: 1024,
        gutter: 20,
        crossOrigin: null
      }]
    },
    mapkaart: {
      type: 'Group',
      title: 'Topo',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        projection: 'EPSG:3857',
        url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/kaart@GMC/{z}/{x}/{-y}.png',
        minResolution: 7.1,
        crossOrigin: null
      }, {
        type: 'XYZ',
        url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/reljeef@LEST/{z}/{x}/{-y}.png',
        minResolution: 7.1,
        crossOrigin: null,
        opacity: 0.5
      }, {
        type: 'XYZ',
        url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/epk_vv@LEST/{z}/{x}/{-y}.png',
        minResolution: 0.5,
        maxResolution: 7.1,
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
        maxResolution: 0.75,
        tileSize: 1024,
        gutter: 20,
        crossOrigin: null
      }]
    }
  },
  layers: [],
  overlays: []
}
