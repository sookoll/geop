/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define(function () {
    
    'use strict';
    
    return {
        "geocache" : {
            "auth_url" : "http://geopeitus.ee",
            "features_url" : "http://www.geopeitus.ee/index.php?p=301&status[]=1&format=2",
            "cache_url" : "http://geopeitus.ee/aare/"
        },
        "map" : {
            "el" : "map",
            "center" : [25.5, 58.5],
            "zoom" : 7,
            "extent" : [21, 57, 29, 60],
            "baseLayers" : {
                osm_et : {
                    title : "OSM Eesti",
                    url : "proxy.php?url=http://kaart.maakaart.ee/osm/tiles/1.0.0/osm_EPSG900913/{z}/{x}/{y}.png?origin=nw"
                },
                osm : {
                    title : "OSM",
                    url : "http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                },
                orto : {
                    title : "Fotokaart",
                    url : "proxy.php?url=http://kaart.maakaart.ee/orto/{z}/{x}/{y}.jpeg",
                    minZoom: 14
                }
            },
            "activeBaseLayer" : "osm_et",
            "geocodingEnabled" : true,
            "locateEnabled" : true,
            "clustered" : false,
            "mouseCoordinates" : true,
            "featureInfo" : true
        }
    };
});