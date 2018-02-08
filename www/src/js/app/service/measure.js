/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define(['ol', 'jquery'], function (ol, $) {

    'use strict';

    function Measure(mapmodule) {
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
              var coordinates = feature.getGeometry().getCoordinates();
              return new ol.geom.MultiPoint(coordinates);
            }
          })]
        });
        this._drawing = new ol.Feature({
          geometry: new ol.geom.LineString([])
        });
        this._sketch = new ol.Feature({
          geometry: new ol.geom.LineString([])
        });
        this._snap = 10;
        this._modify = new ol.interaction.Modify({
            features: new ol.Collection([this._drawing]),
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

        init: function (coord) {
            this.createUi();
            this.reset();
            this._mapmodule.get('featureInfo').disableClick();
            this._mapmodule.get('vectorLayers').getLayers().push(this._layer);
            this._source.addFeatures([this._drawing, this._sketch]);
            if (coord) {
                this._drawing.getGeometry().setCoordinates([coord]);
            }
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
            var html = 'Vahemaa: lõpeta joone viimases punktis';
            html += '<br>Pindala: lõpeta joone alguses';
            this._el.find('div').html(html);
            $('body').append(this._el);
            this._el.on('closed.bs.alert', function () {
                t.reset();
            });
        },

        enableClick: function () {
            this._map.on('singleclick', this.clicked, this);
            this._map.on('pointermove', this.mousemoved, this);
        },

        disableClick: function () {
            this._map.un('singleclick', this.clicked, this);
            this._map.un('pointermove', this.mousemoved, this);
        },

        clicked: function (e) {
            var coords = this._drawing.getGeometry().getCoordinates();
            var coord2 = this.getSnappedCoordinate(e.coordinate, coords, this._snap);
            this._sketch.getGeometry().setCoordinates([]);
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
        },

        mousemoved: function (e) {
            var coords = this._drawing.getGeometry().getCoordinates();
            var coord1 = coords[coords.length - 1];
            var coord2 = this.getSnappedCoordinate(e.coordinate, coords, this._snap);
            this._sketch.getGeometry().setCoordinates([coord1, coord2]);
            var arr = coords.slice(0);
            arr.push(coord2);
            var len = this.formatLength(new ol.geom.LineString(arr));
            var html = 'Vahemaa: ' + len;
            html += '<br>Pindala: lõpeta joone alguses';
            this._el.find('div').html(html);
        },

        finish: function () {
            this.disableClick();
            this._sketch.getGeometry().setCoordinates([]);
            this.updateResults();
            this._map.addInteraction(this._modify);
            this._drawing.getGeometry().on('change', this.updateResults, this);
        },

        reset: function () {
            this._drawing.getGeometry().un('change', this.updateResults, this);
            this._map.removeInteraction(this._modify);
            this.disableClick();
            this._mapmodule.get('featureInfo').enableClick();
            this._drawing.getGeometry().setCoordinates([]);
            this._sketch.getGeometry().setCoordinates([]);
            this._source.clear();
            this._mapmodule.get('vectorLayers').getLayers().remove(this._layer);
            this._map.getInteractions().getArray().forEach(function (interaction) {
                if (interaction instanceof ol.interaction.DoubleClickZoom) {
                    interaction.setActive(true);
                }
            });
        },

        getSnappedCoordinate: function (needle, haystack, tolerance) {
            var coord = needle;
            var p2 = this._map.getPixelFromCoordinate(needle);
            var t = this;
            haystack.forEach(function (item) {
                var p1 = t._map.getPixelFromCoordinate(item);
                var a = Math.abs(p1[0]-p2[0]);
                var b = Math.abs(p1[1]-p2[1]);
                var dist = Math.sqrt(a*a+b*b);
                if (dist <= tolerance) {
                    coord = item;
                }
            });
            return coord;
        },

        updateResults: function () {
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
        }
    }

    return Measure;

});
