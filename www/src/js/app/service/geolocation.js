/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol'
], function ($, ol) {

    'use strict';

    function GeoLocation(mapmodule) {
        this._mapmodule = mapmodule;
        this._map = mapmodule.get('map');
        this._view = this._map.getView();
        this._locator = null;
        this._deltaMean = 500; // the geolocation sampling period mean in ms
        this._previousM = 0;
        // Geolocation marker
        this._markerEl = $('<img id="geolocation_marker" />');
        this._markerEl.attr('src', 'css/img/geolocation_marker.png');
        this._features = {
            position: new ol.Overlay({
              positioning: 'center-center',
              element: this._markerEl[0],
              stopEvent: false,
              offset: [0, 0]
            }),
            // FIXME
            anchor: new ol.Overlay({
              positioning: 'center-center',
              element: $('<div style="width:3px;height:3px;background-color:red" />')[0],
              stopEvent: false,
              insertFirst: false,
              offset: [0, 0]
            }),
            // LineString to store the different geolocation positions. This LineString
            // is time aware.
            // The Z dimension is actually used to store the rotation (heading).
            track: new ol.geom.LineString([], ('XYZM')),
            accuracy: new ol.Feature()
        };
        this._features.accuracy.setStyle(new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(51, 153, 204, 0.2)'
            })
        }));
        this.trackingStatus = ['', 'active', 'tracking'];
        this.currentStatus = 0;
        this.firstPosition = true;
        this.init();
    }

    GeoLocation.prototype = {

        init : function () {
            var _this = this;

            // Geolocation Control
            this._locator = new ol.Geolocation({
                projection: this._map.getView().getProjection(),
                trackingOptions: {
                  enableHighAccuracy: true,
                  maximumAge: 10000,
                  timeout: 600000
                }
            });

            // Listen to position changes
            this._locator.on('change', function() {
                var position = this._locator.getPosition();
                var accuracy = this._locator.getAccuracy();
                var heading = this._locator.getHeading() || 0;
                var speed = this._locator.getSpeed() || 0;
                var m = Date.now();

                this.addPosition(position, heading, m, speed);

                var coords = this._features.track.getCoordinates();
                var len = coords.length;
                if (len >= 2) {
                  this._deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
                }

                var html = [
                  'Position: ' + position[0].toFixed(2) + ', ' + position[1].toFixed(2),
                  'Accuracy: ' + accuracy,
                  'Heading: ' + Math.round(this._mapmodule.radToDeg(heading)) + '&deg;',
                  'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h',
                  'Delta: ' + Math.round(this._deltaMean) + 'ms'
                ].join('<br />');
                this._mapmodule.get('featureInfo').setPositionInfo(position);
                //document.getElementById('info').innerHTML = html;
            }, this);

            this._locator.on('error', function() {
              console.error('geolocation error');
              this.disable();
              $('#statusbar a.btn-geolocation').removeClass(_this.trackingStatus.join(' '));
            }, this);

            $('#statusbar a.btn-geolocation').on('click', function (e) {
                e.preventDefault();
                _this.currentStatus = (_this.currentStatus + 1 >= _this.trackingStatus.length) ? 0 : _this.currentStatus + 1;
                if (_this.currentStatus === 0) {
                    _this.disable();
                    $(this).removeClass(_this.trackingStatus.join(' '));
                } else {
                    _this.enable();
                    $(this).addClass(_this.trackingStatus[_this.currentStatus]);
                }
            });
        },

        enable : function () {
            if (this.trackingStatus[this.currentStatus] === 'active') {
              var overlay = this._mapmodule.get('overlay');
              overlay.getSource().clear();
              overlay.getSource().addFeatures([this._features.accuracy]);
              this._map.addOverlay(this._features.position);
              // FIXME
              this._map.addOverlay(this._features.anchor);

              this._locator.setTracking(true);
              $('#statusbar .mouse-position a.lock').trigger('click');

              this._view.on('change:rotation', this.rotateMarker, this);

            } else if (this.trackingStatus[this.currentStatus] === 'tracking') {
              this._view.un('change:rotation', this.rotateMarker, this);
              this._markerEl.css({
                  "-webkit-transform": "rotate(0rad)",
                  "-moz-transform": "rotate(0rad)",
                  "transform": "rotate(0rad)"
              });
              this._map.on('pointerdrag', this.disableTracking, this);
              this._map.on('postcompose', this.updateView, this);
              this._map.render();
            }
        },

        disable : function () {
            var overlay = this._mapmodule.get('overlay');
            this._locator.setTracking(false);
            this._features.position.setPosition(null);
            this._features.accuracy.setGeometry(null);
            this._mapmodule.get('map').getView().setRotation(0);
            overlay.getSource().clear();
            this._map.un('postcompose', this.updateView, this);
            this._map.un('pointerdrag', this.disableTracking, this);
            this._markerEl.css({
                "-webkit-transform": "rotate(0rad)",
                "-moz-transform": "rotate(0rad)",
                "transform": "rotate(0rad)"
            });
            this.firstPosition = true;
        },

        disableTracking: function () {
            this._map.un('postcompose', this.updateView, this);
            this._map.un('pointerdrag', this.disableTracking, this);
            this._view.on('change:rotation', this.rotateMarker, this);

            $('#statusbar a.btn-geolocation').removeClass(this.trackingStatus[this.currentStatus]);
            this.currentStatus = this.trackingStatus.indexOf('active');
        },

        // modulo for negative values
        mod: function (n) {
          return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        },

        addPosition: function (position, heading, m, speed) {
            var x = position[0];
            var y = position[1];
            var fCoords = this._features.track.getCoordinates();
            var previous = fCoords[fCoords.length - 1];
            var prevHeading = previous && previous[2];
            if (prevHeading) {
                var headingDiff = heading - this.mod(prevHeading);
                // force the rotation change to be less than 180°
                if (Math.abs(headingDiff) > Math.PI) {
                    var sign = (headingDiff >= 0) ? 1 : -1;
                    headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
                }
                heading = prevHeading + headingDiff;
            }
            this._features.track.appendCoordinate([x, y, heading, m]);
            // only keep the 20 last coordinates
            this._features.track.setCoordinates(this._features.track.getCoordinates().slice(-20));

            // if not tracking, then set position
            if (this.trackingStatus[this.currentStatus] === 'active') {
              this._features.position.setPosition([x, y]);
              // FIXME
              this._features.anchor.setPosition([x, y]);

              if (this.firstPosition) {
                  this._view.setCenter([x, y]);
                  this.firstPosition = false;
              }
            }

            if (speed) {
                this._markerEl.attr('src', 'css/img/geolocation_marker_heading.png');
                // if not tracking, then rotate icon
                if (this.trackingStatus[this.currentStatus] === 'active') {
                    var viewRotation = this._view.getRotation();
                    heading = viewRotation - heading;
                    this._markerEl.css({
                        "-webkit-transform": "rotate("+heading+"rad)",
                        "-moz-transform": "rotate("+heading+"rad)",
                        "transform": "rotate("+heading+"rad)"
                    });
                }
            } else {
                this._markerEl.attr('src', 'css/img/geolocation_marker.png');
            }
        },

        // recenters the view by putting the given coordinates at 3/4 from the top or
        // the screen
        getCenterWithHeading: function (position, rotation, resolution) {
          var size = this._map.getSize();
          var height = size[1];
          return [
            position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
            position[1] + Math.cos(rotation) * height * resolution * 1 / 4
          ];
        },

        updateView: function () {
          // use sampling period to get a smooth transition
          var m = Date.now() - this._deltaMean * 1.5;
          m = Math.max(m, this._previousM);
          this._previousM = m;
          // interpolate position along positions LineString
          var c = this._features.track.getCoordinateAtM(m, true);
          if (c) {
            this._view.setCenter(this.getCenterWithHeading(c, -c[2], this._view.getResolution()));
            this._view.setRotation(-c[2]);
            this._features.position.setPosition(c);
          }
        },

        rotateMarker: function () {
          var viewRotation = this._view.getRotation();
          this._markerEl.css({
              "-webkit-transform": "rotate("+viewRotation+"rad)",
              "-moz-transform": "rotate("+viewRotation+"rad)",
              "transform": "rotate("+viewRotation+"rad)"
          });
        }
    };

    return GeoLocation;
});
