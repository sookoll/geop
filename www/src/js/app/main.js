/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'config/settings',
    'app/map',
    'app/service/store',
    'app/service/search/search',
    'app/service/geocache',
    'app/service/osm-edit',
    'app/service/data-import',
    'app/service/fullscreen',
    'app/service/wms-layer'
], function ($, Settings, Map, AppStore, Search, Geocache, OSMEdit, DataImport, FullScreen, WMSLayer) {

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

        var app = new App(Settings),
            idLink;
        app.init();

        app.store = new AppStore(app);
        app.store.init();

        // map module
        app.mapmodule = new Map(app.get('settings').map);
        app.mapmodule.init();

        // edit osm in id
        idLink = new OSMEdit($('.layerswitcher a[data-name="osm"]').closest('li'), app.mapmodule);
        app.wms = new WMSLayer($('.layerswitcher ul'), app.mapmodule);

        // search
        if (app.get('settings').map.geocodingEnabled) {
            app.geocoding = new Search(app.mapmodule);
            app.geocoding.init();
        }

        // geocaches
        app.geocache = new Geocache(app.get('settings').geocache, app.mapmodule);
        app.geocache.init();

        // import
        app.dataimport = new DataImport(app.mapmodule);

        // full screen
        app.fullscreen = new FullScreen($('.btn-fullscreen'));

        // info
        $('#statusbar a.info-toggle').on('click', function (e) {
            e.preventDefault();
            $('#statusbar .info').toggleClass('hidden');
        });

        function setMaxHeight() {
            var bh = $('body').height(),
                hh = $('header').outerHeight(true),
                fh = $('footer').outerHeight(true);
            $('body').find('.scrollable-menu').css('max-height', (bh - (hh + fh)) + 'px');
        }

        setMaxHeight();
        $(window).on('resize', setMaxHeight);

    });

});
