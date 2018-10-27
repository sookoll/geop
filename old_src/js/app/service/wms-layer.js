/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol',
    'templator',
    'text!tmpl/service/wms-layers.html',
    'text!tmpl/service/wms-modal.html'
], function ($, ol, Templator, tmpl_wms, tmpl_wmsmodal) {

    'use strict';

    var WMSLayer = function (el, mapmodule) {

        this._parentEl = el;
        this._mapmodule = mapmodule;
        this._layer_conf = {
            type: 'TileWMS',
            url: null,
            projection: 'EPSG:3301',
            gutter: 20,
            crossOrigin: null
        };
        this._layer_conf_params = {
            LAYERS: null,
            TILED: true,
            FORMAT: 'image/png',
            VERSION: '1.1.1'
        };

        this._tmpl = {
            layers: Templator.compile(tmpl_wms),
            modal: Templator.compile(tmpl_wmsmodal)
        };

        this._layers = [];
        this._el = this.render(this._layers);

        this._modal = $(this._tmpl.modal({
            title: 'Lisa WMS kiht',
            confirm: 'Lisa'
        }));

        this.defaultStyle = {
            'Point': [new ol.style.Style({
              text: new ol.style.Text({
                  text: '\uf276',
                  font: 'normal 16px FontAwesome',
                  textBaseline: 'bottom',
                  fill: new ol.style.Fill({
                      color: 'black'
                  }),
                  stroke: new ol.style.Stroke({
                      color: '#fff',
                      width: 4
                  })
              })
            })],
            'LineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#f0f',
                    width: 3
                })
            })],
            'Polygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0,255,255,0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#0ff',
                    width: 1
                })
            })],
            'MultiPoint': [new ol.style.Style({
              text: new ol.style.Text({
                  text: '\uf276',
                  font: 'normal 16px FontAwesome',
                  textBaseline: 'bottom',
                  fill: new ol.style.Fill({
                      color: 'black'
                  }),
                  stroke: new ol.style.Stroke({
                      color: '#fff',
                      width: 4
                  })
              })
            })],
            'MultiLineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#f0f',
                    width: 1
                })
            })],
            'MultiPolygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0,0,255,0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#00f',
                    width: 1
                })
            })]
        };

        $('body').append(this._modal);

        this._modal.on('click', 'button.confirm', $.proxy(function (e) {
            e.preventDefault();
            var layer = this.createLayer(this._modal.find('textarea').val().trim());
            if (layer) {
                this.addLayer(layer);
                this._modal.find('textarea').val('');
                this._modal.modal('hide');
            }
        }, this));

        this._parentEl.on('click', 'li.wms-layer a.toggle-layer', $.proxy(function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(e.currentTarget).children('i').toggleClass('fa-check-square-o fa-square-o');
            this.toggleLayer($(e.currentTarget).data('id'));
        }, this));

        this._parentEl.on('click', 'li.wms-layer a.remove-layer', $.proxy(function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.removeLayer($(e.currentTarget).data('id'));
        }, this));

        this._parentEl.on('click', 'a.add-gpx-layer', $.proxy(function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(e.target).closest('li').find('input').trigger('click');
        }, this));

        this._parentEl.on('change', 'input.gpx-input', $.proxy(function (e) {
            var files = e.target.files,
                this_ = this;
            if (files && files[0] && files[0].name.split('.').pop().toLowerCase() === 'gpx') {
              var reader = new FileReader();
              reader.onload = function (e) {
                this_.createGPXLayer(files[0].name, e.target.result);
              }
              reader.readAsText(files[0]);
            }
        }, this));

    };

    WMSLayer.prototype = {

        get : function (key) {
            return this['_' + key];
        },

        // http://kaart.maaamet.ee/wms/alus?layers=TOPOYKSUS_6569,TOPOYKSUS_7793&SRS=EPSG:3301
        createLayer : function (url) {
            var conf = null,
                params = null,
                layer = null,
                components = null,
                querystring = null;
            // parse url
            if (this.isUrlValid(url)) {
                components = this.parseUrl(url);
                conf = $.extend({}, this._layer_conf);
                conf.params = $.extend({}, this._layer_conf_params);
                // layers
                if (components.query.LAYERS || components.query.layers) {
                    conf.params.LAYERS = components.query.LAYERS || components.query.layers;
                    delete components.query.LAYERS;
                    delete components.query.layers;
                } else {
                    alert('WMS aadress peab sisaldama LAYERS parameetrit');
                    return;
                }
                if (components.query.SRS || components.query.srs) {
                    conf.projection = components.query.srs || components.query.SRS;
                    delete components.query.SRS;
                    delete components.query.srs;
                } else {
                    alert('WMS aadress peab sisaldama SRS parameetrit');
                    return;
                }
                querystring = Object.keys(components.query).map(function (item) {
                    return item + '=' + components.query;
                }).join('&');
                conf.url = components.protocol + '//' + components.host + components.pathname + '?' + querystring;
                conf.id = this.uuid();
                conf.title = 'Kiht ' + (this._layers.length + 1);
                return this._mapmodule.createTileLayer(conf);
            }
        },

        createGPXLayer: function (filename, content) {
          var format = new ol.format.GPX(),
            this_ = this;
          var gpxFeatures = format.readFeatures(content, {
            dataProjection:'EPSG:4326',
            featureProjection:'EPSG:3857'
          });
          if (gpxFeatures.length > 0) {
            var fileLayer = new ol.layer.Vector({
              id: filename,
              title: filename,
              source: new ol.source.Vector({
                features: gpxFeatures
              }),
              style: function (feature, resolution) {
                var featureStyleFunction = feature.getStyleFunction();
                if (featureStyleFunction) {
                  return featureStyleFunction.call(feature, resolution);
                } else {
                  return this_.defaultStyle[feature.getGeometry().getType()];
                }
              }
            });
            this.addLayer(fileLayer);
          }
        },

        addLayer: function (layer) {
            this._layers.push(layer);
            this._mapmodule.get('vectorLayers').getLayers().push(layer);
            if (this._el) {
                this._el.remove();
            }
            this._el = this.render(this._layers);
        },

        render: function (lset) {
            var el = $(this._tmpl.layers({
                title: 'Lisa WMS kiht',
                title_gpx: 'Lisa GPX kiht',
                layers: lset.map(function (item) {
                    //console.log(item.getSource().getParams())
                    return {
                        id: item.get('id'),
                        title: item.get('title'),
                        checked: item.getVisible() ? 'fa-check-square-o' : 'fa-square-o'
                    }
                })
            }));
            this._parentEl.append(el);
            return el;
        },

        toggleLayer: function (id) {
            var layer = this._layers.find(function (item) {
                return item.get('id') === id;
            });
            if (layer) {
                layer.setVisible(!layer.getVisible());
            }
        },

        removeLayer: function (id) {
            var layer = this._layers.find(function (item) {
                return item.get('id') === id;
            });
            if (layer) {
                this._mapmodule.get('vectorLayers').getLayers().remove(layer);
                this._layers.splice(this._layers.indexOf(layer), 1);
                if (this._el) {
                    this._el.remove();
                }
                this._el = this.render(this._layers);
            }
        },

        isUrlValid: function (userInput) {
            var res = userInput.match(/(http(s)?:\/\/.)?(www\.)?[\-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([\-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
            return (res !== null);
        },

        /**
         * parser.protocol; // => "http:"
         * parser.hostname; // => "example.com"
         * parser.port;     // => "3000"
         * parser.pathname; // => "/pathname/"
         * parser.search;   // => "?search=test"
         * parser.hash;     // => "#hash"
         * parser.host;     // => "example.com:3000"
         */
        parseUrl: function (url) {
            var parser = document.createElement('a');
            parser.href = url;
            return {
                protocol: parser.protocol,
                hostname: parser.hostname,
                port: parser.port,
                pathname: parser.pathname,
                search: parser.search,
                hash: parser.hash,
                host: parser.host,
                query: JSON.parse('{"' + parser.search.substr(1).replace(/&/g, '","').replace(/=/g,'":"') + '"}', function (key, value) {
                    return key===""?value:decodeURIComponent(value);
                })
            };
        },

        uuid: function () {
            return Math.random().toString(36).substr(2, 10);
        }

    };

    return WMSLayer;

});
