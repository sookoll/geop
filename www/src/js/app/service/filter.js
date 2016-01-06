/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'templator',
    'text!tmpl/service/geocache/filter.html'
], function ($, Templator, tmpl_filter) {
    
    'use strict';
    
    function Filter(layer) {
        
        this._layer = layer;
        this._el = $('#toolbar .filter');
        this._tmpl_filter = Templator.compile(tmpl_filter);
        this._features = [];
        this._filters = {
            fstatus: {
                '0': 'Leidmata',
                '1': 'Leitud',
                '2': 'Minu aare'
            },
            type: {
                'Tavaline aare': 'Tavaline aare',
                'Multiaare': 'Multiaare',
                'Veebikaamera': 'Veebikaamera',
                'Virtuaalne aare': 'Virtuaalne aare',
                'Sündmusaare': 'Sündmusaare',
                'Asukohata (tagurpidi) aare': 'Asukohata aare',
                'Mõistatusaare': 'Mõistatusaare'
            }
        };
        
    }
    
    Filter.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            var filter = this.buildPropertyList();
            this.createUi(filter);
        },
        
        buildPropertyList : function () {
            var attr,
                filter = {},
                i;
            this._layer.getSource().forEachFeature(function (f) {
                attr = f.getProperties();
                for (i in attr) {
                    if (attr.hasOwnProperty(i) && this._filters.hasOwnProperty(i)) {
                        if (!filter[i]) {
                            filter[i] = {};
                        }
                        if (this._filters[i][attr[i]] && !filter[i][attr[i]]) {
                            filter[i][attr[i]] = this._filters[i][attr[i]];
                        }
                    }
                }
                
            }, this);
            return filter;
        },
        
        createUi : function (filter) {
            var _this = this;
            
            this._el.find('ul').html(this._tmpl_filter({
                collection: filter
            }));
            
            this._el.closest('.geocache').find('button.btn-filter').on('click', function (e) {
                e.stopPropagation();
                
                $(this).closest('.geocache')
                    .find('button.btn-geotrip')
                    .removeClass('active');
                $(this).closest('.geocache')
                    .find('.geotrip')
                    .removeClass('open');
                
                $(this).toggleClass('active');
                $(this).closest('.geocache').find('.filter').toggleClass('open');
            });
            
            this._el.find('ul button.close').on('click', function (e) {
                e.stopPropagation();
                $(this).closest('.geocache').find('button.btn-filter').toggleClass('active');
                $(this).closest('.filter').toggleClass('open');
            });
            
            this._el.find('ul li input').on('change', function (e) {
                e.stopPropagation();
                console.log(this);
            });
        },
        
        off : function () {
            this._el.closest('.geocache').find('button.btn-filter').off();
            this._el.find('ul button.close').off();
            this._el.find('ul li input').off();
            this._el.find('ul').html('');
        }
    };

    return Filter;
    
});