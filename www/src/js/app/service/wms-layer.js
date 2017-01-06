/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'templator',
    'text!tmpl/service/wms-layers.html',
    'text!tmpl/service/wms-modal.html'
], function ($, Templator, tmpl_wms, tmpl_wmsmodal) {

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
