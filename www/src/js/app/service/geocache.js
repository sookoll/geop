/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery',
    'ol',
    'templator',
    'text!tmpl/service/geocache.html',
    'jquery.bootstrap'
], function ($, ol, Templator, tmpl_geocache) {
    
    'use strict';
    
    function Geocache(mapmodule) {
        this._mapmodule = mapmodule;
        this._el = null;
        this._open = false;
        this._results = null;
        this._layer = null;
        this._styles = [
            new ol.style.Style({
                text: new ol.style.Text({
                    text: '\uf1b2',
                    font: 'normal 12px FontAwesome',
                    textBaseline: 'middle',
                    fill: new ol.style.Fill({
                        color: 'black'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 4
                    })
                })
            }),
            new ol.style.Style({
                text: new ol.style.Text({
                    text: '\uf1b2',
                    font: 'normal 12px FontAwesome',
                    textBaseline: 'middle',
                    fill: new ol.style.Fill({
                        color: '#4c9900'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 4
                    })
                })
            }),
            new ol.style.Style({
                text: new ol.style.Text({
                    text: '\uf005',
                    font: 'normal 13px FontAwesome',
                    textBaseline: 'middle',
                    fill: new ol.style.Fill({
                        color: 'red'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 3
                    })
                })
            }),
            new ol.style.Style({
                text: new ol.style.Text({
                    text: '*',
                    offsetY: 0,
                    offsetX: 10,
                    font: 'normal 13px FontAwesome',
                    textBaseline: 'middle',
                    fill: new ol.style.Fill({
                        color: 'red'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 3
                    })
                })
            }),
            new ol.style.Style({
                text: new ol.style.Text({
                    text: '\uf1b3',
                    font: 'normal 14px FontAwesome',
                    textBaseline: 'middle',
                    fill: new ol.style.Fill({
                        color: '#000'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 4
                    })
                })
            })
        ];
        
    }
    
    Geocache.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            this.createUi();
            this.createLayer();
        },
        
        createUi : function () {
            var _this = this,
                template = Templator.compile(tmpl_geocache);
            
            this._el = $(template({
                load_geocaches: 'Lae aarded',
                confirm_geocaches: 'Lisa aarded kaardile'
            }));
            
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
        },
        
        createLayer : function (json) {
            var _this = this;
            this._layer = new ol.layer.Vector({
                source: new ol.source.GeoJSON({
                    projection: 'EPSG:3857',
                    object: json
                }),
                style: function (feature, resolution) {
                    var s = [_this._styles[(parseInt(feature.get('fstatus'), 10))]];
                    if (feature.get('type') === 'Multiaare') {
                        s = [_this._styles[4]];
                    }
                    return s;
                }
            });
            
            this._mapmodule.get('vectorLayers').getLayers().push(this._layer);
        },
        
        removeLayer : function () {
            this._layer.getSource().clear();
            this._mapmodule.get('vectorLayers').getLayers().remove(this._layer);
            this._layer = null;
        }
    };
    
    return Geocache;
});