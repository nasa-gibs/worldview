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
        
    // FIXME: Make these static
    ns.getByName = function(name) {
        var map = {
            "AquaSwathMultiDay":    Worldview.DataDownload.Handler.AquaSwathMultiDay,
            "CollectionList":       Worldview.DataDownload.Handler.CollectionList,
            "List":                 Worldview.DataDownload.Handler.List,
            "MODISGrid":            Worldview.DataDownload.Handler.MODISGrid,
            "MODISMix":             Worldview.DataDownload.Handler.MODISMix,
            "MODISSwath":           Worldview.DataDownload.Handler.MODISSwath,
            "TerraSwathMultiDay":   Worldview.DataDownload.Handler.TerraSwathMultiDay,
            "Aura":                 Worldview.DataDownload.Handler.Aura        
        };
        var handler = map[name];
        if ( !handler ) {
            throw new Error("No such handler: " + name);
        }    
        return handler;
    };
    
    return ns;    
}();
