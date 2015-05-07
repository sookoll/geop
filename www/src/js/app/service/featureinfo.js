/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol'
], function ($, ol, Templator, tmpl_info) {
    
    'use strict';
    
    function FeatureInfo(mapmodule) {
        this._map = mapmodule.get('map');
        this._tooltip = null;
        this._styleCache = {};
        this._highlight = null;
        this._popup = null;
        this._infoHandlers = {};
        this.init();
    }
    
    FeatureInfo.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
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
                autoPanMargin: 50,
                positioning: 'center-center',
                offset: [0, -10]
            });
            _this._map.addOverlay(overlay);

            // display popup on click
            _this._map.on('click', function (e) {
                var geometry, pop_content,
                    coord = e.coordinate,
                    feature = _this._map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                        return [layer, feature];
                    });
                _this._popup.popover('destroy');
                
                if (feature) {
                    // remove tooltip
                    _this._tooltip.removeFeature(_this._highlight);
                    // if point, then geometry coords
                    if (feature[1].getGeometry().getType() === 'Point') {
                        coord = feature[1].getGeometry().getCoordinates();
                    }
                    
                    overlay.setPosition(coord);
                    
                    if (feature[0] && _this._infoHandlers[feature[0].get('name')]) {
                        pop_content = _this._infoHandlers[feature[0].get('name')](feature[1]);
                    } else {
                        pop_content = _this.getContent(feature[1]);
                    }
                    
                    _this._popup.popover(pop_content.definition).popover('show');
                    // when popover's content is shown
                    _this._popup.on('shown.bs.popover', function () {
                        pop_content.onShow(feature[1]);
                    });
                    // when popover's content is hidden
                    _this._popup.on('hidden.bs.popover', pop_content.onHide);
                    _this._popup.popover('show');
                    
                } else {
                    _this._popup.popover('hide');
                }
            });

        },
        
        getContent : function (feature) {
            var prop = feature.getProperties(), key, content = [];
            for (key in prop) {
                if (prop.hasOwnProperty(key) && (typeof prop[key] === 'string' || typeof prop[key] === 'number')) {
                    content.push(key + ': ' + prop[key]);
                }
            }
            return {
                'definition' : {
                    'placement': 'top',
                    'animation': false,
                    'html': true,
                    'title': '<i class="fa fa-map-marker"></i> Kaardiobjekt',
                    'content': '<div class="small">' + content.join('<br>') + '</div>'
                },
                'onShow' : function () {},
                'onHide' : function () {}
            };
        }
        
    };

    return FeatureInfo;
    
});