/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol'
], function ($, ol) {

    'use strict';

    function GeoLocation(mapmodule) {
        this._mapmodule = mapmodule;
        this._locator = null;
        this._features = {
            position: this._mapmodule.createMarker(null),
            accuracy: new ol.Feature()
        };
        this._features.position.setStyle(new ol.style.Style({
            text: new ol.style.Text({
                text: '\uf124',
                class: 'fa fa-location-arrow',
                font: 'normal 24px FontAwesome',
                rotation: -45 * Math.PI / 180,
                textBaseline: 'middle',
                fill: new ol.style.Fill({
                    color: '#44C9DA'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 6
                })
            })
        }));
        this._firstposition = true;
        this.init();
    }

    GeoLocation.prototype = {

        init : function () {
            var _this = this;

            this._locator = new ol.Geolocation({
                projection: this._mapmodule.get('map').getView().getProjection(),
                trackingOptions: {
                  enableHighAccuracy: false,
                  maximumAge: 15000,
                  timeout: 30000
                }
            });

            this._features.accuracy.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(51, 153, 204, 0.3)'
                })
            }));

            this._locator.on('change', function () {
                var coordinates = _this._locator.getPosition();
                var rad = _this._locator.getHeading();
                if (rad) {
                    this._mapmodule.get('map').getView().setRotation(rad);
                }
                if (coordinates) {
                    _this._features.position.setGeometry(new ol.geom.Point(coordinates));
                    if (_this._firstposition) {
                      _this._mapmodule.setView('center', [coordinates, 15]);
                      _this._firstposition = false;
                    } else {
                      _this._mapmodule.setView('center', [coordinates]);
                    }
                    _this._mapmodule.get('featureInfo').setPositionInfo(coordinates);
                } else {
                    _this._features.position.setGeometry(null);
                }
            });

            $('#statusbar a.btn-geolocation').on('click', function (e) {
                e.preventDefault();
                if (_this._locator.getTracking()) {
                    _this.disable();
                    $(this).removeClass('active');
                } else {
                    _this.enable();
                    $(this).addClass('active');
                }
            });
        },

        enable : function () {
            var overlay = this._mapmodule.get('overlay');
            overlay.getSource().clear();
            overlay.getSource().addFeatures([this._features.accuracy, this._features.position]);
            this._locator.setTracking(true);
            $('#statusbar .mouse-position a.lock').trigger('click');
        },

        disable : function () {
            var overlay = this._mapmodule.get('overlay');
            this._locator.setTracking(false);
            this._features.position.setGeometry(null);
            this._features.accuracy.setGeometry(null);
            this._mapmodule.get('map').getView().setRotation(0)
            overlay.getSource().clear();
            this._firstposition = true;
        }

    };

    return GeoLocation;

});
