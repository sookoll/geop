/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global define*/
define([
    'jquery'
], function ($) {
    
    'use strict';
    
    function Coordinates(mapmodule) {
        this._mapmodule = mapmodule;
        this._results = null;
        this._id = 'coordinates';
        this._title = '<i class="fa fa-cube"></i> Leitud asukoht';
    }
    
    Coordinates.prototype = {
        
        get : function (key) {
            return this['_' + key];
        },
        
        init : function () {
            
        },
        
        clear : function () {
            this._results = null;
        },
        
        find : function (query, cb, context) {
            var i, len, id, name,
                data = [],
                fset = this._mapmodule.getAllFeatures();
            
            for (i = 0, len = fset.length; i < len; i++) {
                id = fset[i].get('id');
                name = fset[i].get('name');
                if (name && name.search(new RegExp(query, 'i')) > -1) {
                    data.push({
                        'bbox' : fset[i].getGeometry().getExtent(),
                        'name' : name,
                        'type' : this._id,
                        'id' : id
                    });
                }
            }
            if (data.length > 0) {
                this._results = data;
            }
            if (typeof cb === 'function') {
                cb(this._title, this._results, context);
            }
        },

        getResultItem : function (id) {
            var i, len;
            for (i = 0, len = this._results.length; i < len; i++) {
                if (id === this._results[i].id) {
                    return this._results[i];
                }
            }
            return null;
        }
    };
    
    return MapFeatures;
});




/*
 * PRIA veebikaart
 * Creator: CGI Eesti AS
 * Date: 2014-01-27
 *
 * geootsing_coordinates.js - extend CGI GeoOtsing class with coordinates search support
 */

if(typeof GeoOtsing === 'function'){

	// coordinates valid bbox
	GeoOtsing.prototype.coords_search_bbox = [340000, 6371000, 760000, 6625500];

	// coordinate validation regex
	GeoOtsing.prototype.coordsFormat = [
		{
			/*
			 * EPSG:3301
			 * East;North
			 * 660394;6472665
			 * 660394.45;6472665,57
			 */
			regexp:/^([3-7][0-9]{5}|[3-7][0-9]{5}[,.][0-9]+)[;](6[3-6][0-9]{5}|6[3-6][0-9]{5}[,.][0-9]+)$/,
			srid:'EPSG:3301',
			get: function(matches){
				// replace , with .
				if(matches[1].indexOf(',')!=-1)
					matches[1] = matches[1].replace(',','.');
				if(matches[2].indexOf(',')!=-1)
					matches[2] = matches[2].replace(',','.');
				return [Number(matches[1]),Number(matches[2])];
			}
		},{
			/*
			 * EPSG:4326
			 * Longitude;Latitude
			 * 58 23 39;26 55 55
			 * 58 ’23’ 39;26’ 55’ 55
			 * 58 '23' 39;26' 55' 55
			 * -58.23.39;-26.55.55
			 */
			regexp:/^-?\s*([0-1]\d{0,2}|\d{2})[ .’']+([0-9]{2})[ .’']+([0-9]{2})[;]-?\s*([0-8]\d?|90)[ .’']+([0-9]{2})[ .’']+([0-9]{2})$/,
			srid:'EPSG:4326',
			get: function(matches){
				return [
					Number(matches[1]) + Number(matches[2])/60 + Number(matches[3])/60/60,
					Number(matches[4]) + Number(matches[5])/60 + Number(matches[6])/60/60
				];
			}
		},{
			/*
			 * EPSG:4326
			 * Latitude Longitude
			 * 58,345;26.9876
			 */
			regexp:/^-?((?:1[0-7]|[1-9])?\d(?:[,.]\d{1,18})?|180(?:\.0{1,18})?)[;]-?([1-8]?\d(?:[,.]\d{1,18})?|90(?:\.0{1,18})?)$/,
			srid:'EPSG:4326',
			get: function(matches){
				// replace , with .
				if(matches[1].indexOf(',')!=-1)
					matches[1] = matches[1].replace(',','.');
				if(matches[2].indexOf(',')!=-1)
					matches[2] = matches[2].replace(',','.');
				return [Number(matches[1]),Number(matches[2])];
			}
		}
	];

	/*
	 * Method: showCoordinatesOnMap
	 * @param: p - point [x,y]
	 * put coordinates on map and center map
	 */
	GeoOtsing.prototype.showCoordinatesOnMap = function(p){

		// clear temp layer
		if(this.selectedFeature){
			this.layers.temp.getSource().removeFeature(this.selectedFeature);
			this.selectedFeature = null;
		}

		// test against allowed coordinate formats
		var p = this.parseCoordinates(p);
		if(!p){
			app.ui.alert('danger',this.texts.error_valid_coordinates);
			return false;
		}

		// test intersects with extent
		var map = this.map;
		//var extent = map.getView().getProjection().getExtent();
		if(ol.extent.containsCoordinate(this.coords_search_bbox,p)){
			// show location
			this.selectedFeature = new ol.Feature();
			this.selectedFeature.setGeometry(new ol.geom.Point(p));
			this.layers.temp.getSource().addFeature(this.selectedFeature);
			var pan = ol.animation.pan({
				duration : 500,
				source : map.getView().getCenter()
			});
			var zoom = ol.animation.zoom({
				duration : 500,
				resolution: map.getView().getResolution()
			});
			map.beforeRender(pan,zoom);
			map.getView().setZoom(9);
			map.getView().setCenter(p);

			this.lastSearch = 'koordinaat';
		}else{
			app.ui.alert('danger',this.texts.error_valid_coords_out);
		}
		// all ok
		return true;
	};

	/*
	 * Method: parseCoordinates
	 * @param: coords - input coordinates strings [x,y] in unknown format
	 * Return coordinates in map srid
	 */
	GeoOtsing.prototype.parseCoordinates = function(coords){
		var srid = this.map.getView().getProjection().getCode(),
			input = coords.join(';'),
			matches;

		for(var i=0,len=this.coordsFormat.length; i<len; i++){
			matches = input.match(this.coordsFormat[i].regexp);
			if(matches){
				coords = this.coordsFormat[i].get(matches);
				if(this.coordsFormat[i].srid !== srid){
					coords = this.mapClass.transformPoint(this.coordsFormat[i].srid, srid, coords);
				}
				return coords;
			}
		}
		return false;
	};
};