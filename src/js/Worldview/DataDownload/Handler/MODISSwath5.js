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

Worldview.DataDownload.Handler.MODISSwath5 = function(config, model, spec) {
    
    var startTimeDelta = spec.startTimeDelta || 0;
    var endTimeDelta = spec.endTimeDelta || 0;
    
    var self = Worldview.DataDownload.Handler.Base(config);
        
    self._submit = function() {
        productParameters = config.products[model.selectedProduct].query;
        layerParameters = {};
        if ( config.layers[model.selectedLayer].echo.query ) {
            layerParameters = config.layers[model.selectedLayer].echo.query        
        }
        data = $.extend(true, {}, productParameters, layerParameters)
        var queryOptions = {
            time: model.time,
            startTimeDelta: startTimeDelta,
            endTimeDelta: endTimeDelta,
            data: data
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
            ns.Results.GeometryFromECHO(model.crs),
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
    
    return self;
}
