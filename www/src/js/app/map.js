/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'ol',
    'templator',
    'app/service/featureinfo',
    'app/service/geolocation',
    'text!tmpl/map/layerswitcher.html'
], function ($, ol, Templator, FeatureInfo, GeoLocation, tmpl_layerswitcher) {
    
    'use strict';
    
    proj4.defs("EPSG:3301","+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    var proj3301 = ol.proj.get('EPSG:3301');
    proj23032.setExtent([40500,5993000,1064500,7017000]);
    
    function Map(config) {
        
        this._config = config;
        this._map = null;
        this._baseLayers = {};
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
            var name;
            for (name in layers) {
                if (layers.hasOwnProperty(name)) {
                    this._baseLayers[name] = new ol.layer.Tile({
                        title: layers[name].title,
                        source: new ol.source.OSM({
                            url: layers[name].url,
                            projection: layers[name].projection,
                            crossOrigin: null
                        })
                    });
                }
            }
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
                var zoom = e.target.getZoom(), name;
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
            if (layer.minZoom && this._map.getView().getZoom() < layer.minZoom) {
                return false;
            }
            if (layer.maxZoom && this._map.getView().getZoom() > layer.maxZoom) {
                return false;
            }
            return true;
        },
        
        changeBaseLayer : function (name) {
            var layers = this._map.getLayers();
            layers.removeAt(0);
            layers.insertAt(0, this._baseLayers[name]);
            this._el.find('.display-name').html(this._baseLayers[name].get('title'));
        },
        
        createMap : function () {
            var _this = this;
            this._map = new ol.Map({
                layers : [
                    _this._baseLayers[_this._config.activeBaseLayer],
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