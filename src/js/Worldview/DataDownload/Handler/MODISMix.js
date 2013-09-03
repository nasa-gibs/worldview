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

Worldview.DataDownload.Handler.MODISMix = function(config, model, spec) {
    
    var self = Worldview.DataDownload.Handler.Base(config, model);
    var nrtHandler;
    var scienceHandler;
    
    var init = function() {
        var productConfig = config.products[model.selectedProduct];
        
        var nrtHandlerName = productConfig.nrt.handler;
        var nrtHandlerFactory = 
                Worldview.DataDownload.Handler.getByName(nrtHandlerName);
        nrtHandler = nrtHandlerFactory(config, model, spec);
        
        var scienceHandlerName = productConfig.science.handler;
        var scienceHandlerFactory =
                Worldview.DataDownload.Handler.getByName(scienceHandlerName);
        scienceHandler = scienceHandlerFactory(config, model, spec);
    };
  
    self._submit = function() {
        var crs = model.crs.replace(/:/, "_");
        
        var nrtQueryOptions = {
            time: model.time,
            startTimeDelta: nrtHandler.startTimeDelta,
            endTimeDelta: nrtHandler.endTimeDelta,
            data: config.products[model.selectedProduct].query.nrt            
        };
        var nrt = self.echo.submit(nrtQueryOptions);
        
        var scienceQueryOptions = {
            time: model.time,
            data: config.products[model.selectedProduct].query.science       
        };
        var science = self.echo.submit(scienceQueryOptions);
        
        var grid = self.ajax.submit({
            url: "data/MODIS_Grid." + crs + ".json?v=" + Worldview.BUILD_NONCE,
            dataType: "json"
        });

        return Worldview.AjaxJoin([
            { item: "nrt",      promise: nrt },
            { item: "science",  promise: science },
            { item: "grid",     promise: grid }
        ]);              
    }; 
    
    self._processResults = function(data) {
        var useNRT = false;
        if ( data.nrt.length > 0 && data.science.length > 0 ) {
            useNRT = ( model.prefer === "nrt" );
        } else {
            useNRT = ( data.nrt.length > 0 );
        } 
        
        if ( useNRT ) {
            return nrtHandler._processResults(data.nrt);
        } else {
            return scienceHandler._processResults({
                granules: data.science,
                grid: data.grid
            });
        }
    };
    
    init();
    return self;
    
};
