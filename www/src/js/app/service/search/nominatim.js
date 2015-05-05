/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery'
], function ($) {
    
    'use strict';
    
    function Nominatim(mapmodule) {
        this._mapmodule = mapmodule;
        this._results = null;
        this._id = 'nominatim';
        this._title = '<i class="glyphicon glyphicon-map-marker"></i> Leitud aadressid';
    }
    
    Nominatim.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            
        },
        
        clear : function () {
            this._results = null;
        },
        
        find : function (query, cb, context) {
            this.geocode(query, function (data) {
                if (data.length > 0) {
                    data = this.format(data);
                    this._results = data;
                }
                if (typeof cb === 'function') {
                    cb(this._title, this._results, context);
                }
            });
        },
        
        geocode : function (q, cb) {
            $.ajax({
                type : 'GET',
                url : 'http://nominatim.openstreetmap.org/search/',
                data: {
                    q: q,
                    countrycodes: 'ee',
                    format: 'json'
                },
                dataType: 'json',
                context: this
            }).done(cb);
        },
        
        reverse : function (latlng, cb) {
            $.ajax({
                type : 'GET',
                url : 'http://nominatim.openstreetmap.org/reverse/',
                data: {
                    lat: latlng.lat,
                    lon: latlng.lng,
                    format: 'json',
                    zoom: 18,
                    addressdetails: 1
                },
                dataType: 'json',
                context: this
            }).done(cb);
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