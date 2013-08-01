/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
 
/**
 * @module Worldview
 */
Worldview.namespace("Map");

/**
 * Utilities for OpenLayers.
 * 
 * @class Map
 * @static
 */

$(function(ns) {
    
    var logPosition = Logging.getLogger("Worldview.Map.Position");
    
    // Used to reference the TileWorker
    var BUILD_NONCE = "@BUILD_NONCE@";
    
    /**
     * An object that contains OpenLayers.Control.MousePosition objects
     * that update the current latitude/longitude values on the map as the
     * mouse moves. Keyed by projection name, either "geographic", "arctic",
     * or "antarctic".
     * 
     * Example:
     *      
     *      var control = Worldview.Map.COORDINATE_CONTROLS["geographic"];
     * 
     * @attribute COORDINATE_CONTROLS
     * @final
     */
    ns.COORDINATE_CONTROLS = {
        "geographic": new OpenLayers.Control.MousePosition({
            formatOutput: function(mouseLonLat) { 
                if ( logPosition.isDebugEnabled() ) {
                    logPosition.debug(mouseLonLat.lon.toFixed(3) + "," + 
                                      mouseLonLat.lat.toFixed(3));    
                }                          
                return mouseLonLat.lon.toFixed(3) + "&#176;, " + 
                       mouseLonLat.lat.toFixed(3) + "&#176;";
            }  
        }),
        "arctic": new OpenLayers.Control.MousePosition({
            projection: "EPSG:3413",
            formatOutput: function(mouseLonLat) { 
                if ( logPosition.isDebugEnabled() ) {
                    logPosition.debug(Math.round(mouseLonLat.lon) + "," + 
                                      Math.round(mouseLonLat.lat));  
                }                          
                return this.projection + " " +  
                        Math.round(mouseLonLat.lon) + "m, " + 
                        Math.round(mouseLonLat.lat) + "m";          
            }
        }),
        "antarctic": new OpenLayers.Control.MousePosition({
            formatOutput: function(mouseLonLat) {           
                if ( logPosition.isDebugEnabled() ) {
                    logPosition.debug(Math.round(mouseLonLat.lon) + "," + 
                                      Math.round(mouseLonLat.lat));  
                }                           
                return "EPSG:3031 " + 
                        Math.round(mouseLonLat.lon) + "m, " + 
                        Math.round(mouseLonLat.lat) + "m";                  
            },
        })
    };
    
    /**
     * Determines if an exent object contains valid values.
     * 
     * @method isExtentValid
     * @static 
     * 
     * @param extent {OpenLayers.Bound} The extent to check.
     * 
     * @return {boolean} False if any of the values is NaN, otherwise returns 
     * true.
     */
    ns.isExtentValid = function(extent) {
        if ( extent === undefined ) {
            return false;
        }
        var valid = true;
        $.each(extent.toArray(), function(index, value) {
            if ( isNaN(value) ) {
                valid = false;
            }    
        });
        return valid;
    };
    
    /**
     * Scheduler used to render canvas tiles.
     * 
     * @attribute TILE_SCHEDULER {Scheduler}
     * @static
     * @readOnly
     */
    ns.TILE_SCHEDULER = Worldview.Scheduler({
        script: "js/Worldview/Map/TileWorker.js?v=" + BUILD_NONCE, 
        max: 4
    });

    /**
     * Sets the opacity of a layer. Since the backbuffer can interfere with
     * tile layers that have transparency, the transition effect is set to 
     * none if the opacity is not equal to one.
     * 
     * @method setOpacity
     * @static
     * 
     * @param layer {OpenLayers.Layer} The layer to set the opacity
     * @param opacity {float} A value from 0 (transparent) to 1 (opaque).
     */
    ns.setOpacity = function(layer, opacity) { 
        layer.setOpacity(opacity);
        if ( opacity === 1 ) {
            var effect = layer.originalTransitionEffect || "resize";
            layer.transitionEffect = effect; 
        } else {
            layer.originalTransitionEffect = layer.transitionEffect;
            layer.transitionEffect = "none";
        }           
    };
    
    /**
     * Sets the visiblity of a layer. If the layer is supposed to be not 
     * visible, this actually sets the opacity to zero. This allows the 
     * quick transition effects between days.
     * 
     * @method setVisibility
     * @static
     * 
     * @param layer {OpenLayers.Layer} The layer to set the visiblity.
     * 
     * @param visible {boolean} True if the layer should be visible, otherwise
     * false.
     * 
     * @param opacity {float} The opacity that this layer should be if it
     * is visible. A value from 0 (transparent) to 1 (opaque).
     */
    ns.setVisibility = function(layer, visible, opacity) {
        var actualOpacity = ( visible ) ? opacity : 0;
        layer.div.style.opacity = actualOpacity;    
        if ( visible && opacity > 0 && !layer.getVisibility() ) {
            layer.setVisibility(true);
        }
    };
    
    ns.getLayerByName = function(map, name) {
        var layers = map.getLayersByName(name);
        if ( layers && layers.length > 1 ) {
            throw new Error("Multiple layers found for: " + name);    
        }
        if ( layers ) {
            return layers[0];
        }
    };
    
    ns.isPolygonValid = function(polygon, maxDistance) {
        var outerRing = polygon.components[0];
        for ( var i = 0; i < outerRing.components.length - 1; i++ ) {
            var p1 = outerRing.components[i];
            var p2 = outerRing.components[i + 1];
            if ( Math.abs(p2.x - p1.x) > maxDistance ) {
                return false;
            }
        } 
        return true;
    };
    
    ns.splitAntiMeridian = function(polygon, maxDistance) {
        var outerRing = polygon.components[0];
        var points = outerRing.components.slice();
        var adjustSign = ( points[0].x < 0 ) ? -1 : 1; 
        for ( var i = 0 ; i < points.length - 1; i++ ) {
            var p1 = points[i];
            var p2 = points[i+1];
            var distance = Math.abs(p2.x - p1.x);
            if ( distance > maxDistance ) {
                points[i+1] = new OpenLayers.Geometry.Point(
                        p2.x + (360 * adjustSign), p2.y);
            }
        }
        var poly1 = new OpenLayers.Geometry.Polygon(
            [new OpenLayers.Geometry.LinearRing(points)]
        );
        adjustSign *= -1;
        for ( var j = 0; j < points.length; j++ ) {
            points[j] = new OpenLayers.Geometry.Point(
                points[j].x + (360 * adjustSign), points[j].y);
        }
        var poly2 = new OpenLayers.Geometry.Polygon(
            [new OpenLayers.Geometry.LinearRing(points)]
        );
        return new OpenLayers.Geometry.MultiPolygon([poly1, poly2]);
    }
    
}(Worldview.Map));
