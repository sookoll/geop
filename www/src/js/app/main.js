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
    'app/service/wms-layer',
    'app/service/measure',
    'app/service/contextmenu',
    'app/service/compass'
], function (
    $,
    Settings,
    Map,
    AppStore,
    Search,
    Geocache,
    OSMEdit,
    DataImport,
    FullScreen,
    WMSLayer,
    Measure,
    ContextMenu,
    Compass
) {

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
        // Compass
        app.compass = new Compass($('.btn-compass'), app.mapmodule);

        // measure
        if (app.get('settings').map.measureTool) {
            app.measure = new Measure(app.mapmodule);
        }

        // contextmenu
        var context = [{
          icon: 'fa fa-map-marker',
          content: function (coord) {
              return ol.coordinate.format(app.mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'), '{y}, {x}', 5);
          },
          onclick: function (e, coord) {
              var xy = ol.coordinate.format(app.mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'), '{y}, {x}', 5);
              app.mapmodule.addMarker(coord, {'WGS84': xy});
          },
          closeonclick: true
        }, {
          icon: 'fa fa-street-view',
          content: function (coord) {
              var formatted = ol.coordinate.format(app.mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'), '{y}, {x}', 5);
              return '<a target="streetview" href="' + app.get('settings').streetview_url + formatted + '">Streetview</a>';
          }
        }];
        // add measure
        if (app.get('settings').map.measureTool) {
            context.push({
              icon: 'gp-icon gp-icon-ruler',
              content: 'Mõõda vahemaad',
              onclick: function (e, coord) {
                  app.measure.init(coord);
              },
              closeonclick: true
            });
            context.push({
              icon: 'fa fa-dot-circle-o',
              content: 'Mõõda raadiust',
              onclick: function (e, coord) {
                  app.measure.init(coord, 'circle');
              },
              closeonclick: true
            });
        }
        app.contextmenu = new ContextMenu(app.mapmodule);
        app.contextmenu.init(context);

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
