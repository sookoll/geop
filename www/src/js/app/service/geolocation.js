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
            position: new ol.Feature(),
            accuracy: new ol.Feature()
        };
        this.init();
    }
    
    GeoLocation.prototype = {
        
        init : function () {
            var _this = this,
                featuresOverlay;
            
            this._locator = new ol.Geolocation({
                projection: this._mapmodule.get('map').getView().getProjection()
            });
            
            this._features.position.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#3399CC'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            }));
            
            this._locator.on('change:accuracyGeometry', function () {
                _this._features.accuracy.setGeometry(_this._locator.getAccuracyGeometry());
            });

            this._locator.on('change:position', function () {
                var coordinates = _this._locator.getPosition();
                if (coordinates) {
                    _this._features.position.setGeometry(new ol.geom.Point(coordinates));
                    _this._mapmodule.setView('center', [coordinates, 18]);
                } else {
                    _this._features.position.setGeometry(null);
                }
                
            });

            featuresOverlay = new ol.FeatureOverlay({
                map: this._mapmodule.get('map'),
                features: [this._features.accuracy, this._features.position]
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
            this._locator.setTracking(true);
            $('#statusbar .mouse-position a.lock').trigger('click');
        },
        
        disable : function () {
            this._locator.setTracking(false);
            this._features.position.setGeometry(null);
            this._features.accuracy.setGeometry(null);
        }
        
    };

    return GeoLocation;
    
});


