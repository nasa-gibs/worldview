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

Worldview.DataDownload.Handler.MODISSwathMultiDay = function(config, model, spec) {
    
    var startTimeDelta = spec.startTimeDelta || 0;
    var endTimeDelta = spec.endTimeDelta || 0;
    
    var self = Worldview.DataDownload.Handler.Base(config, model);
        
    var init = function() {
        var productConfig = config.products[model.selectedProduct];
        if ( !productConfig.mbr ) { 
            self.extents[Worldview.Map.CRS_WGS_84] = 
                   new OpenLayers.Bounds(-180, -60, 180, 60);
        }
    };
    
    self._submit = function(queryData) {
        var queryOptions = {
            time: model.time,
            startTimeDelta: startTimeDelta,
            endTimeDelta: endTimeDelta,
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
            ns.Results.Transform(model.crs),
            ns.Results.ExtentFilter(model.crs, self.extents[model.crs]),
            ns.Results.TimeFilter({
                time: model.time,
                eastZone: spec.eastZone,
                westZone: spec.westZone,
                maxDistance: spec.maxDistance
            }),
            ns.Results.TimeLabel(model.time),
            ns.Results.ConnectSwaths(model.crs)
        ];
        return chain.process(results);
    };
    
    init();
    return self;
}
