/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/

define([], function () {

    'use strict';

    function ContextMenu(mapmodule) {
        this._name = 'contextmenu';
        this._map = mapmodule.get('map');
        this._mapmodule = mapmodule;
    };

    ContextMenu.prototype = {
        get: function (key) {
            return this['_' + key];
        },

        init: function (items) {
            var t = this;
            this._items = items;
            this.createUi();
            this._map.on('click', function (e) {
                this._popup.popover('destroy');
            }, this);
            this._map.getViewport().addEventListener('contextmenu', function (e) {
                e.preventDefault();
                var coords = t._map.getEventCoordinate(e);
                var content;
                var feature = t._map.forEachFeatureAtPixel(t._map.getEventPixel(e), function (feature, layer) {
                    if (layer) {
                      return [layer, feature];
                    }
                });
                if (!feature) {
                    content = t.getContent(coords);
                } else {
                    coords = feature[1].getGeometry().getCoordinates();
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
            this._popup.on('shown.bs.popover', function (e) {
                pop_content.onShow(e);
            });
            // when popover's content is hidden
            this._popup.on('hidden.bs.popover', pop_content.onHide);
            this._popup.popover('show');
        },

        getContent : function (coord) {
          var t = this;
          var content = this._items.map(function (item, i) {
              var icon = '<i class="' + (item.icon? item.icon : 'fa fa-chevron-circle-right') + '"></i>';
              var cont = (typeof item.content === 'function')? item.content(coord) : item.content;
              return '<li class="list-group-item item-' + i + '">' + icon + ' ' + cont + '</li>';
          });
          return {
              'definition' : {
                  'placement': 'right',
                  'animation': false,
                  'html': true,
                  'content': content.join(''),
                  'template': '<div class="popover contextmenu"><div class="arrow"></div><div class="popover-content small"></div></div>'
              },
              'onShow' : function (e) {
                  t._items.forEach(function (item, i) {
                      if (typeof item.onclick === 'function') {
                          $(e.currentTarget.nextSibling).on('click', '.item-' + i, function (evt) {
                              e.preventDefault();
                              item.onclick(evt, coord);
                              if (item.closeonclick) {
                                  t._popup.popover('destroy');
                              }
                          })
                      }
                  })
              },
              'onHide' : function () {}
          };
        },
    }

    return ContextMenu;

});
