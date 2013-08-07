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

Worldview.DataDownload.ECHOClientMock = function(spec) {
    
    var self = {};
    var endpoint = "mock/echo.cgi";
    
    self.events = Worldview.Events();
    
    self.query = function(parameters) {
        self.events.trigger("query");
        $.getJSON(endpoint, function(results) {
            results = adjustResults(parameters, results);
            self.events.trigger("results", results.feed.entry);
        })
        .fail(function() {
            self.events.trigger("error");
        });
    };
    
    var adjustResults = function(parameters, results) {
        var day = REGISTRY.getState().time;
        // Mock data was retrieved for Aug 6, 2013
        var resultsDay = new Date(Date.UTC(2013, 7, 6));
        var diffDays = (day - resultsDay) / (1000 * 60 * 60 * 24);
        
        $.each(results.feed.entry, function(index, entry) {
            var timeStart = Date.parseISOString(entry.time_start);
            timeStart.setUTCDate(timeStart.getUTCDate() + diffDays);
            entry.time_start = timeStart.toISOString();
            
            var timeEnd = Date.parseISOString(entry.time_end);
            timeEnd.setUTCDate(timeEnd.getUTCDate() + diffDays);
            entry.time_end = timeEnd.toISOString();
        });    
        
        return results;
    };
    
    return self;
};
      
