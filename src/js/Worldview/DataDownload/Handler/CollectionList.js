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

Worldview.DataDownload.Handler.CollectionList = function(config, model, spec) {
    
    var self = Worldview.DataDownload.Handler.Base(config, model);
    
    self._submit = function(queryData) {
        var queryOptions = {
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
            ns.Results.TagList(),
            ns.Results.TagProduct(model.selectedProduct),
            ns.Results.TagVersion(),
            ns.Results.CollectVersions(),
            ns.Results.VersionFilter(),
            ns.Results.ProductLabel(config.products[model.selectedProduct].name)
        ];
        return chain.process(results);
    };
    
    return self;
};