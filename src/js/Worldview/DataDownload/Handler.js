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
 * @module Worldview.DataDownload.Handler
 */
Worldview.namespace("DataDownload");

Worldview.DataDownload.Handler = function() {
        
    var ns = {};
        
    ns.getByName = function(name) {
        var map = {
            "AquaSwath5":   Worldview.DataDownload.Handler.AquaSwath5,
            "MODISGrid":    Worldview.DataDownload.Handler.MODISGrid,
            "MODISMix":     Worldview.DataDownload.Handler.MODISMix,
            "TerraSwath5":  Worldview.DataDownload.Handler.TerraSwath5
        };
        var handler = map[name];
        if ( !handler ) {
            throw new Error("No such handler: " + name);
        }    
        return handler;
    }
    
    return ns;    
}();
