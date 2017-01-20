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
        this._firstposition = true;
        this.init();
    }

    GeoLocation.prototype = {

        init : function () {
            var _this = this;

            this._locator = new ol.Geolocation({
                projection: this._mapmodule.get('map').getView().getProjection(),
                trackingOptions: {
                  enableHighAccuracy: true,
                  maximumAge: 0
                }
            });

            this._features.accuracy.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(51, 153, 204, 0.3)'
                })
            }));

            /*this._locator.on('change:accuracyGeometry', function () {
                _this._features.accuracy.setGeometry(_this._locator.getAccuracyGeometry());
            });*/

            this._locator.on('change:position', function () {
                var coordinates = _this._locator.getPosition();
                if (coordinates) {
                    _this._features.position.setGeometry(new ol.geom.Point(coordinates));
                    if (_this._firstposition) {
                      _this._mapmodule.setView('center', [coordinates, 15]);
                      _this._firstposition = false;
                    } else {
                      _this._mapmodule.setView('center', [coordinates]);
                    }
                } else {
                    _this._features.position.setGeometry(null);
                }
            });

            this._locator.on('change:heading', function () {
                var rad = _this._locator.getHeading();
                if (rad) {
                    this._mapmodule.get('map').getView().setRotation(rad)
                }
            });

            this._locator.on('change', function () {
                _this._mapmodule.get('featureInfo').setPositionInfo(_this._locator.getPosition());
            });
            // handle geolocation error.
            this._locator.on('error', function (error) {
                //var info = document.getElementById('info');
                //info.innerHTML = error.message;
                //info.style.display = '';
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
