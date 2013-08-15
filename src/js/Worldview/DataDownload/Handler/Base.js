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

Worldview.DataDownload.Handler.Base = function(config) {

    var self = {};
    
    self.events = Worldview.Events();
    self.echo = null;
    self.ajax = null;
    
    var init = function() {
        var ns = Worldview.DataDownload.Handler.Base;
        
        if ( !ns.echo ) {
            if ( config.parameters.mockECHO ) {
                ns.echo = Worldview.DataDownload.ECHO.MockClient(
                        config.parameters.mockECHO);
            } else {
                ns.echo = Worldview.DataDownload.ECHO.Client();
            }
        }
        self.echo = ns.echo;
        
        if ( !ns.ajax ) {
            ns.ajax = Worldview.AjaxCache();
        }
        self.ajax = ns.ajax; 
        
        self.extents = {};
        $.each(config.projections, function(key, projection) {
            if ( projection.queryExtent ) {
                self.extents[projection.crs] = 
                        new OpenLayers.Bounds(projection.queryExtent);
            } else {
                self.extents[projection.crs] = projection.maxExtent;
            }
        });
    };
    
    self.submit = function() {
        var promise = self._submit();

        promise.done(function(data) {
            try {
                var results = self._processResults(data);
                self.events.trigger("results", results);
            } catch ( error ) {
                self.events.trigger("error", "exception", error);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("ERROR", textStatus, errorThrown);
            self.events.trigger("error", textStatus, errorThrown);
        });
        // FIXME: Deprecated API use
        if ( !promise.isResolved() && !promise.isRejected() ) {
            self.events.trigger("query");
        }              
    };
    
    init();
    return self;
};

