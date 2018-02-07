/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define(function () {

    'use strict';

    return {
        'geocache' : {
            'auth_url' : 'http://geopeitus.ee',
            'features_url' : 'http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2',
            'cache_url' : 'http://geopeitus.ee/aare/'
        },
        'map' : {
            'el' : 'map',
            'center' : [25.5, 58.5],
            'zoom' : 7,
            'extent' : [21, 57, 29, 60],
            'baseLayers' : {
                osm : {
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
                        //url: 'http://tiles.maaamet.ee/tm/s/1.0.0/foto/{z}/{x}/{-y}.jpg',
                        url: 'http://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{-y}.png',
                        minResolution: 1,
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
                        maxResolution: 1,
                        gutter: 20,
                        crossOrigin: null
                    }]
                },
                ma_kaart : {
                    type: 'Group',
                    title: 'Põhikaart',
                    projection: 'EPSG:3301',
                    layers: [{
                        type: 'XYZ',
                        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/kaart/{z}/{x}/{-y}.png',
                        minResolution: 7,
                        crossOrigin: null
                    }, {
                        type: 'XYZ',
                        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/epk_vv/{z}/{x}/{-y}.png',
                        minResolution: 1,
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
                        maxResolution: 1,
                        gutter: 20,
                        crossOrigin: null
                    }]
                }
            },
            'activeBaseLayer' : 'osm',
            'geocodingEnabled' : true,
            'locateEnabled' : true,
            'clustered' : false,
            'mouseCoordinates' : true,
            'featureInfo' : true,
            'scaleLine' : true,
            'measureTool': true
        },
        streetview_url: 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='
    };
});
