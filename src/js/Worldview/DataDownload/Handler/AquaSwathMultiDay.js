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

Worldview.DataDownload.Handler.AquaSwathMultiDay = function(config, model) {
    
    var ns = Worldview.DataDownload;

    var spec = {
        startTimeDelta: -180,
        endTimeDelta: 180,
        maxDistance: 270,
        eastZone: 300,
        westZone: 1380
    };
        
    var self = ns.Handler.MODISSwathMultiDay(config, model, spec);
    return $.extend(true, self, spec);
};
