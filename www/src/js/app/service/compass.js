/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([], function () {

    'use strict';

    var rotateIcon = function (view, el) {
        var viewRotation = view.getRotation();
        el.css({
            "-webkit-transform": "rotate("+viewRotation+"rad)",
            "-moz-transform": "rotate("+viewRotation+"rad)",
            "transform": "rotate("+viewRotation+"rad)"
        });
    };

    var Compass = function (el, mapmodule) {
        var view = mapmodule.get('map').getView();
        view.on('change:rotation', function (e) {
          rotateIcon(view, el);
        }, this);

        el.on('click', function (e) {
            e.preventDefault();
            view.setRotation(0);
        });
    };

    return Compass;

});
