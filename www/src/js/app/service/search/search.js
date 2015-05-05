/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery',
    'templator',
    'text!tmpl/service/search/search.html',
    'text!tmpl/service/search/search-item.html',
    'app/service/search/nominatim',
    'jquery.bootstrap'
], function ($, Templator, tmpl_search, tmpl_search_item, Nominatim) {
    
    'use strict';
    
    function Search(mapmodule) {
        this._mapmodule = mapmodule;
        this._el = null;
        this._open = false;
        this._results = null;
        this._providers = {};
    }
    
    Search.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            
            this._providers.nominatim = new Nominatim(this._mapmodule);
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
                var val;
                
                // clear
                if (_this._results) {
                    _this._results = null;
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
                    _this.search(val, _this.showResults);
                }
            });
            
            this._el.find('.dropdown-toggle').on('click', function (e) {
                var val = $.trim(_this._el.find('input').val());
                if (!_this._results && val.length > 1) {
                    _this.search(val);
                }
            });
            
            this._el.find('.dropdown-menu').on('click', 'li a', function (e) {
                e.preventDefault();
                var id = $(this).attr('data-id'),
                    type = $(this).attr('data-type'),
                    item = _this.getResultItem(id),
                    bbox;
                if (item && item.boundingbox && item.boundingbox.length === 4) {
                    if (bbox[0] === bbox[2] || bbox[1] === bbox[3]) {
                        _this._mapmodule.setView('center', [bbox[0], bbox[1]], true);
                    } else {
                        _this._mapmodule.setView('bounds', bbox);
                    }
                }
            });
        },
        
        search : function (query) {
            var _this = this;
            // prepare
            if (this._results === null) {
                this._results = {};
            }
            // test query
            
            // search addresses
            this._providers.nominatim.geocode(query, this, function (data) {
                var type = 'Aadressid';
                if (data.length > 0) {
                    data = this._providers.nominatim.format(type, data);
                    this._results[type] = data;
                    this.showResults(type, data);
                }
                
            });
            
            // search features from map
            var type = 'Aarded',
                fset = this._mapmodule.getAllFeatures(),
                i, len, name, data = [];
            
            for (i = 0, len = fset.length; i < len; i++) {
                name = fset[i].get('name');
                if (name && name.search(new RegExp(query, 'i')) > -1) {
                    data.push({
                        'bbox' : fset[i].getGeometry().getExtent(),
                        'name' : name,
                        'type' : type,
                        'id' : i
                    });
                }
            }
            if (data.length > 0) {
                this._results[type] = data;
                this.showResults(type, data);
            }
            // search coordinates
            
        },

        showResults : function (type, data) {
            if (data.length > 0) {
                var list = this._el.find('.dropdown-menu'),
                    template = Templator.compile(tmpl_search_item);
                list.append('<li class="dropdown-header">' + type + '</li>');
                $.each(data, function (i, item) {
                    list.append(template(item));
                });
                if (!this._open) {
                    this._el.find('.dropdown-menu').dropdown('toggle');
                }
            }
        }

    };
    
    return Search;
});