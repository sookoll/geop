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
        this._features = layer.getSource().getFeatures();
        this._filters = {
            fstatus: {
                '0': 'Leidmata',
                '1': 'Leitud',
                '2': 'Minu aare'
            },
            new_cache: {
                'yes': 'Uus aare (30p)'
            },
            type: {
                'Tavaline aare': 'Tavaline aare',
                'Multiaare': 'Multiaare',
                'Veebikaamera': 'Veebikaamera',
                'Virtuaalne aare': 'Virtuaalne aare',
                'Sündmusaare': 'Sündmusaare',
                'Asukohata (tagurpidi) aare': 'Asukohata aare',
                'Mõistatusaare': 'Mõistatusaare',
                'Kirjakastiaare': 'Kirjakastiaare',
                'KusMaLäen': 'KusMaLäen'
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
                var i;
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
            // remove < 2
            /*for (i in filter) {
                if (filter.hasOwnProperty(i)) {
                    if (Object.keys(filter[i]).length < 2) {
                        delete filter[i];
                    }
                }
            }*/
            return filter;
        },

        createUi : function (filter) {
            var _this = this;

            this._el.find('ul').html(this._tmpl_filter({
                collection: filter
            }));

            this._el.closest('.geocache').find('button.btn-filter')
                .prop('disabled', false)
                .on('click', function (e) {
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

            this._el.find('ul li input[data-filter]').on('change', function (e) {
                e.stopPropagation();
                _this.filter();
            });

            this._el.find('ul li input[name=radiusStyle]').on('change', function (e) {
                e.stopPropagation();
                var radiusConf = _this._layer.get('radiusStyle');
                radiusConf.visible = $(this).is(':checked');
                _this._layer.set('radiusStyle', radiusConf);
                _this.filter();
            });
            this._el.closest('.geocache').find('button.btn-filter b').text(this._features.length);
        },

        off : function () {
            this._el.closest('.geocache')
                .find('button.btn-filter')
                .removeClass('active')
                .off()
                .find('b').text('');
            this._el.find('ul button.close').off();
            this._el.find('ul li input').off();
            this._el.find('ul').html('');
            this._el.removeClass('open');
        },

        filter : function () {
            var features,
                params = this.getChecked();

            this._layer.getSource().clear();
            if (params.count > 0) {
                features = this.query(params.query);
                this._layer.getSource().addFeatures(features);
                this._el.closest('.geocache').find('button.btn-filter b').text(features.length);
            } else {
                this._layer.getSource().addFeatures(this._features);
                this._el.closest('.geocache').find('button.btn-filter b').text(this._features.length);
            }
        },

        getChecked : function () {
            var checked = this._el.find('input[data-filter]').serializeArray(),
                params = {
                    query: {},
                    count: 0
                },
                i,
                len;
            for (i = 0, len = checked.length; i < len; i++) {
                if (!params.query[checked[i].name]) {
                    params.query[checked[i].name] = [];
                }
                if ($.inArray(checked[i].value, params.query[checked[i].name]) === -1) {
                    params.query[checked[i].name].push(checked[i].value);
                    params.count++;
                }
            }
            return params;
        },

        query : function (params) {
            var fset = [],
                i,
                ii,
                len,
                attr,
                valid = [];

            for (i = 0, len = this._features.length; i < len; i++) {
                attr = this._features[i].getProperties();
                valid = [];
                for (ii in params) {
                    if (params.hasOwnProperty(ii)) {
                        if (attr.hasOwnProperty(ii) && $.inArray(attr[ii], params[ii]) > -1) {
                            valid.push(true);
                        } else {
                            valid.push(false);
                        }
                    }
                }

                if ($.inArray(false, valid) === -1) {
                    fset.push(this._features[i]);
                }
            }
            return fset;
        }
    };

    return Filter;

});
