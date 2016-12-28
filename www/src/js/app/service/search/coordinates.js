/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define(function () {
    
    'use strict';
    
    function CoordinateParser() {
        
        this._formats = [
            {
                /*
                 * EPSG:3301
                 * East;North
                 * 660394;6472665
                 * 660394.45;6472665,57
                 */
                regexp: /^([3-7][0-9]{5}|[3-7][0-9]{5}[,.][0-9]+)[;](6[3-6][0-9]{5}|6[3-6][0-9]{5}[,.][0-9]+)$/,
                srid: 'EPSG:3301',
                get: function (matches) {
                    // replace , with .
                    if (matches[1].indexOf(',') !== -1) {
                        matches[1] = matches[1].replace(',', '.');
                    }
                    if (matches[2].indexOf(',') !== -1) {
                        matches[2] = matches[2].replace(',', '.');
                    }
                    return [Number(matches[1]), Number(matches[2])];
                }
            }, {
                /*
                 * EPSG:4326
                 * Longitude;Latitude
                 * 58 23 39;26 55 55
                 * 58° 23' 39'', 26° 55' 55''
                 */
                regexp: /^-?\s*([0-1]\d{0,2}|\d{2})[ °]+([0-9]{2})[ ’']+([0-9]{2})[’']*[,; ][ ]*-?\s*([0-8]\d?|90)[ °]+([0-9]{2})[ ’']+([0-9]{2})[’']*$/,
                srid: 'EPSG:4326',
                get: function (matches) {
                    return [
                        Number(matches[1]) + Number(matches[2]) / 60 + Number(matches[3]) / 60 / 60,
                        Number(matches[4]) + Number(matches[5]) / 60 + Number(matches[6]) / 60 / 60
                    ];
                }
            }, {
                /*
                 * EPSG:4326
                 * Latitude Longitude
                 * 58,345;26.9876
                 */
                regexp: /^-?((?:1[0-7]|[1-9])?\d(?:[,.]\d{1,18})?|180(?:\.0{1,18})?)[,; ][ ]*-?([1-8]?\d(?:[,.]\d{1,18})?|90(?:\.0{1,18})?)$/,
                srid: 'EPSG:4326',
                get: function (matches) {
                    // replace , with .
                    if (matches[1].indexOf(',') !== -1) {
                        matches[1] = matches[1].replace(',', '.');
                    }
                    if (matches[2].indexOf(',') !== -1) {
                        matches[2] = matches[2].replace(',', '.');
                    }
                    return [Number(matches[1]), Number(matches[2])];
                }
            }
        ];
    }
    
    CoordinateParser.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            
        },
        
        test : function (query) {
            var matches, i, len, coords;
            for (i = 0, len = this._formats.length; i < len; i++) {
                matches = query.match(this._formats[i].regexp);
                if (matches && matches.length > 0) {
                    coords = this._formats[i].get(matches);
                    return {
                        'x' : coords[1],
                        'y' : coords[0],
                        'srid' : this._formats[i].srid
                    };
                }
            }
            return false;
        }
    };
    
    return CoordinateParser;
});
