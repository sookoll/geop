/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'proj4',
    'ol',
    'templator',
    'app/service/featureinfo',
    'app/service/geolocation',
    'text!tmpl/map/layerswitcher.html'
], function ($, proj4, ol, Templator, FeatureInfo, GeoLocation, tmpl_layerswitcher) {
    
    'use strict';
    
    ol.proj.setProj4(proj4);
    proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    var proj3301 = ol.proj.get('EPSG:3301');
    proj3301.setExtent([40500, 5993000, 1064500, 7017000]);
    
    function Map(config) {
        
        this._config = config;
        this._map = null;
        this._baseLayers = new ol.layer.Group({
            layers: []
        });
        this._vectorLayers = new ol.layer.Group({
            layers: []
        });
        this._el = null;
        this._featureInfo = null;
        this._geoLocation = null;
        this._controls = {
            mouseCoordinates : null
        };
        this._overlay = null;
    }
    
    Map.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            this.createBaseLayers(this._config.baseLayers);
            this.createMap();
            this.createLayerSwitcher(this._config.baseLayers);
            if (this._config.mouseCoordinates) {
                this.createMouseCoordinatesControl();
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
                updateWhileInteracting: true
            });
            if (this._config.locateEnabled) {
                this._geoLocation = new GeoLocation(this);
            }
        },
        
        createBaseLayers : function (layers) {
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
                    visible = (name === this._config.activeBaseLayer);
                    arr = [];
                    
                    if (layers[name].type === 'Group') {
                        for (i = 0, len = layers[name].layers.length; i < len; i++) {
                            // add projection to sublayer
                            layers[name].layers[i].projection = layers[name].projection;
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
        },
        
        createTileLayer : function (lconf) {
            var layer = new ol.layer.Tile({
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
        
        createLayerSwitcher : function (layers) {
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
                layer_name : layers[this._config.activeBaseLayer].title,
                layers : blayers
            }));
            $('#toolbar').append(this._el);
            
            this._el.on('click', 'a.blayer', function (e) {
                e.preventDefault();
                if (!$(this).closest('li').hasClass('disabled')) {
                    _this.changeBaseLayer($(this).data('name'));
                }
            });
            
            this._map.getView().on('change:resolution', function (e) {
                var resolution = e.target.getResolution(), name;
                for (name in layers) {
                    if (layers.hasOwnProperty(name)) {
                        if (_this.isVisible(layers[name])) {
                            _this._el.find('li a[data-name="' + name + '"]').closest('li').removeClass('disabled');
                        } else {
                            _this._el.find('li a[data-name="' + name + '"]').closest('li').addClass('disabled');
                        }
                    }
                }
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
            
            /*
            var prop = {
                projection: 'EPSG:3301',
                center : this.transform('point', this._map.getView().getCenter(), 'EPSG:3857', 'EPSG:3301'),
                resolutions: [
                    4000.0, 2000.0, 1000.0, 500.0, 250.0, 125.0, 62.5, 31.25, 15.625, 7.8125, 3.90625,
                    1.953125, 0.9765625, 0.48828125, 0.244140625, 0.122070313, 0.061035157
                ]
            }
            
            var resolution = this._map.getView().getResolution();
            prop.resolution = prop.resolutions.reduce(function (prev, curr) {
                return (Math.abs(curr - resolution) < Math.abs(prev - resolution) ? curr : prev);
            });
            
            console.log(resolution, prop.resolution)
            
            this._map.setView(new ol.View(prop));
            */
            
            this._baseLayers.getLayers().forEach(function (layer) {
                layer.set('visible', (layer.get('id') === name));
            });
            
            this._el.find('.display-name').html(this._config.baseLayers[name].title);
        },
        
        createMap : function () {
            var _this = this;
            //this._baseLayer = _this._baseLayers[_this._config.activeBaseLayer];
            this._map = new ol.Map({
                layers : [
                    _this._baseLayers,
                    _this._vectorLayers
                ],
                controls : ol.control.defaults({
                    attribution : false,
                    rotate : false,
                    zoom: false
                }),
                target : document.getElementById(_this._config.el),
                view : new ol.View({
                    projection: 'EPSG:3857',
                    center : _this.transform('point', _this._config.center, 'EPSG:4326', 'EPSG:3857'),
                    zoom : _this._config.zoom,
                    maxZoom : 20
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
        
        transform : function (method, geom, crs_from, crs_to) {
            switch (method) {
            case 'point':
                geom = ol.proj.transform(geom, crs_from, crs_to);
                break;
            case 'extent':
                geom = ol.proj.transformExtent(geom, crs_from, crs_to);
                break;
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
            this._vectorLayers.getLayers().forEach(function (layer, i) {
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
        }
        
    };
    
    return Map;
    
});