/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery'
], function ($) {

    'use strict';

    function MapFeatures(search) {
        this._mapmodule = search._mapmodule;
        this._results = null;
        this._id = 'mapfeatures';
        this._title = '<i class="fa fa-cube"></i> Leitud aarded';
    }

    MapFeatures.prototype = {

        get : function (key) {
            return this['_' + key];
        },

        init : function () {

        },

        test : function (query) {
            return true;
        },

        clear : function () {
            this._results = null;
        },

        find : function (query, cb, context) {
            var i, len, id, name,
                _this = this,
                data = [],
                fset = null;

            // async function
            setTimeout(function () {
                fset = _this._mapmodule.getAllFeatures();
                for (i = 0, len = fset.length; i < len; i++) {
                    id = fset[i].get('id');
                    name = fset[i].get('name');
                    if (name && name.search(new RegExp(query, 'i')) > -1) {
                        data.push({
                            'bbox' : fset[i].getGeometry().getExtent(),
                            'name' : name,
                            'type' : _this._id,
                            'id' : id
                        });
                    }
                }
                if (data.length > 0) {
                    _this._results = data;
                }
                if (typeof cb === 'function') {
                    cb(_this._title, _this._results, context);
                }
            });

        },

        getResultItem : function (id) {
            var i, len;
            for (i = 0, len = this._results.length; i < len; i++) {
                if (id === this._results[i].id) {
                    return this._results[i];
                }
            }
            return null;
        }
    };

    return MapFeatures;
});
