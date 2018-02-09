/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol',
    'app/service/search/nominatim'
], function ($, ol, Nominatim) {

    'use strict';

    function FeatureInfo(mapmodule) {
        this._mapmodule = mapmodule;
        this._map = mapmodule.get('map');
        this._geocode = new Nominatim(mapmodule);
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

            // listen lock events
            $('#statusbar .geolocation a.unlock').on('click', function (e) {
                e.preventDefault();
                $('#statusbar .geolocation').addClass('hidden').find('div').empty();
                $('#statusbar .mouse-position').removeClass('hidden');
            });
            $('#statusbar .mouse-position a.lock').on('click', function (e) {
                e.preventDefault();
                $('#statusbar .mouse-position').addClass('hidden');
                $('#statusbar .geolocation').removeClass('hidden');
            });
        },

        createFeatureTooltip : function () {
            var _this = this,
                tooltipVisible = false;

            this._tooltip = new ol.layer.Vector({
                map: _this._map,
                source: new ol.source.Vector({
                    features: []
                }),
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
                    return;
                }
                var pixel = _this._map.getEventPixel(e.originalEvent),
                    hit = _this._map.hasFeatureAtPixel(pixel);

                if (hit) {
                    _this._map.getTarget().style.cursor = 'pointer';
                    tooltipVisible = _this.showTooltip(e.pixel);
                } else {
                    _this._map.getTarget().style.cursor = hit ? 'pointer' : '';
                    tooltipVisible = _this.showTooltip();
                }

            });
        },

        showTooltip : function (px) {
            // if !px then remove tooltip and return false
            if (!px) {
                this._tooltip.getSource().clear();
                this._highlight = null;
                return false;
            }
            // get feature
            var feature = this._map.forEachFeatureAtPixel(px, function (feature, layer) {
                return feature;
            });
            // if not same feature
            if (feature !== this._highlight) {
                this._tooltip.getSource().clear();
                this._tooltip.getSource().addFeatures([feature]);
                this._highlight = feature;
            }
            return true;
        },

        createFeatureInfo : function () {
            this._popup = $('<div id="popup"></div>');
            this._overlay = new ol.Overlay({
                element: this._popup[0],
                autoPan: true,
                positioning: 'center-center',
                offset: [0, -16]
            });
            this._map.addOverlay(this._overlay);
            this.enableClick();
        },

        enableClick: function () {
            this._map.on('click', this.clicked, this);
        },

        disableClick: function () {
            this._map.un('click', this.clicked, this);
        },

        clicked: function (e) {
            var geometry, pop_content,
                coord = e.coordinate,
                feature = this._map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                    if (layer) {
                      return [layer, feature];
                    }
                });

            this._popup.popover('destroy');
            if (feature) {
                // remove tooltip
                this._tooltip.getSource().clear();
                // if point, then geometry coords
                if (feature[1].getGeometry().getType() === 'Point') {
                    coord = feature[1].getGeometry().getCoordinates();
                }
                if (feature[0] && this._infoHandlers[feature[0].get('name')]) {
                    pop_content = this._infoHandlers[feature[0].get('name')](feature[1]);
                    this._overlay.setOffset([0, -12]);
                } else {
                    pop_content = this.getContent(feature[1], feature[0]);
                    this._overlay.setOffset([0, -18]);
                }
                this._overlay.setPosition(coord);
                this._popup.popover(pop_content.definition).popover('show');
                // when popover's content is shown
                this._popup.on('shown.bs.popover', function (e) {
                    pop_content.onShow(feature, e);
                });
                // when popover's content is hidden
                this._popup.on('hidden.bs.popover', pop_content.onHide);
                this._popup.popover('show');
            } else if ($('#statusbar .mouse-position').hasClass('hidden')) {
                // capture coordinates
                this.setPositionInfo(coord);
            }
        },

        getContent : function (feature, layer) {
            var t = this;
            if (feature) {
                var prop = feature.getProperties(), key, content = [];
                for (key in prop) {
                    if (prop.hasOwnProperty(key) && (typeof prop[key] === 'string' || typeof prop[key] === 'number')) {
                        content.push(key + ': ' + prop[key]);
                    }
                }
                var title = '<i class="fa fa-map-marker"></i> Kaardiobjekt<a href="#" class="remove-marker" title="Eemalda"><i class="fa fa-trash"></i></a>';
                return {
                    'definition' : {
                        'placement': 'top',
                        'animation': false,
                        'html': true,
                        'title': title,
                        'content': '<div class="small">' + content.join('<br>') + '</div>'
                    },
                    'onShow' : function (f, e) {
                        $(e.currentTarget.nextSibling).on('click', '.remove-marker', function (e) {
                            e.preventDefault();
                            if (f[0]) {
                                f[0].getSource().removeFeature(f[1]);
                                t._popup.popover('destroy');
                            }

                        })
                    },
                    'onHide' : function () {}
                };
            }
        },

        setPositionInfo : function (coord) {
            var _this = this;
            $('#statusbar .geolocation').find('div').html(function () {
                var formatted = ol.coordinate.format(_this._mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'), '{y}, {x}', 5);
                return ' ' + formatted;
            });
            // reversed geocode
            // zoom = this._mapmodule.get('map').getView().getZoom()
            this._geocode.reverse(
                this._mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'),
                this._mapmodule.get('map').getView().getZoom(),
                function (result) {
                    if (result && result.display_name) {
                        $('<i class="text-muted hidden-xs" style="display:none"> &mdash; ' + result.display_name + '</i>')
                            .appendTo('#statusbar .geolocation div')
                            .fadeIn();
                    }
                }
            );
        }

    };

    return FeatureInfo;

});
