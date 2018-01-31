/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([], function () {

    'use strict';

    function Measure(el, mapmodule) {
        this._name = 'measure';


    };

    Geocache.prototype = {
        get: function (key) {
            return this['_' + key];
        },

        init: function () {
            this.createUi();
        },

        createUi: function () {

        }
    }

    return Measure;

});
