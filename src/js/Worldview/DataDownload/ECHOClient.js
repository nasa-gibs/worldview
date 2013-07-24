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
    
    var log = Logging.getLogger("ECHOClient");
    var endpoint = "data/echo.cgi";
    var errorHandler;
    
    var self = {};
    
    var init = function() {
        spec = spec || {};
        errorHandler = spec.errorHandler || defaultErrorHandler;    
    };
    
    self.query = function(parameters, callback) {
        request = $.ajax({
            url: endpoint,
            data: parameters,
            dataType: "json",
            success: onSuccess,
            error: onError
        });            
    };    
    
    var onSuccess = function(results) {
        console.log(results);    
    };
    
    var onError = function(jqXHR, status, error) {
        // It is not an error if the query was aborted
        if ( status === "abort" ) {
            return;    
        }
        errorHandler(status, error);
    };
    
    var defaultErrorHandler = function(status, error) {
        log.error("[" + status + "] Unable to query ECHO: " + error);
    };
    
    init();
    return self;
}
