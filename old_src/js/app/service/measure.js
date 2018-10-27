/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define(['ol', 'jquery'], function (ol, $) {

    'use strict';

    function Measure(mapmodule) {
        var t = this;
        this._name = 'measure';
        this._mapmodule = mapmodule;
        this._map = mapmodule.get('map');
        this._source = new ol.source.Vector();
        this._layer = new ol.layer.Vector({
          source: this._source,
          style: [new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'black',
              width: 1
            })
          }),
          new ol.style.Style({
            image: new ol.style.Circle({
              radius: 4,
              stroke: new ol.style.Stroke({
                color: 'black',
                width: 1
              }),
              fill: new ol.style.Fill({
                color: 'white'
              })
            }),
            geometry: function(feature) {
              if (feature.getGeometry() instanceof ol.geom.LineString) {
                var coordinates = feature.getGeometry().getCoordinates();
                return new ol.geom.MultiPoint(coordinates);
              }
            }
          })]
        });
        this._measureType = null;
        this._drawing = new ol.Feature({
          geometry: new ol.geom.LineString([])
        });
        this._circle = new ol.Feature();
        this._sketch = new ol.Feature({
          geometry: new ol.geom.LineString([])
        });
        this._measureLine = new ol.geom.LineString([]);
        this._snapTolerance = 10;
        this._snapFeatures = null;
        this._snap = null;
        this._modify = new ol.interaction.Modify({
            features: new ol.Collection([this._drawing]),
            insertVertexCondition: function (e) {
              if (t._measureType === 'circle') {
                return ol.events.condition.never(e);
                return false;
              } else {
                return ol.events.condition.always(e);
                return true;
              }
            },
            deleteCondition: function (e) {
              return ol.events.condition.doubleClick(e);
            },
            style: new ol.style.Style({
              image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: 'black',
                  width: 1
                }),
                fill: new ol.style.Fill({
                  color: 'white'
                })
              })
            })
        });
    };

    Measure.prototype = {
        get: function (key) {
            return this['_' + key];
        },

        init: function (coord, type) {
            if (!type) {
              type = 'distance';
            }
            this._measureType = type;
            this.createUi();
            this.reset();
            // get all features
            this._snapFeatures = new ol.Collection(this._mapmodule.getAllFeatures());
            this._drawing.getGeometry().setCoordinates([coord]);
            this._snapFeatures.push(this._drawing);
            if (type === 'circle') {
              this._circle.setGeometry(new ol.geom.Circle(coord));
              //this._snapFeatures.push(this._circle);
              this._source.addFeatures([this._circle, this._drawing, this._sketch]);
            } else {
              this._source.addFeatures([this._drawing, this._sketch]);
            }
            this._mapmodule.get('featureInfo').disableClick();
            this._mapmodule.get('vectorLayers').getLayers().push(this._layer);
            this.enableClick();
            this._map.getInteractions().getArray().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.DoubleClickZoom) {
                    interaction.setActive(false);
                }
            });
        },

        createUi: function () {
            var t = this;
            if (this._el) {
              this._el.alert('close');
            }
            this._el = $('<div class="alert alert-warning alert-dismissible measure" role="alert"></div>');
            this._el.append('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
            this._el.append('<div class="small" />');
            var html = '';
            if (this._measureType === 'circle') {
                html += this.getCircleUI();
            } else {
              html = 'Vahemaa: lõpeta joone viimases punktis';
              html += '<br>Pindala: lõpeta joone alguses';
            }

            this._el.find('div').html(html);
            $('body').append(this._el);
            if (this._measureType === 'circle') {
              this._el.on('focus', 'input', function (e) {
                  t._modify.setActive(false);
              });
              this._el.on('blur', 'input', function (e) {
                  var a = t._el.find('input[name=angle]').val();
                  var r = t._el.find('input[name=radius]').val();
                  var coords = t._drawing.getGeometry().getCoordinates();
                  var coord2 = t.getCoordinateByAngleDistance(coords[0], Number(a), Number(r));
                  t._drawing.getGeometry().setCoordinates([coords[0], coord2]);
                  t._modify.setActive(true);
              });
            }
            this._el.on('closed.bs.alert', function () {
                t.reset();
            });
        },

        getCircleUI: function (coord) {
            return [
              '<div class="form-inline">',
              '<label for="angle">Nurk: </label>',
              '<input type="text" name="angle" class="form-control input-sm" readonly> &deg;',
              '</div><div class="form-inline">',
              '<label for="radius">Raadius: </label>',
              '<input type="text" name="radius" class="form-control input-sm" readonly> m',
              '</div>'
            ].join('');
        },

        enableClick: function () {
            this._map.on('click', this.clicked, this);
            this._map.on('pointermove', this.mousemoved, this);
        },

        disableClick: function () {
            this._map.un('click', this.clicked, this);
            this._map.un('pointermove', this.mousemoved, this);
        },

        clicked: function (e) {
            this._sketch.getGeometry().setCoordinates([]);
            var coords = this._drawing.getGeometry().getCoordinates();
            var coord2 = this.getSnappedCoordinate(e.coordinate, this._snapFeatures.getArray(), this._snapTolerance);
            if (this._measureType === 'circle') {
              var coord1 = coords[0];
              this._drawing.getGeometry().setCoordinates([coord1, coord2]);
              this._el.find('input').prop('readonly', false);
              this.finish();
            } else {
              // clicked first
              if (coords.length > 1 && coords[0][0] === coord2[0] && coords[0][1] === coord2[1]) {
                  coords.push(coord2);
                  this._drawing.getGeometry().setCoordinates(coords);
                  this.finish();
              }
              // clicked last
              else if (coords.length > 1 && coords[coords.length -1][0] === coord2[0] && coords[coords.length -1][1] === coord2[1]) {
                  this.finish();
              }
              // else
              else {
                  coords.push(coord2);
                  this._drawing.getGeometry().setCoordinates(coords);
              }
            }
        },

        mousemoved: function (e) {
            var coords = this._drawing.getGeometry().getCoordinates(),
                coord1, coord2;
            if (this._measureType === 'circle') {
                coord1 = coords[0];
            } else {
                coord1 = coords[coords.length - 1];
            }
            var coord2 = this.getSnappedCoordinate(e.coordinate, this._snapFeatures.getArray(), this._snapTolerance);
            this._sketch.getGeometry().setCoordinates([coord1, coord2]);
            if (this._measureType === 'circle') {
              var r = this.getCoordinatesDistance(coord1, coord2);
              this._circle.getGeometry().setRadius(r);
              this.updateCircleResults();
            } else {
              var arr = coords.slice(0);
              arr.push(coord2);
              this._measureLine.setCoordinates(arr);
              var len = this.formatLength(this._measureLine);
              var html = 'Vahemaa: ' + len;
              html += '<br>Pindala: lõpeta joone alguses';
              this._el.find('div').html(html);
            }
        },

        finish: function () {
            this.disableClick();
            this._sketch.getGeometry().setCoordinates([]);
            this.updateResults();
            this._map.addInteraction(this._modify);
            this._snap = new ol.interaction.Snap({features: this._snapFeatures});
            this._map.addInteraction(this._snap);
            this._drawing.getGeometry().on('change', this.onmodify, this);
        },

        onmodify: function (e) {
            if (this._measureType === 'circle') {
              // _sketch
              var coords = this._drawing.getGeometry().getCoordinates();
              var g = this._circle.getGeometry();
              var r = this.getCoordinatesDistance(coords[0], coords[1]);
              g.setCenter(coords[0]);
              g.setRadius(r);
            }
            this.updateResults();
        },

        reset: function () {
            this._drawing.getGeometry().un('change', this.onmodify, this);
            this._map.removeInteraction(this._modify);
            this._map.removeInteraction(this._snap);
            this._snapFeatures = null;
            this.disableClick();
            this._mapmodule.get('featureInfo').enableClick();
            this._drawing.getGeometry().setCoordinates([]);
            this._sketch.getGeometry().setCoordinates([]);
            if (this._measureType === 'circle') {
                this._circle.setGeometry(null);
            }
            this._source.clear();
            this._mapmodule.get('vectorLayers').getLayers().remove(this._layer);
            this._map.getInteractions().getArray().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.DoubleClickZoom) {
                    interaction.setActive(true);
                }
            });
        },

        getSnappedCoordinate: function (needle, haystack, tolerance) {
            var coord = needle,
                t = this,
                dist,
                i,
                len,
                c,
                test;
            var calculatePxDistance = function (c1, c2) {
              var p1 = t._map.getPixelFromCoordinate(c1);
              var p2 = t._map.getPixelFromCoordinate(c2);
              return t.getCoordinatesDistance(p1, p2);
            }
            for (i = 0, len = haystack.length; i < len; i++) {
              c = haystack[i].getGeometry().getCoordinates();
              // if point
              if (c && typeof c[0] === 'number') {
                  dist = calculatePxDistance(c, needle);
                  if (dist <= tolerance) {
                      coord = c;
                      break;
                  }
              } else {
                  test = c.filter(function (item) {
                    dist = calculatePxDistance(item, needle);
                    if (dist <= tolerance) {
                      return true;
                    }
                  });
                  if (test.length > 0) {
                    coord = test[0];
                  }
              }
            }
            return coord;
        },

        updateResults: function () {
          if (this._measureType === 'circle') {
            this.updateCircleResults();
          } else {
            var len = this.formatLength(this._drawing.getGeometry());
            var html = 'Vahemaa: ' + len;
            var coords = this._drawing.getGeometry().getCoordinates();
            // if closed, calculate area
            if (coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]) {
                var area = this.formatArea(new ol.geom.Polygon([coords]));
                html += '<br>Pindala: ' + area;
            } else {
                html += '<br>Pindala: lõpeta joone alguses';
            }
            this._el.find('div').html(html);
          }
        },

        updateCircleResults: function () {
          var g = this._sketch.getGeometry();
          var coords = g.getCoordinates();
          if (coords.length === 0) {
            g = this._drawing.getGeometry();
            coords = g.getCoordinates();
          }
          var coord1 = coords[0];
          var coord2 = coords[coords.length - 1];
          var angle = this._mapmodule.radToDeg(Math.atan2(coord2[0] - coord1[0], coord2[1] - coord1[1]));
          if (angle < 0) {
            angle = 360 + angle;
          }
          var radius = ol.Sphere.getLength(g);
          this._el.find('input[name=angle]').val(Math.round((angle + 0.00001) * 100) / 100);
          this._el.find('input[name=radius]').val(Math.round((radius + 0.00001) * 1000) / 1000);
        },

        formatLength: function(line) {
            var length = ol.Sphere.getLength(line);
            var output;
            if (length > 10000) {
              output = (Math.round(length / 1000 * 100) / 100) +
                  ' ' + 'km';
            } else {
              output = (Math.round(length * 100) / 100) +
                  ' ' + 'm';
            }
            return output;
        },

        formatArea: function(polygon) {
            var area = ol.Sphere.getArea(polygon);
            var output;
            if (area > 1000000) {
              output = (Math.round(area / 1000000 * 100) / 100) +
                  ' ' + 'km<sup>2</sup>';
            } else {
              output = (Math.round(area * 100) / 100) +
                  ' ' + 'm<sup>2</sup>';
            }
            return output;
        },

        getCoordinateByAngleDistance: function(coord, bearing, distance) {
            // distance in KM, bearing in degrees
            var R = 6378137,
                lonlat = this._mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'),
                brng = this._mapmodule.degToRad(bearing),
                lat = this._mapmodule.degToRad(lonlat[1]),
                lon = this._mapmodule.degToRad(lonlat[0]);
            // Do the math magic
            lat = Math.asin(Math.sin(lat) * Math.cos(distance / R) + Math.cos(lat) * Math.sin(distance / R) * Math.cos(brng));
            lon += Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat), Math.cos(distance/R)-Math.sin(lat)*Math.sin(lat));
            // Coords back to degrees and return
            return this._mapmodule.transform('point', [this._mapmodule.radToDeg(lon),this._mapmodule.radToDeg(lat)], 'EPSG:4326', 'EPSG:3857');
        },

        getCoordinatesDistance: function (coord1, coord2) {
          var a = Math.abs(coord1[0]-coord2[0]);
          var b = Math.abs(coord1[1]-coord2[1]);
          return Math.sqrt(a*a+b*b);
        }
    }

    return Measure;

});
