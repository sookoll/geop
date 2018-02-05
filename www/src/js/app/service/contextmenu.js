/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([], function () {

    'use strict';
    var streetview_url = 'http://maps.google.com/maps?q=&layer=c&cbll=';

    function ContextMenu(mapmodule) {
        this._name = 'contextmenu';
        this._map = mapmodule.get('map');
        this._mapmodule = mapmodule;
    };

    ContextMenu.prototype = {
        get: function (key) {
            return this['_' + key];
        },

        init: function () {
            var t = this;
            this.createUi();
            this._map.on('click', function (e) {
                this._popup.popover('destroy');
            }, this);
            this._map.getViewport().addEventListener('contextmenu', function (e) {
                e.preventDefault();
                var coords = t._map.getEventCoordinate(e);
                var content;
                var feature = t._map.forEachFeatureAtPixel(t._map.getEventPixel(e), function (feature, layer) {
                    return [layer, feature];
                });
                if (!feature) {
                    content = t.getContent(coords);
                } else {
                    content = t.getContent(coords);
                }
                t.open(coords, content);
            });
        },

        createUi: function () {
            this._popup = $('<div id="contextmenu"></div>');
            this._overlay = new ol.Overlay({
                element: this._popup[0],
                autoPan: true,
                autoPanMargin: 50,
                positioning: 'center-center',
                offset: [0, 0]
            });
            this._map.addOverlay(this._overlay);
        },

        open: function (coord, pop_content) {
            this._popup.popover('destroy');
            this._overlay.setPosition(coord);
            this._popup.popover(pop_content.definition);
            // when popover's content is shown
            this._popup.on('shown.bs.popover', function () {
                pop_content.onShow();
            });
            // when popover's content is hidden
            this._popup.on('hidden.bs.popover', pop_content.onHide);
            this._popup.popover('show');
        },

        getContent : function (coord) {
          var formatted = ol.coordinate.format(this._mapmodule.transform('point', coord, 'EPSG:3857', 'EPSG:4326'), '{y}, {x}', 5);
          return {
              'definition' : {
                  'placement': 'right',
                  'animation': false,
                  'html': true,
                  //'title': '<i class="fa fa-map-marker"></i> ' + formatted,
                  'content': [
                      '<li class="list-group-item"><i class="fa fa-map-marker"></i> ' + formatted + '</li>',
                      '<li class="list-group-item"><i class="fa fa-street-view"></i> <a target="streetview" href="' + streetview_url + formatted + '">Google Streetview</a></li>'
                  ].join(''),
                  'template': '<div class="popover contextmenu"><div class="arrow"></div><div class="popover-content"></div></div>'
              },
              'onShow' : function () {},
              'onHide' : function () {}
          };
        },
    }

    return ContextMenu;

});
