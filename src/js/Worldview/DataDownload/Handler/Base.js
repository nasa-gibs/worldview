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

Worldview.DataDownload.Handler.Base = function(config, model) {

    var self = {};

    self.events = wv.util.events();
    self.echo = null;
    self.ajax = null;

    var init = function() {
        var ns = Worldview.DataDownload.Handler.Base;

        if ( !ns.echo ) {
            if ( config.parameters.mockECHO ) {
                ns.echo = Worldview.DataDownload.ECHO.MockClient(
                        config.parameters.mockECHO);
            } else {
                ns.echo = Worldview.DataDownload.ECHO.Client({
                    timeout: config.parameters.timeoutECHO
                });
            }
        }
        self.echo = ns.echo;

        if ( !ns.ajax ) {
            ns.ajax = Worldview.AjaxCache();
        }
        self.ajax = ns.ajax;

        self.extents = {};
        $.each(config.projections, function(key, projection) {
            self.extents[projection.crs] = projection.maxExtent;
        });
    };

    self.submit = function() {
        var productConfig = config.products[model.selectedProduct].query;
        var queryData = $.extend(true, {}, productConfig);
        var promise = self._submit(queryData);

        var queriedProduct = model.selectedProduct;
        promise.done(function(data) {
            try {
                if ( model.selectedProduct !== queriedProduct ) {
                    self.events.trigger("results", {granules: [], meta: {}});
                    return;
                }
                var results = self._processResults(data);
                self.events.trigger("results", results);
            } catch ( error ) {
                self.events.trigger("error", "exception", error);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            if ( textStatus === "timeout" ) {
                self.events.trigger("timeout");
            } else {
                self.events.trigger("error", textStatus, errorThrown);
            }
        });
        // FIXME: Deprecated API use
        if ( !promise.isResolved() && !promise.isRejected() ) {
            self.events.trigger("query");
        }
    };

    init();
    return self;
};

