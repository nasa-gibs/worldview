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
Worldview.namespace("DataDownload.Handler");

Worldview.DataDownload.Handler.AquaSwath5 = function(config, model) {
    
    var parameters = {
        "DAY": {
            startTimeDelta: -180,
            endTimeDelta: 180,
            maxDistance: 270,
            eastZone: 300,
            westZone: 1380
        },
        "NIGHT": {
            startTimeDelta: 0,
            endTimeDelta: 0,
            maxDistance: 270,
            eastZone: 300,
            westZone: 1380,
            timeOffset: 720
        }
    }
    
    var echoConfig = config.layers[model.selectedLayer].echo;
    var spec;
    if ( echoConfig.query && echoConfig.query.dayNightFlag === "NIGHT" ) {
        spec = parameters.NIGHT;   
    } else {
        spec = parameters.DAY;
    }
    
    var self = Worldview.DataDownload.Handler.MODISSwath5(config, model, spec);
    return $.extend(true, self, spec);
};
