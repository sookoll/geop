/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol',
    'app/util'
], function ($, ol, Util) {
    
    'use strict';
    
    var Import = function (settings) {
        
        this._settings = settings;
        var defaultStyle = {
            'Point': [new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,0,0.5)'
                    }),
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: '#ff0',
                        width: 1
                    })
                })
            })],
            'LineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#f0f',
                    width: 3
                })
            })],
            'Polygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0,255,255,0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#0ff',
                    width: 1
                })
            })],
            'MultiPoint': [new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,255,0.5)'
                    }),
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: '#f0f',
                        width: 1
                    })
                })
            })],
            'MultiLineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#f0f',
                    width: 1
                })
            })],
            'MultiPolygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0,0,255,0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#00f',
                    width: 1
                })
            })]
        };
        
        var styleFunction = function (feature, resolution) {
            var featureStyleFunction = feature.getStyleFunction();
            if (featureStyleFunction) {
                return featureStyleFunction.call(feature, resolution);
            } else {
                return defaultStyle[feature.getGeometry().getType()];
            }
        };

        var dragAndDropInteraction = new ol.interaction.DragAndDrop({
            formatConstructors: [
            ol.format.GPX,
            ol.format.GeoJSON
          ]
        });
        
        // TODO: add interaction to map
        // interactions: ol.interaction.defaults().extend([dragAndDropInteraction])
        
        dragAndDropInteraction.on('addfeatures', function (event) {
            var vectorSource = new ol.source.Vector({
                features: event.features,
                projection: event.projection
            });
            map.getLayers().push(new ol.layer.Vector({
                source: vectorSource,
                style: styleFunction
            }));
            var view = map.getView();
            view.fitExtent(
                vectorSource.getExtent(), /** @type {ol.Size} */ (map.getSize()));
        });
        
    }

    return Import;
    
});