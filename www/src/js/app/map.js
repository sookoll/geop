/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol',
    'proj4',
    'templator',
    'app/service/featureinfo',
    'app/service/geolocation',
    'text!tmpl/map/layerswitcher.html'
], function ($, ol, proj4, Templator, FeatureInfo, GeoLocation, tmpl_layerswitcher) {

    'use strict';

    ol.proj.setProj4(proj4);
    proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:32634", "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs");
    proj4.defs("EPSG:32635", "+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs");

    function Map(config) {

        var proj3301 = ol.proj.get('EPSG:3301');
        proj3301.setExtent([40500, 5993000, 1064500, 7017000]);

        this._config = config;
        this._map = null;
        this._baseLayers = new ol.layer.Group({
            layers: []
        });
        this._vectorLayers = new ol.layer.Group({
            layers: []
        });
        this._activeBaseLayer = null;
        this._el = null;
        this._featureInfo = null;
        this._geoLocation = null;
        this._controls = {
            mouseCoordinates : null
        };
        this._overlay = null;
        this._shouldUpdate = true;
    }

    Map.prototype = {

        get : function (key) {
            return this['_' + key];
        },

        init : function () {
            var permalink = this.getPermalink();
            this.createBaseLayers(this._config.baseLayers, permalink);
            this.createMap(permalink);
            this.createLayerSwitcher(this._config.baseLayers, permalink);
            if (this._config.mouseCoordinates) {
                this.createMouseCoordinatesControl();
            }
            if (this._config.scaleLine) {
                this.createScaleLineControl();
            }
            if (this._config.featureInfo) {
                this._featureInfo = new FeatureInfo(this);
            }
            this._overlay = new ol.layer.Vector({
                map: this._map,
                source: new ol.source.Vector({
                    features: [],
                    useSpatialIndex: false
                }),
                updateWhileAnimating: true,
                updateWhileInteracting: false
            });
            if (this._config.locateEnabled) {
                this._geoLocation = new GeoLocation(this);
            }
            if (this._config.measureTool) {
                this._measure = new Measure(this);
                this._measure.init();
            }
            this.activatePermalink();
        },

        createBaseLayers : function (layers, permalink) {
            var name,
                i,
                len,
                layer,
                arr = [],
                visible = false,
                prefix = 'Image';
            for (name in layers) {
                if (layers.hasOwnProperty(name)) {
                    // visible
                    visible = (name === permalink.blayer);
                    arr = [];

                    if (layers[name].type === 'Group') {
                        for (i = 0, len = layers[name].layers.length; i < len; i++) {
                            // add projection to sublayer
                            if (!layers[name].layers[i].projection) {
                              layers[name].layers[i].projection = layers[name].projection;
                            }
                            if (layers[name].layers[i].type.slice(0, prefix.length) === prefix) {
                                layer = this.createImageLayer(layers[name].layers[i]);
                            } else {
                                layer = this.createTileLayer(layers[name].layers[i]);
                            }
                            arr.push(layer);
                        }
                        this._baseLayers.getLayers().push(new ol.layer.Group({
                            id: name,
                            title: layers[name].title,
                            layers: arr,
                            visible: visible
                        }));
                    } else {
                        if (layers[name].type.slice(0, prefix.length) === prefix) {
                            layer = this.createImageLayer(layers[name]);
                        } else {
                            layer = this.createTileLayer(layers[name]);
                        }

                        layer.set('id', name);
                        layer.setVisible(visible);
                        this._baseLayers.getLayers().push(layer);
                    }
                }
            }
            this._activeBaseLayer = permalink.blayer;
        },

        createTileLayer : function (lconf) {
            var affix = 'WMS',
                tileSize = 1024,
                source,
                layer;
            // if WMS, then 512 tile
            if (lconf.type.slice(-(affix.length)) === affix) {
                var projExtent = ol.proj.get(lconf.projection).getExtent();
                var startResolution = ol.extent.getWidth(projExtent) / tileSize;
                var resolutions = new Array(22);
                for (var i = 0, ii = resolutions.length; i < ii; ++i) {
                    resolutions[i] = startResolution / Math.pow(2, i);
                }
                var tileGrid = new ol.tilegrid.TileGrid({
                    extent: projExtent,
                    resolutions: resolutions,
                    tileSize: [tileSize, tileSize]
                });

                lconf.tileGrid = tileGrid;
            };
            var layer = new ol.layer.Tile({
                title: lconf.title,
                source: new ol.source[lconf.type](lconf)
            });
            if (lconf.id) {
                layer.set('id', lconf.id);
            }
            if (lconf.minResolution) {
                layer.setMinResolution(lconf.minResolution);
            }
            if (lconf.maxResolution) {
                layer.setMaxResolution(lconf.maxResolution);
            }

            return layer;
        },

        createImageLayer : function (lconf) {
            var layer = new ol.layer.Image({
                title: lconf.title,
                source: new ol.source[lconf.type](lconf)
            });
            if (lconf.minResolution) {
                layer.setMinResolution(lconf.minResolution);
            }
            if (lconf.maxResolution) {
                layer.setMaxResolution(lconf.maxResolution);
            }

            return layer;
        },

        createLayerSwitcher : function (layers, permalink) {
            var _this = this,
                name,
                blayers = [],
                template = Templator.compile(tmpl_layerswitcher);
            for (name in layers) {
                if (layers.hasOwnProperty(name)) {
                    blayers.push({
                        name: name,
                        title: layers[name].title,
                        crs: layers[name].projection,
                        state: this.isVisible(layers[name]) ? '' : 'disabled'
                    });
                }
            }
            this._el = $(template({
                layer_name: layers[permalink.blayer].title,
                layers: blayers,
                create_new_layer: 'Lisa uus WMS kiht',
                confirm: 'Lisa'
            }));
            $('#toolbar').append(this._el);

            this._el.on('click', 'a.blayer', function (e) {
                e.preventDefault();
                if (!$(this).closest('li').hasClass('disabled')) {
                    _this.changeBaseLayer($(this).data('name'));
                }
            });

            this._map.getView().on('change:resolution', function () {
                Object.keys(layers).forEach(function (name) {
                    if (_this.isVisible(layers[name])) {
                        _this._el.find('li a[data-name="' + name + '"]').closest('li').removeClass('disabled');
                    } else {
                        _this._el.find('li a[data-name="' + name + '"]').closest('li').addClass('disabled');
                    }
                });
            });

        },

        isVisible : function (layer) {
            if (layer.minResolution && this._map.getView().getResolution() < layer.minResolution) {
                return false;
            }
            if (layer.maxResolution && this._map.getView().getResolution() > layer.maxResolution) {
                return false;
            }
            return true;
        },

        changeBaseLayer : function (name) {
            this._baseLayers.getLayers().forEach(function (layer) {
                layer.set('visible', (layer.get('id') === name));
            });
            this._el.find('.display-name').html(this._config.baseLayers[name].title);
            this._activeBaseLayer = name;
            this.updatePermalink();
        },

        createMap : function (permalink) {
            var _this = this;
            this._map = new ol.Map({
                layers: [
                    _this._baseLayers,
                    _this._vectorLayers
                ],
                controls: ol.control.defaults({
                    attribution : false,
                    rotate : false,
                    zoom: false
                }),
                target: document.getElementById(_this._config.el),
                view: new ol.View({
                    projection: 'EPSG:3857',
                    center: _this.transform('point', permalink.center, 'EPSG:4326', 'EPSG:3857'),
                    zoom: permalink.zoom,
                    maxZoom: 20
                })
            });
        },

        createMouseCoordinatesControl : function () {
            var control = new ol.control.MousePosition({
                coordinateFormat: function (coord) {
                    return ol.coordinate.format(coord, '{y}, {x}', 5);
                },
                projection: 'EPSG:4326',
                className: 'pull-left',
                target: $('#statusbar .mouse-position')[0],
                undefinedHTML: ''
            });
            this._map.addControl(control);
        },

        createScaleLineControl : function () {
            var control = new ol.control.ScaleLine({
              className: 'ol-scale-line',
              target: $('#statusbar .scale-line')[0]
            });
            this._map.addControl(control);
        },

        transform : function (method, geom, crs_from, crs_to) {
            if (proj4.defs(crs_from) && proj4.defs(crs_to)) {
                switch (method) {
                case 'point':
                    geom = ol.proj.transform(geom, crs_from, crs_to);
                    break;
                case 'extent':
                    geom = ol.proj.transformExtent(geom, crs_from, crs_to);
                    break;
                }
            }
            return geom;
        },

        setView : function (method, params, zoomOnlyIn) {
            var zoom;
            switch (method) {
            case 'bounds':
                this._map.getView().fit(params, this._map.getSize());
                break;
            case 'center':
                if (params[1]) {
                    zoom = params[1];
                    if (zoomOnlyIn && this._map.getView().getZoom() > zoom) {
                        zoom = this._map.getView().getZoom();
                    }
                    this._map.getView().setCenter(params[0]);
                    this._map.getView().setZoom(zoom);
                } else {
                    this._map.getView().setCenter(params[0]);
                }
                break;
            }
        },

        getAllFeatures : function () {
            var fset = [];
            this._vectorLayers.getLayers().forEach(function (layer) {
                if (layer instanceof ol.layer.Vector) {
                    $.merge(fset, layer.getSource().getFeatures());
                }
            });
            return fset;
        },

        createMarker : function (coords) {
            var f =  new ol.Feature();
            if (coords) {
                f.setGeometry(new ol.geom.Point(coords));
            } else {
                f.setGeometry(null);
            }
            f.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#3399CC'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 3
                    })
                })
            }));
            return f;
        },

        getPermalink: function () {
            // default zoom, center and rotation
            var permalink = {
                blayer: this._config.activeBaseLayer,
                zoom: this._config.zoom,
                center: this._config.center
            },
                hash,
                parts;

            if (window.location.hash !== '') {
                // try to restore center, zoom-level and rotation from the URL
                hash = window.location.hash.split('&hash=');
                hash = hash[0].replace('#map=', '');
                parts = hash.split('/');
                if (parts[0]) {
                    permalink.blayer = parts[0];
                }
                if (parts[1]) {
                    permalink.zoom = parseInt(parts[1], 10);
                }
                if (parts[2] && parts[3]) {
                    permalink.center = [
                        parseFloat(parts[3]),
                        parseFloat(parts[2])
                    ];
                }
            }
            return permalink;
        },

        activatePermalink: function () {
            var _this = this,
                view = this._map.getView();
            this._map.on('moveend', this.updatePermalink, this);
            // restore the view state when navigating through the history, see
            // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
            window.addEventListener('popstate', function(event) {
                if (event.state === null) {
                    return;
                }
                var center = _this.transform('point', event.state.center, 'EPSG:4326', 'EPSG:3857');
                view.setCenter(center);
                view.setZoom(event.state.zoom);
                _this._shouldUpdate = false;
            });
        },

        updatePermalink: function () {
            var view = this._map.getView(),
                center = this.transform('point', view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
                blayer = this._activBaseLayer,
                hash;
            if (!this._shouldUpdate) {
                // do not update the URL when the view was changed in the 'popstate' handler
                this._shouldUpdate = true;
                return;
            }

            hash = '#map=' + this._activeBaseLayer + '/' +
            Math.round(view.getZoom() * 100) / 100 + '/' +
            Math.round(center[1] * 10000) / 10000 + '/' +
            Math.round(center[0] * 10000) / 10000;
            var state = {
                zoom: view.getZoom(),
                center: view.getCenter()
            };
            window.history.pushState(state, 'map', hash);
        }

    };

    return Map;

});
