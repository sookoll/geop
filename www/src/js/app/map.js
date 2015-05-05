/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol'
], function ($, ol) {
    
    'use strict';
    
    function Map(config) {
        
        this._config = config;
        this._map = null;
        this._geocoding = null;
        this._baseLayers = {};
        this._vectorLayers = new ol.layer.Group({
            layers: []
        });
    }
    
    Map.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            this.createBaseLayers(this._config.baseLayers);
            this.createMap();
            if (this._config.mouseCoordinates) {
                this.createMouseCoordinatesControl();
            }
            if (this._config.featureInfo) {
                this.createFeatureInfoControl();
            }
        },
        
        createBaseLayers : function (layers) {
            var name;
            for (name in layers) {
                if (layers.hasOwnProperty(name)) {
                    this._baseLayers[name] = new ol.layer.Tile({
                        title: layers[name].title,
                        source: new ol.source.OSM({
                            url: layers[name].url
                        })
                    });
                }
            }
        },
        
        createMap : function () {
            var _this = this;
            this._map = new ol.Map({
                layers : [
                    _this._baseLayers[_this._config.activeBaseLayer],
                    _this._vectorLayers
                ],
                controls : ol.control.defaults({
                    attribution : false,
                    rotate : false,
                    zoom: false
                }),
                target : _this._config.el,
                view : new ol.View({
                    center : _this.transform('point', _this._config.center, 'EPSG:4326', 'EPSG:3857'),
                    zoom : _this._config.zoom,
                    extent : _this.transform('extent', _this._config.extent, 'EPSG:4326', 'EPSG:3857'),
                    minZoom : (_this._config.zoom - 1)
                })
            });
        },
        
        createMouseCoordinatesControl : function () {
            var control = new ol.control.MousePosition({
                coordinateFormat: function (coord) {
                    return ol.coordinate.format(coord, '{y}, {x}', 5);
                },
                projection: 'EPSG:4326',
                className: 'mouse-position small',
                target: 'statusbar',
                undefinedHTML: '&nbsp;'
            });
            this._map.addControl(control);
        },
        
        createFeatureInfoControl : function () {
            var _this = this,
                highlightStyleCache = {},
                highlight,
                featureOverlay,
                displayFeatureInfo;
            
            featureOverlay = new ol.FeatureOverlay({
                map: _this._map,
                style: function (feature, resolution) {
                    var text = feature.get('name');
                    if (!highlightStyleCache[text]) {
                        highlightStyleCache[text] = [new ol.style.Style({
                            text: new ol.style.Text({
                                font: '12px Calibri,sans-serif',
                                text: text,
                                offsetY: -14,
                                fill: new ol.style.Fill({
                                    color: '#000'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: '#fff',
                                    width: 3
                                })
                            })
                        })];
                    }
                    return highlightStyleCache[text];
                }
            });

            displayFeatureInfo = function (pixel) {
                var feature = _this._map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                    return feature;
                });
                if (feature !== highlight) {
                    if (highlight) {
                        featureOverlay.removeFeature(highlight);
                    }
                    if (feature) {
                        featureOverlay.addFeature(feature);
                    }
                    highlight = feature;
                }
            };

            this._map.on('pointermove', function (evt) {
                if (evt.dragging) {
                    return;
                }
                var pixel = _this._map.getEventPixel(evt.originalEvent);
                displayFeatureInfo(pixel);
            });

            this._map.on('click', function (evt) {
                displayFeatureInfo(evt.pixel);
            });
        },
        
        transform : function (method, geom, crs_from, crs_to) {
            switch (method) {
            case 'point':
                geom = ol.proj.transform(geom, crs_from, crs_to);
                break;
            case 'extent':
                geom = ol.proj.transformExtent(geom, crs_from, crs_to);
                break;
            }
            
            return geom;
        },
        
        setView : function (method, params, zoomOnlyIn) {
            var zoom;
            switch (method) {
            case 'bounds':
                this._map.getView().fitExtent(params, this._map.getSize());
                break;
            case 'center':
                if (params[1]) {
                    zoom = params[1];
                    if (zoomOnlyIn && this._map.getView().getZoom() > zoom) {
                        zoom = this._map.getView().getZoom();
                    }
                    this._map.getView().setCenter(params[0]);
                    this._map.getView().setZoom(zoom);
                } else {
                    this._map.getView().setCenter(params[0]);
                }
                break;
            }
        },
        
        getAllFeatures : function () {
            var fset = [];
            this._vectorLayers.getLayers().forEach(function (layer, i) {
                if (layer instanceof ol.layer.Vector) {
                    $.merge(fset, layer.getSource().getFeatures());
                }
            });
            return fset;
        }
        
    };
    
    return Map;
    
});