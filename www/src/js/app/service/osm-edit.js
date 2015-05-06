/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery'
], function ($) {
    
    'use strict';
    
    var OSMEdit = function (el, mapmodule) {
        
        var _this = this,
            href = 'http://openstreetmap.us/iD/release/#editor=id&background=custom:http://kaart.maakaart.ee/orto/{z}/{x}/{y}.jpeg&map=';
        
        el.append('<a href="#" id="osm-edit"><i class="fa fa-pencil"></i></a>');
        
        // todo: move to separate module
        el.on('click', 'a.osm-edit', function (e) {
            e.preventDefault();
            var center = mapmodule.transform('point', mapmodule.get('map').getView().getCenter(), 'EPSG:3857', 'EPSG:4326'),
                zoom = mapmodule.get('map').getView().getZoom();
            window.open(href + zoom + '/' + center[0] + '/' + center[1]);
        });
    };

    return OSMEdit;
    
});