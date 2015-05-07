/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([
    'jquery',
    'config/settings',
    'app/map',
    'app/service/search/search',
    'app/service/geocache',
    'app/service/osm-edit',
    'app/service/data-import'
], function ($, Settings, Map, Search, Geocache, OSMEdit, DataImport) {
    
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

        // map module
        
        app.mapmodule = new Map(app.get('settings').map);
        app.mapmodule.init();
        
        // edit osm in id
        idLink = new OSMEdit($('.layerswitcher a[data-name="osm"]').closest('li'), app.mapmodule);
        
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