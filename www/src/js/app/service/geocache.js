/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery',
    'ol',
    'templator',
    'polyline',
    'jsonpack',
    'app/service/export',
    'app/service/filter',
    'text!tmpl/service/geocache/tool_loader.html',
    'text!tmpl/service/geocache/geotrip.html',
    'text!tmpl/service/geocache/featureinfo.html',
    'text!tmpl/service/geocache/featureinfo_title.html',
    'jquery.bootstrap',
    'jquery.sortable'
], function ($, ol, Templator, polyline, jsonpack, Export, Filter, tmpl_tool_loader, tmpl_geotrip,  tmpl_featureinfo, tmpl_featureinfo_title) {

    'use strict';

    function Geocache(config, mapmodule) {
        this._name = 'geocache';
        this._config = config;
        this._mapmodule = mapmodule;
        this._el = null;
        this._filter = null;
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
                handlers,
                hash,
                features,
                json,
                fset;
            this.createUi();
            // todo: comment in
            //this.createLayer();

            // register featureinfo for this layer
            handlers = this._mapmodule.get('featureInfo').get('infoHandlers');
            if (handlers) {
                handlers[this._name] = function (feature) {
                    return _this.getContent(feature);
                };
            }

            // get permalink
            hash = window.location.hash.split('&hash=');
            if (hash[1]) {
                features = jsonpack.unpack(decodeURIComponent(hash[1]));
                if (features && features.length) {
                    json = {
                        type: 'FeatureCollection',
                        features: features
                    };
                    this.clearTrip();
                    if (json) {
                        fset = this.initTrip(json);
                        fset && fset.forEach(function (feature) {
                            _this._geotrip.push(feature);
                        });

                        //this.renderTrip();
                    }
                }
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
                //$(this).find('textarea').focus();
            });

            this._el.find('#modal_geocache').on('click', 'button.confirm', function (e) {
                var $txt = $(this).closest('.modal-content').find('textarea'),
                    content = $.trim($txt.val()),
                    json;
                // clear old
                _this.clearTrip();

                if (content.length > 0) {
                    try {
                        json = $.parseJSON(content);
                    } catch (err) {}
                }
                if (json) {
                    _this.initTrip(json);
                }

                $txt.val('');
                $(this).closest('.modal').modal('hide');
            });

            this._el.find('button.btn-geotrip').on('click', function (e) {
                e.stopPropagation();

                $(this).closest('.geocache')
                    .find('button.btn-filter')
                    .removeClass('active');
                $(this).closest('.geocache')
                    .find('.filter')
                    .removeClass('open');

                $(this).toggleClass('active');
                $(this).closest('.geocache').find('.geotrip').toggleClass('open');
            });
            this._el.on('click', '.geotrip button.close', function (e) {
                e.stopPropagation();
                _this._el.find('button.btn-geotrip').toggleClass('active');
                $(this).closest('.geocache').find('.geotrip').toggleClass('open');
            });
            this._el.on('click', '.geotrip ul li a', function (e) {
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
            // clear trip
            this._el.on('click', '.geotrip ul li button.clear', function (e) {
                _this.clearTrip();
            });
            // export trip
            this._el.on('click', '.geotrip ul li a.export-gpx', function (e) {
                e.preventDefault();
                var features = [],
                    clone = null,
                    route = null,
                    ex;
                _this._geotrip.forEach(function (feature) {
                    clone = feature.clone();
                    clone.getGeometry().transform('EPSG:3857', 'EPSG:4326');
                    features.push(clone);
                });
                route = _this._route.getSource().getFeatures()[0];
                if (route) {
                    clone = route.clone();
                    clone.getGeometry().transform('EPSG:3857', 'EPSG:4326');
                    features.push(clone);
                }
                ex = new Export('GPX', 'geotuur.gpx', features);
            });
            // share trip
            this._el.on('click', '.geotrip ul li button.share', function (e) {
                var format = new ol.format.GeoJSON(),
                    json = format.writeFeaturesObject(_this._geotrip.getArray(), {
                        dataProjection : 'EPSG:4326',
                        featureProjection : 'EPSG:3857',
                        decimals: 5
                    }),
                    compressed = jsonpack.pack(json.features);
                window.location.hash += '&hash=' + compressed;
            });
        },

        createLayer : function (json) {
            var _this = this, source, format;
            // if json, else add from file for testing
            if (json) {
                format = new ol.format.GeoJSON();
                source = {
                    features: format.readFeatures(json, {
                        dataProjection : 'EPSG:4326',
                        featureProjection : 'EPSG:3857'
                    })
                };
            } else {
                source = {
                    format: new ol.format.GeoJSON(),
                    url: 'data/gp.geojson'
                };
            }

            this._route = new ol.layer.Vector({
                name: 'route',
                source: new ol.source.Vector(),
                style: [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255, 255, 255, 0.6)',
                            width: 7
                        })
                    }),
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.3)',
                            width: 5
                        })
                    })
                ]
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
            return source.features || [];
        },

        removeLayer : function () {
            this._layer.getSource().clear();
            this._route.getSource().clear();
            this._mapmodule.get('vectorLayers').getLayers().remove(this._layer);
            this._mapmodule.get('vectorLayers').getLayers().remove(this._route);
            this._layer = null;
            this._route = null;
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

        initTrip : function (json) {
            if (this._layer) {
                this.removeLayer();
            }
            var features = this.createLayer(json);

            // create filter
            if (this._filter) {
                this._filter.off();
                this._filter = null;
            }
            this._filter = new Filter(this._layer);
            this._filter.init();
            return features;
        },

        renderTrip : function (e) {

            var collection = [''],// empty element for 1 based numbering
                len = this._geotrip.getLength(),
                line = [],
                _this = this;

            this._geotrip.forEach(function (item, i) {
                collection.push(item.getProperties());
                line.push(item.getGeometry().getCoordinates());
            });
            if (len === 0) {
                this._el.find('button.btn-geotrip')
                    .removeClass('active')
                    .prop('disabled', true)
                    .find('b').text('');
                this._el.find('.geotrip').removeClass('open');
            } else if (this._el.find('button.btn-geotrip').is(':disabled')) {
                this._el.find('button.btn-geotrip')
                    .prop('disabled', false);
            }
            if (len > 0) {
                this._el.find('button.btn-geotrip b')
                    .text(len);
            }
            this._el.find('.geotrip ul').html(this._tmpl_geotrip({
                collection: collection
            }));

            // sortable
            this._el.find('.geotrip .sortable').sortable({
                draggable: 'li.sort-item',
                onUpdate: function (e) {
                    _this.reorderTrip();
                    _this.renderTrip();

                }
            });

            this._route.getSource().clear();
            this._el.find('.geotrip ul li a.export-gpx').removeAttr('href');

            if (len > 1) {
                this._route.getSource().addFeatures([new ol.Feature({
                    name: 'Geotuur',
                    geometry: new ol.geom.LineString(line)
                })]);
            }
        },

        reorderTrip : function () {
            // new order for layers
            var order = [],
                obj = null,
                _this = this,
                i,
                len;

            this._el.find('.geotrip .sortable li.sort-item').each(function (i, li) {
                order.push($(li).find('a').attr('data-id'));
            });

            function getObj(item_id) {
                var obj;
                _this._geotrip.forEach(function (item, j) {
                    if (item.get('id') === item_id) {
                        obj = item;
                    }
                });
                return obj;
            }

            for (i = 0, len = order.length; i < len; i++) {
                obj = getObj(order[i]);
                this._geotrip.remove(obj);
                this._geotrip.insertAt(i, obj);
            }
        },

        clearTrip : function () {
            if (this._route) {
                this._route.getSource().clear();
            }
            this._geotrip.clear();
            var pop = this._mapmodule.get('featureInfo').get('popup');
            if (pop) {
                pop.popover('destroy');
            }
        }
    };

    return Geocache;
});
