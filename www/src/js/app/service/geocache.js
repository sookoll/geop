/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery',
    'ol',
    'templator',
    'text!tmpl/service/geocache/tool_loader.html',
    'text!tmpl/service/geocache/geotrip.html',
    'text!tmpl/service/geocache/featureinfo.html',
    'text!tmpl/service/geocache/featureinfo_title.html',
    'jquery.bootstrap'
], function ($, ol, Templator, tmpl_tool_loader, tmpl_geotrip,  tmpl_featureinfo, tmpl_featureinfo_title) {
    
    'use strict';
    
    function Geocache(config, mapmodule) {
        this._name = 'geocache';
        this._config = config;
        this._mapmodule = mapmodule;
        this._el = null;
        this._open = false;
        this._results = null;
        this._layer = null;
        this._route = null;
        this._styleCache = {};
        this._styleConfig = {
            'base': {
                text: '\uf041',
                font: 'normal 16px FontAwesome',
                textBaseline: 'middle',
                fill: new ol.style.Fill({
                    color: 'black'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 4
                })
            },
            'text': {
                'Tavaline aare': {
                    'text': '\uf1b2',
                    'class': 'fa fa-cube',
                    'font': 'normal 12px FontAwesome'
                },
                'Multiaare': {
                    'text': '\uf1b3',
                    'class': 'fa fa-cubes',
                    'font': 'normal 13px FontAwesome'
                },
                'Veebikaamera': {
                    'text': '\uf030',
                    'class': 'fa fa-camera',
                    'font': 'normal 12px FontAwesome'
                },
                'Virtuaalne aare': {
                    'text': '\uf1eb',
                    'class': 'fa fa-wifi',
                    'font': 'normal 12px FontAwesome'
                },
                'Sündmusaare': {
                    'text': '\uf19c',
                    'class': 'fa fa-university',
                    'font': 'normal 12px FontAwesome'
                },
                'Asukohata (tagurpidi) aare': {
                    'text': '\uf021',
                    'class': 'fa fa-refresh',
                    'font': 'normal 12px FontAwesome'
                },
                'Mõistatusaare': {
                    'text': '\uf059',
                    'class': 'fa fa-question-circle',
                    'font': 'normal 12px FontAwesome'
                }
            },
            'color': {// leidmata - 0, leitud - 1, minu - 2
                '0': {
                    fill: new ol.style.Fill({
                        color: 'black'
                    })
                },
                '1': {
                    fill: new ol.style.Fill({
                        color: '#4c9900'
                    })
                },
                '2': {
                    fill: new ol.style.Fill({
                        color: 'red'
                    })
                }
            }
        };
        this._tmpl_geotrip = Templator.compile(tmpl_geotrip);
        this._tmpl_featureinfo = Templator.compile(tmpl_featureinfo);
        this._tmpl_featureinfo_title = Templator.compile(tmpl_featureinfo_title);
        this._geotrip = new ol.Collection();
        this._geotrip.on('add', this.renderTrip, this);
        this._geotrip.on('remove', this.renderTrip, this);
    }
    
    Geocache.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            var _this = this,
                handlers;
            this.createUi();
            // todo: comment in
            this.createLayer();
            
            // register featureinfo for this layer
            handlers = this._mapmodule.get('featureInfo').get('infoHandlers');
            if (handlers) {
                handlers[this._name] = function (feature) {
                    return _this.getContent(feature);
                };
            }
        },
        
        createUi : function () {
            var _this = this,
                template = Templator.compile(tmpl_tool_loader);
            
            this._el = $(template($.extend(this._config, {
                load_geocaches: 'Lae aarded',
                confirm_geocaches: 'Lisa aarded kaardile'
            })));
            
            $('#toolbar').append(this._el);
            
            this._el.find('.modal').on('shown.bs.modal', function (e) {
                $(this).find('textarea').focus();
            });
            
            this._el.find('#modal_geocache').on('click', 'button.confirm', function (e) {
                var content = $.trim($(this).closest('.modal-content').find('textarea').val()),
                    json;
                if (content.length > 0) {
                    try {
                        json = $.parseJSON(content);
                    } catch (err) {}
                }
                if (json) {
                    if (_this._layer) {
                        _this.removeLayer();
                    }
                    _this.createLayer(json);
                }
                $(this).closest('.modal-content').find('textarea').val('');
                $(this).closest('.modal').modal('hide');
            });
            
            this._el.find('button.btn-geotrip').on('click', function (e) {
                e.stopPropagation();
                $(this).toggleClass('active');
                $(this).closest('.geocache').toggleClass('open');
            });
            this._el.on('click', 'button.close', function (e) {
                e.stopPropagation();
                _this._el.find('button.btn-geotrip').toggleClass('active');
                $(this).closest('.geocache').toggleClass('open');
            });
            this._el.on('click', 'ul.geotrip li a', function (e) {
                e.preventDefault();
                var id = $(this).data('id'),
                    feature = null;
                _this._geotrip.forEach(function (item, i) {
                    if (Number(item.get('id')) === id) {
                        _this._mapmodule.setView('center', [item.getGeometry().getCoordinates(), 16]);
                        return;
                    }
                });
            });
            this._el.on('click', 'ul.geotrip li button.clear', function (e) {
                _this.clearTrip();
            });
            this._el.on('click', 'ul.geotrip li button.export-gpx', function (e) {
                new GPXExport();
            });
        },
        
        createLayer : function (json) {
            var _this = this, source;
            // if json, else add from file for testing
            if (json) {
                source = {
                    projection: 'EPSG:3857',
                    object: json
                };
            } else {
                source = {
                    projection: 'EPSG:3857',
                    url: 'data/gp.geojson',
                    format: new ol.format.GeoJSON()
                };
            }
            
            this._route = new ol.layer.Vector({
                name: 'route',
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 0, 0, 0.6)',
                        width: 3
                    })
                })
            });
            this._mapmodule.get('vectorLayers').getLayers().push(this._route);
            
            this._layer = new ol.layer.Vector({
                name: 'geocache',
                source: new ol.source.Vector(source),
                style: function (feature, resolution) {
                    var type = feature.get('type'),
                        fstatus = feature.get('fstatus'),
                        definition;
                    if (!_this._styleCache[type]) {
                        _this._styleCache[type] = {};
                    }
                    if (!_this._styleCache[type][fstatus]) {
                        definition = $.extend(
                            {},
                            _this._styleConfig.base,
                            _this._styleConfig.text[type],
                            _this._styleConfig.color[fstatus]
                        );
                        _this._styleCache[type][fstatus] = [new ol.style.Style({
                            text: new ol.style.Text(definition)
                        })];
                    }
                    return _this._styleCache[type][fstatus];
                }
            });
            this._mapmodule.get('vectorLayers').getLayers().push(this._layer);
        },
        
        removeLayer : function () {
            this._layer.getSource().clear();
            this._mapmodule.get('vectorLayers').getLayers().remove(this._layer);
            this._layer = null;
        },
        
        getContent : function (feature) {
            var _this = this,
                stat = {
                    '0': '<i class="fa fa-square-o"></i> Leidmata',
                    '1': '<i class="fa fa-check-square-o"></i> Leitud',
                    '2': '<i class="fa fa-user"></i> Minu aare'
                },
                prop = feature.getProperties(),
                in_collection = $.inArray(feature, this._geotrip.getArray());
            prop.fstatus = stat[prop.fstatus];
            prop.type_text = '<i class="' + this._styleConfig.text[prop.type]['class'] + '"></i> ' + prop.type;
            
            return {
                'definition' : {
                    'placement': 'top',
                    'animation': false,
                    'html': true,
                    'title': this._tmpl_featureinfo_title({
                        'type_class': this._styleConfig.text[prop.type]['class'],
                        'cache_url': this._config.cache_url,
                        'id': prop.id,
                        'name': prop.name,
                        'icon': (in_collection > -1) ? 'fa-minus-square' : 'fa-thumb-tack'
                    }),
                    'content': this._tmpl_featureinfo(prop)
                },
                'onShow' : function (feature) {
                    $('a.cache-toggle').on('click', function (e) {
                        e.preventDefault();
                        $(this).find('i').toggleClass('fa-thumb-tack fa-minus-square');
                        if ($.inArray(feature, _this._geotrip.getArray()) > -1) {
                            _this._geotrip.remove(feature);
                        } else {
                            _this._geotrip.push(feature);
                        }
                    });
                },
                'onHide' : function () {
                    $('a.cache-toggle').off();
                }
            };
        },
        
        renderTrip : function (e) {
            var collection = [''],// empty element for 1 based numbering
                len = this._geotrip.getLength(),
                line = [];
            
            this._geotrip.forEach(function (item, i) {
                collection.push(item.getProperties());
                line.push(item.getGeometry().getCoordinates());
            });
            if (len === 0) {
                this._el.find('button.btn-geotrip')
                    .removeClass('active')
                    .prop('disabled', true)
                    .find('b').text('');
                this._el.removeClass('open');
            } else if (this._el.find('button.btn-geotrip').is(':disabled')) {
                this._el.find('button.btn-geotrip')
                    .prop('disabled', false);
            }
            if (len > 0) {
                this._el.find('button.btn-geotrip b')
                    .text(len);
            }
            this._el.find('ul.geotrip').html(this._tmpl_geotrip({
                collection: collection
            }));
            
            this._route.getSource().clear();
            if (len > 1) {
                this._route.getSource().addFeature(new ol.Feature({
                    geometry: new ol.geom.LineString(line)
                }));
                
                
            }
        },
        
        clearTrip : function () {
            this._route.getSource().clear();
            this._geotrip.clear();
            var pop = this._mapmodule.get('featureInfo').get('popup');
            if (pop) {
                pop.popover('destroy');
            }
        }
    };
    
    return Geocache;
});