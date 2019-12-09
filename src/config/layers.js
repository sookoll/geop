export const layers = {
  base: [
    {
      id: 'osm',
      type: 'XYZ',
      title: 'OSM',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      projection: 'EPSG:3857',
      crossOrigin: null
    }, {
      id: 'photo',
      type: 'Bing',
      title: 'Aerial',
      key: 'AozX0lfGO2nv-11kPOU6_BKWeJwgfAcyFQAXAwXQmnQtSJahtmYj8ZJ3JAzk36Z4',
      projection: 'EPSG:3857',
      imagerySet: 'AerialWithLabels',
      maxZoom: 19
    }, {
      id: 'makaart',
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
        url: 'https://kaart.maaamet.ee/wms/kaart',
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
    }, {
      id: 'mapkaart',
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
        url: 'https://kaart.maaamet.ee/wms/alus',
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
    }, {
      id: 'maorto',
      type: 'Group',
      title: 'Aerial Estonia',
      projection: 'EPSG:3301',
      layers: [{
        type: 'XYZ',
        projection: 'EPSG:3857',
        url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png',
        minResolution: 0.5,
        crossOrigin: null
      }, {
        type: 'TileWMS',
        url: 'https://kaart.maaamet.ee/wms/fotokaart',
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
    }, {
      id: 'okaart',
      type: 'XYZ',
      title: 'O-kaart',
      url: 'https://okaart.osport.ee/{z}/{x}/{y}.png',
      projection: 'EPSG:3857',
      crossOrigin: null
    }, {
      id: 'soome',
      type: 'WMTS',
      title: 'Soome',
      url: 'https://mapservices-a.navici.com/basemaps/gwc/service/wmts?apikey=gdqWSTM10Le9XVAX8B6vFKxnpZAmTx5x',
      projection: 'EPSG:3067',
      layer: 'basemaps:rk',
      matrixSet: 'ETRS-TM35FIN',
      scaleDenominator: 2.925714285714286E7,
      topLeftCorner: [-2097152.0, 9437184.0],
      matrixWidth: 3,
      matrixHeight: 2,
      format: 'image/png8',
      crossOrigin: null
    }
  ],
  layers: [],
  overlays: []
}
