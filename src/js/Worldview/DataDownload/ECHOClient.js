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
 * @module Worldview.DataDownload
 */
Worldview.namespace("DataDownload");

Worldview.DataDownload.ECHOClient = function(spec) {

    // Hold a maximum of ten results
    var CACHE_SIZE = 10;
    // Hold results for a maximum of ten minutes
    var CACHE_TIME = 10 * 60;
        
    var log = Logging.getLogger("ECHOClient");
    var endpoint = "data/echo.cgi";
    var errorHandler;
    var cache;
    var active = false;
        
    var self = {};
    
    self.events = Worldview.Events();
    
    self.EVENT_QUERY = "query";
    self.EVENT_RESULTS = "results";
    self.EVENT_CANCEL = "cancel";
    self.EVENT_ERROR = "error";
    
    var init = function() {
        spec = spec || {};
        cache = new Cache(CACHE_SIZE);
    };
    
    self.query = function(parameters) {
        if ( active ) {
            throw new Error("Another query is already executing");
        }
        
        var key = $.param(parameters, true);
        var results = cache.getItem(key);
        if ( results ) {
            onSuccess(results, parameters);
        } else {
            active = true;      
            request = $.ajax({
                url: endpoint,
                data: parameters,
                traditional: true,
                dataType: "json",
                success: function(results) {
                    onSuccess(results, parameters);
                },
                error: function(jqXHR, status, error) {
                    onError(jqXHR, status, error, parameters);
                }
            });
            self.events.trigger(self.EVENT_QUERY);
        }            
    };    
    
    var onSuccess = function(results, parameters) {
        active = false;
        
        var key = $.param(parameters, true);
        cache.setItem(key, results);
        
        self.events.trigger(self.EVENT_RESULTS, results.feed.entry);
    };
    
    var onError = function(jqXHR, status, error, parameters) {
        active = false;
        // It is not an error if the query was aborted
        if ( status === "abort" ) {
            self.events.trigger(self.EVENT_CANCEL);
            return;    
        }
        self.events.trigger(self.EVENT_ERROR, status, error, parameters);     
    };
    
    init();
    return self;
}
