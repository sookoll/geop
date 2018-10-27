/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'ol'
], function (ol) {

    'use strict';

    var Import = function (mapmodule) {
        var map = mapmodule.get('map'),
            defaultStyle = {
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
            },
            styleFunction = function (feature, resolution) {
                var featureStyleFunction = feature.getStyleFunction();
                if (featureStyleFunction) {
                    return featureStyleFunction.call(feature, resolution);
                } else {
                    return defaultStyle[feature.getGeometry().getType()];
                }
            },
            dragAndDropInteraction = new ol.interaction.DragAndDrop({
                formatConstructors: [
                    ol.format.GPX,
                    ol.format.GeoJSON
                ]
            }),
            layer = new ol.layer.Group({
                layers: []
            }),
            extent = [];

        map.getLayers().push(layer);
        map.addInteraction(dragAndDropInteraction);

        dragAndDropInteraction.on('addfeatures', function (event) {
            var fileLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: event.features,
                    projection: event.projection
                }),
                style: styleFunction
            });
            layer.getLayers().push(fileLayer);
            if (extent.length === 4) {
                ol.extent.extend(extent, fileLayer.getSource().getExtent());
            } else {
                extent = fileLayer.getSource().getExtent();
            }
            mapmodule.setView('bounds', extent);
        });

    };

    return Import;

});
