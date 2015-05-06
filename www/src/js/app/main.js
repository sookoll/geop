/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'config/settings',
    'app/map',
    'app/service/search/search',
    'app/service/geocache'
], function ($, Settings, Map, Search, Geocache) {
    
    'use strict';
    
    function App(settings) {
            
        this._settings = settings;

    }

    App.prototype = {

        get : function (key) {
            return this['_' + key];
        },

        init : function () {
            
        }

    };
    
    $(function () {

        var app = new App(Settings);
        app.init();

        // map module
        
        app.mapmodule = new Map(app.get('settings').map);
        app.mapmodule.init();
        
        // search
        if (app.get('settings').map.geocodingEnabled) {
            app.geocoding = new Search(app.mapmodule);
            app.geocoding.init();
        }
        
        // geocaches
        app.geocache = new Geocache(app.get('settings').geocache, app.mapmodule);
        app.geocache.init();

    });
    
    /*var app;
    
    function App(settings) {
        this.settings = settings;
        this.mapmodule = null;
        this.pages = {
            _current: null
        };
        if (settings.status === 'enabled') {
            // add link
            $('#navbar ul').append(tmpl_add_link);
        }
        // kkk
        $('body').append(tmpl_kkk);
    }
    
    function changePage(path, panel_width, cb) {
        var map_width = 100 - panel_width;
        if (app.pages._current && typeof app.pages._current.onHide === 'function') {
            app.pages._current.onHide();
        }
        $('#navbar li').removeClass('active');
        $('#navbar li a[href="#' + path + '"]').closest('li').addClass('active');
        $('#panel>*').hide();

        $('#map').animate({
            width : map_width + '%'
        }, {
            step: function () {
                app.mapmodule.onResize();
            },
            complete: function () {
                app.mapmodule.onResize();
            }
        });
        $('#panel').animate({
            width : panel_width + '%'
        }, {
            complete : cb
        });
    }

    function openOverviewPage() {
        if (!app.pages.overview) {
            var opts = {
                settings: settings,
                mapmodule: app.mapmodule
            };
            app.pages.overview = new Overview(opts);
        }
        app.pages.overview.init();
        if (typeof app.pages.overview.onShow === 'function') {
            app.pages.overview.onShow();
        }
        app.pages._current = app.pages.overview;
    }

    function openFormPage() {
        if (!app.pages.form) {
            var opts = {
                settings: settings,
                mapmodule: app.mapmodule
            };
            app.pages.form = new Form(opts);
        }
        app.pages.form.init();
        if (typeof app.pages.form.onShow === 'function') {
            app.pages.form.onShow();
        }
        app.pages._current = app.pages.form;
    }
    
    $(function () {

        app = new App(settings);
        var router,
            options = {
                notfound : function () {
                    router.setRoute('/');
                }
            },
            routes = {
                '/' : function () {
                    changePage('/', 30, openOverviewPage);
                },
                '/id/:id' : function (id) {
                    if (app.pages._current && app.pages._current instanceof Overview) {
                        app.pages._current.select(id, true);
                    } else {
                        changePage('/', 30, function () {
                            openOverviewPage();
                            app.pages._current.select(id);
                        });
                    }
                },
                '/lisa' : function () {
                    if (settings.status === 'enabled') {
                        changePage('/lisa', 50, openFormPage);
                    } else {
                        router.setRoute('/');
                    }
                },
                '/414linnud2015' : function () {
                    if (settings.status === 'closed') {
                        changePage('/lisa', 50, openFormPage);
                    } else {
                        router.setRoute('/');
                    }
                }
            };

        app.mapmodule = new Map(settings);
        app.mapmodule.init();
        
        // Routing
        router = new Router(routes).configure(options);
        router.init('/');

    });*/
    
});