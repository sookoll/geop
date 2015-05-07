/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol',
], function ($, ol) {
    
    'use strict';
    
    var Export = function (settings) {
        
        this._settings = settings;
        
        var exportGPXElement = $('#export-gpx');
        var vectorSource = pointLayer.getSource();
        
        exportGPXElement.on('click', function (e) {
            //e.preventDefault();
            var features = [];
            var line = [];
            var i = 0;
            vectorSource.forEachFeature(function (feature) {
                var clone = feature.clone();
                clone.getGeometry().transform('EPSG:3857', 'EPSG:4326');
                features.push(clone);
                if (i < 30) {
                    line.push(clone.getGeometry().getCoordinates());
                }
                i++;
            });
            features.push(new ol.Feature({
                geometry: new ol.geom.LineString(line),
                name: 'Route'
            }));
            var string = new ol.format.GPX().writeFeatures(features);
            var base64 = Util.strToBase64(string);
            exportGPXElement.attr('href', 'data:text/gpx+xml;base64,' + base64);
        });
    }

    return Export;
    
});