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
 * Namespace: Worldview.OpenLayers
 * Worldview specific code when using OpenLayers.
 */
Worldview.namespace("OpenLayers");

$(function(ns) {
    
    /**
     * Constant: COORDINATE_CONTROLS
     * An object that contains OpenLayers.Contorl.MousePosition objects
     * that update the current latitude/longitude values on the map as the
     * mouse moves. Keyed by projection name, either "geographic", "arctic",
     * or "antarctic".
     * 
     * Example:
     * (begin code)
     * var contorl = Worldview.OpenLayers.COORDINATE_CONTROLS["geographic"];
     * (end code)
     */
    ns.COORDINATE_CONTROLS = {
        "geographic": new OpenLayers.Control.MousePosition({
            formatOutput: function(mouseLonLat) {                           
                    return mouseLonLat.lon.toFixed(3) + "&#176;, " + 
                           mouseLonLat.lat.toFixed(3) + "&#176;";
             },         
        }),
        "arctic": new OpenLayers.Control.MousePosition({
            formatOutput: function(mouseLonLat) {           
                    return "EPSG:3031 coords: " + 
                            Math.round(mouseLonLat.lon) + "m, " + 
                            Math.round(mouseLonLat.lat) + "m";
             }
        }),
        "antarctic": new OpenLayers.Control.MousePosition({
            formatOutput: function(mouseLonLat) {           
                    return "EPSG:3995 coords: " + 
                            Math.round(mouseLonLat.lon) + "m, " + 
                            Math.round(mouseLonLat.lat) + "m";
            },
        })
    };

}(Worldview.OpenLayers));
