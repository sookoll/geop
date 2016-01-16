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
                osm_et : {
                    type: 'OSM',
                    title: 'OSM Eesti',
                    url: 'http://kaart.maakaart.ee/osm/tiles/1.0.0/osm_EPSG900913/{z}/{x}/{y}.png?origin=nw',
                    projection: 'EPSG:3857'
                },
                osm : {
                    type: 'OSM',
                    title: 'OSM',
                    url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    projection: 'EPSG:3857'
                },
                ma_kaart : {
                    type: 'Group',
                    title: 'MA Kaart',
                    projection: 'EPSG:3301',
                    layers: [{
                        type: 'XYZ',
                        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/kaart/{z}/{x}/{-y}.png',
                        minResolution: 7.8125
                    }, {
                        type: 'XYZ',
                        url: 'http://tiles.maaamet.ee/tm/s/1.0.0/epk_vv/{z}/{x}/{-y}.png',
                        maxResolution: 7.8125
                    }]
                },
                ma_orto : {
                    type: 'XYZ',
                    title: 'MA Foto',
                    url: 'http://tiles.maaamet.ee/tm/s/1.0.0/foto/{z}/{x}/{-y}.jpg',
                    projection: 'EPSG:3301'
                }
            },
            'activeBaseLayer' : 'osm_et',
            'geocodingEnabled' : true,
            'locateEnabled' : true,
            'clustered' : false,
            'mouseCoordinates' : true,
            'featureInfo' : true
        }
    };
});