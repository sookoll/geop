/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery',
    'app/service/search/coordinates'
], function ($, CoordinateParser) {

    'use strict';

    function Nominatim(mapmodule) {
        this._url = 'https://nominatim.openstreetmap.org';
        this._mapmodule = mapmodule;
        this._coordinateParser = new CoordinateParser();
        this._results = null;
        this._id = 'nominatim';
        this._title = '<i class="glyphicon glyphicon-map-marker"></i> Leitud aadressid';
        this._xhr = null;
    }

    Nominatim.prototype = {

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
            if (this._xhr && typeof this._xhr.abort === 'function') {
                this._xhr.abort();
            }
        },

        find : function (query, cb, context) {
            // test coordinates
            var coords = this._coordinateParser.test(query),
                _this = this,
                clone;
            this._results = null;
            if (coords && coords.srid) {
                clone = this._mapmodule.transform('point', [coords.x, coords.y], coords.srid, 'EPSG:3857');
                this._mapmodule.addMarker(clone);
                this._mapmodule.setView('center', [clone, 15]);
                this.reverse([coords.x, coords.y], 18, function (data) {
                    if (data && data.place_id) {
                        data.boundingbox = [coords.y, coords.y, coords.x, coords.x];
                        data = _this.format([data]);
                        _this._results = data;
                    }
                    if (typeof cb === 'function') {
                        cb(_this._title, _this._results, context);
                    }
                });
            } else {
                this.geocode(query, function (data) {
                    if (data.length > 0) {
                        data = _this.format(data);
                        _this._results = data;
                    }
                    if (typeof cb === 'function') {
                        cb(_this._title, _this._results, context);
                    }
                });
            }
        },

        geocode : function (q, cb) {
            if (this._xhr && typeof this._xhr.abort === 'function') {
                this._xhr.abort();
            }
            this._xhr = $.ajax({
                type : 'GET',
                crossDomain : true,
                url : this._url + '/search/',
                data: {
                    q: q,
                    countrycodes: 'ee',
                    format: 'json'
                },
                dataType: 'json',
                context: this
            })
                .done(cb)
                .fail(function (request) {
                    cb(null);
                    if (request.statusText === 'abort') {
                        return;
                    }
                });
        },

        reverse : function (coords, zoom, cb) {
            if (this._xhr && typeof this._xhr.abort === 'function') {
                this._xhr.abort();
            }
            this._xhr = $.ajax({
                type : 'GET',
                url : this._url + '/reverse/',
                data: {
                    lat: coords[1],
                    lon: coords[0],
                    format: 'json',
                    zoom: Math.round(zoom),
                    addressdetails: 1
                },
                dataType: 'json',
                context: this
            })
                .done(cb)
                .fail(function (request) {
                    cb(null);
                    if (request.statusText === 'abort') {
                        return;
                    }
                });
        },

        format : function (data) {
            var i, len, bbox, formatted = [];
            for (i = 0, len = data.length; i < len; i++) {
                if (data[i] && data[i].boundingbox && data[i].boundingbox.length === 4) {
                    bbox = [
                        parseFloat(data[i].boundingbox[2]),
                        parseFloat(data[i].boundingbox[0]),
                        parseFloat(data[i].boundingbox[3]),
                        parseFloat(data[i].boundingbox[1])
                    ];
                    formatted.push({
                        id : data[i].place_id,
                        name : data[i].display_name,
                        bbox : this._mapmodule.transform('extent', bbox, 'EPSG:4326', 'EPSG:3857'),
                        type : this._id
                    });
                }
            }
            return formatted;
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

    return Nominatim;
});
