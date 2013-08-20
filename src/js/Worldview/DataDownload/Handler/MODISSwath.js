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

Worldview.DataDownload.Handler.MODISSwath = function(config, model, spec) {
    
    var MAX_DISTANCE = 270;    
    var self = Worldview.DataDownload.Handler.Base(config, model);
      
    self._submit = function(queryData) {
        var queryOptions = {
            time: model.time,
            data: queryData
        };
        
        return self.echo.submit(queryOptions);
    };
    
    self._processResults = function(data) {
        var results = {
            meta: {},
            granules: data
        };
        
        var ns = Worldview.DataDownload;
        var productConfig = config.products[model.selectedProduct];
        var chain = ns.Results.Chain();
        chain.processes = [
            ns.Results.TagNRT(productConfig.nrt),
            ns.Results.CollectPreferred(model.prefer),
            ns.Results.PreferredFilter(model.prefer), 
            ns.Results.GeometryFromECHO(Worldview.Map.CRS_WGS_84),
            ns.Results.AntiMeridianMulti(MAX_DISTANCE),
            ns.Results.Transform(model.crs),
            ns.Results.ExtentFilter(model.crs, self.extents[model.crs]),
            ns.Results.TimeLabel(model.time),
            ns.Results.ConnectSwaths(model.crs)
        ];
        return chain.process(results);
    };
    
    return self;
}