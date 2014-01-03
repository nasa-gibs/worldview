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

Worldview.DataDownload.Handler.MODISGrid = function(config, model, spec) {

    var self = Worldview.DataDownload.Handler.Base(config);

    self._submit = function() {
        var crs = model.crs.replace(/:/, "_");

        var queryOptions = {
            time: model.time,
            data: config.products[model.selectedProduct].query
        };

        var granules = self.echo.submit(queryOptions);
        var grid = self.ajax.submit({
            url: "data/MODIS_Grid." + crs + ".json?v=" + wv.brand.BUILD_NONCE,
            dataType: "json"
        });

        return Worldview.AjaxJoin([
            { item: "granules", promise: granules },
            { item: "grid",     promise: grid }
        ]);
    };

    self._processResults = function(data) {
        var productConfig = config.products[model.selectedProduct];
        var results = {
            meta: {
                gridFetched: data.grid
            },
            granules: data.granules
        };

        var ns = Worldview.DataDownload;
        var chain = ns.Results.Chain();
        chain.processes = [
            ns.Results.TagProduct(model.selectedProduct),
            ns.Results.TagVersion(),
            ns.Results.TagURS(productConfig.urs),
            ns.Results.CollectVersions(),
            ns.Results.VersionFilter(),
            ns.Results.MODISGridIndex(),
            ns.Results.GeometryFromMODISGrid(model.crs),
            ns.Results.ExtentFilter(model.crs, self.extents[model.crs]),
            ns.Results.MODISGridLabel()
        ];
        return chain.process(results);
    };

    return self;

};

