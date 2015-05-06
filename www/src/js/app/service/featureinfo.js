/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol'
], function ($, ol) {
    
    'use strict';
    
    function FeatureInfo(mapmodule) {
        
        this._mapmodule = mapmodule;
        this._map = mapmodule.get('map');
        this._tooltip = null;
        this._styleCache = {};
        this._highlight = null;
        
        this._popup = null;
        
        this.init();
    }
    
    FeatureInfo.prototype = {
        
        init : function () {
            this.createFeatureTooltip();
            this.createFeatureInfo();
        },
        
        createFeatureTooltip : function () {
            var _this = this;
            
            this._tooltip = new ol.FeatureOverlay({
                map: _this._map,
                style: function (feature, resolution) {
                    var text = feature.get('name');
                    if (!_this._styleCache[text]) {
                        _this._styleCache[text] = [new ol.style.Style({
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
                    return _this._styleCache[text];
                }
            });
            
            this._map.on('pointermove', function (e) {
                if (e.dragging) {
                    if (_this._popup) {
                        _this._popup.popover('hide');
                    }
                    return;
                }
                var pixel = _this._map.getEventPixel(e.originalEvent),
                    hit = _this._map.hasFeatureAtPixel(pixel);
                _this._map.getTarget().style.cursor = hit ? 'pointer' : '';
                _this.featureTooltip(e.pixel);
            });
        },
        
        featureTooltip : function (px) {
            var feature = this._map.forEachFeatureAtPixel(px, function (feature, layer) {
                return feature;
            });
            if (feature !== this._highlight) {
                if (this._highlight) {
                    this._tooltip.removeFeature(this._highlight);
                }
                if (feature) {
                    this._tooltip.addFeature(feature);
                }
                this._highlight = feature;
            }
        },
        
        createFeatureInfo : function () {
            var _this = this, overlay;
            this._popup = $('<div id="popup"></div>');
            
            overlay = new ol.Overlay({
                element: this._popup[0],
                autoPan: true,
                positioning: 'center-center',
                offset: [0, -10]
            });
            _this._map.addOverlay(overlay);

            // display popup on click
            _this._map.on('click', function (e) {
                var geometry, coord,
                    feature = _this._map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                        return feature;
                    });
                _this._popup.popover('destroy');
                
                if (feature && feature.get('name')) {
                    // remove tooltip
                    _this._tooltip.removeFeature(_this._highlight);
                    
                    geometry = feature.getGeometry();
                    coord = geometry.getCoordinates();
                    overlay.setPosition(coord);
                    _this._popup.popover({
                        'placement': 'top',
                        'animation': false,
                        'html': true,
                        'title': '<i class="fa fa-cube"></i> ' + feature.get('name'),
                        'content': function () {
                            return _this.getContent(feature);
                        }
                    }).popover('show');
                    
                    
                } else {
                    _this._popup.popover('hide');
                }
            });

        },
        
        getContent : function (feature) {
            
        }
        
    };

    return FeatureInfo;
    
});