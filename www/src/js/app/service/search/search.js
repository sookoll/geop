/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery',
    'templator',
    'text!tmpl/service/search/search.html',
    'text!tmpl/service/search/search-item.html',
    'app/service/search/nominatim',
    'app/service/search/map-features',
    'jquery.bootstrap'
], function ($, Templator, tmpl_search, tmpl_search_item, Nominatim, MapFeatures) {
    
    'use strict';
    
    function Search(mapmodule) {
        this._mapmodule = mapmodule;
        this._el = null;
        this._open = false;
        this._result = false;
        this._providers = {
            nominatim: null,
            mapfeatures: null
        };
    }
    
    Search.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            this._providers.nominatim = new Nominatim(this._mapmodule);
            this._providers.mapfeatures = new MapFeatures(this._mapmodule);
            this.createUi();
        },
        
        createUi : function () {
            var _this = this,
                template = Templator.compile(tmpl_search);
            
            this._el = $(template({
                search: 'Otsi'
            }));
            
            $('#toolbar').append(this._el);
            
            this._el.find('.dropdown')
                .on('shown.bs.dropdown', function () {
                    _this._open = true;
                })
                .on('hidden.bs.dropdown', function () {
                    _this._open = false;
                });
            
            this._el.find('input').on('keyup', function (e) {
                var val, provider;
                // clear
                if (_this._result) {
                    for (provider in _this._providers) {
                        if (_this._providers.hasOwnProperty(provider)) {
                            _this._providers[provider].clear();
                        }
                    }
                    _this._result = false;
                    _this._el.find('.dropdown-menu').html('');
                    if (_this._open) {
                        _this._el.find('.dropdown-menu').dropdown('toggle');
                    }
                }
                val = $.trim(_this._el.find('input').val());
                if (val.length > 1) {
                    _this._el.find('.dropdown-toggle').prop('disabled', false);
                } else {
                    _this._el.find('.dropdown-toggle').prop('disabled', true);
                }
                if (e.keyCode === 13 && val.length > 1) {
                    _this.search(val);
                }
            });
            
            this._el.find('.dropdown-toggle').on('click', function (e) {
                var val = $.trim(_this._el.find('input').val());
                if (!_this._result && val.length > 1) {
                    _this.search(val);
                }
            });
            
            this._el.find('.dropdown-menu').on('click', 'li a', function (e) {
                e.preventDefault();
                var id = $(this).attr('data-id'),
                    type = $(this).attr('data-type'),
                    item = _this._providers[type].getResultItem(id);
                if (item && item.bbox && item.bbox.length === 4) {
                    if (Math.abs(item.bbox[0] - item.bbox[2]) < 100 || Math.abs(item.bbox[1] - item.bbox[3]) < 100) {
                        _this._mapmodule.setView('center', [[item.bbox[0], item.bbox[1]], 18]);
                    } else {
                        _this._mapmodule.setView('bounds', item.bbox);
                    }
                }
            });
        },
        
        search : function (query) {
            var provider;
            // test query
            
            // search providers
            for (provider in this._providers) {
                if (this._providers.hasOwnProperty(provider)) {
                    this._providers[provider].find(query, this.showResults, this);
                }
            }
            
            // search coordinates
            
        },

        showResults : function (title, data, _this) {
            if (data && data.length > 0) {
                _this._result = true;
                var list = _this._el.find('.dropdown-menu'),
                    template = Templator.compile(tmpl_search_item);
                list.append('<li class="dropdown-header">' + title + '</li>');
                $.each(data, function (i, item) {
                    list.append(template(item));
                });
                if (!_this._open) {
                    _this._el.find('.dropdown-menu').dropdown('toggle');
                }
            }
        }

    };
    
    return Search;
});