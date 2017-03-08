/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([], function () {

    'use strict';

    var OSMEdit = function (el, mapmodule) {

        var href = 'https://www.openstreetmap.org/edit?editor=id#background=custom:http://kaart.maakaart.ee/orto/{z}/{x}/{y}.jpeg&map=';

        el.append('<a href="#" id="osm-edit"><i class="fa fa-pencil"></i></a>');

        el.on('click', 'a#osm-edit', function (e) {
            e.preventDefault();
            var center = mapmodule.transform('point', mapmodule.get('map').getView().getCenter(), 'EPSG:3857', 'EPSG:4326'),
                zoom = mapmodule.get('map').getView().getZoom();
            window.open(href + zoom + '/' + center[1] + '/' + center[0]);
        });
    };

    return OSMEdit;

});
