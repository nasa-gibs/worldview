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
Worldview.namespace("DataDownload.Results");

Worldview.DataDownload.Results.ConnectSwaths = function(projection) {
    
    var log = Logging.getLogger("Worldview.DataDownload");
    var MAX_DISTANCE_GEO = 270;
    var startTimes = {};
    var endTimes = {};
    
    var self = {};
    self.name = "ConnectSwaths";
    
    self.process = function(meta, granule) {
        if ( !granule.centroid[projection] ) {
            return;
        }
        if ( startTimes[granule.time_start] ) {
            log.warn("Discarding duplicate start time", granule.time_start,
                    granule, startTimes[granule.time_start]);
            return;
        }
        if ( endTimes[granule.time_end] ) {
            log.warn("Discarding duplicate end time", granule.time_end,
                    granule, endTimes[granule.time_end]);
            return; 
        }
        var swath = [granule];
        startTimes[granule.time_start] = swath;
        endTimes[granule.time_end] = swath;
        
        combineSwath(swath);
        return granule;
    };
    
    self.after = function(results) {
        results.meta.swaths = [];
        $.each(startTimes, function(index, swath) {
            if ( swath.length > 1 ) {
                results.meta.swaths.push(swath);
            }
        });    
    };
    
    var combineSwath = function(swath) {
        var combined = false;
        
        var maxDistance = ( projection === Worldview.Map.CRS_WGS_84 ) 
                ? MAX_DISTANCE_GEO : Number.POSITIVE_INFINITY; 
        // Can this swath be added to the end of other swath?
        var otherSwath = endTimes[swath[0].time_start];
        if ( otherSwath ) {
            var otherGranule = otherSwath[otherSwath.length - 1];
            if ( distance(swath[0], otherGranule) < maxDistance ) {
                // Remove entries for this swath
                delete startTimes[swath[0].time_start];
                delete endTimes[swath[swath.length - 1].time_end];
                
                // Remove entries for other swath
                delete startTimes[otherSwath[0].time_start];
                delete endTimes[otherSwath[otherSwath.length - 1].time_end];
                            
                // Combine swaths
                var newSwath = otherSwath.concat(swath);
                
                startTimes[newSwath[0].time_start] = newSwath;
                endTimes[newSwath[newSwath.length - 1].time_end] = newSwath;
                combined = true;
                swath = newSwath;
            }
        }
        
        /*
        var otherSwath = startTimes[swath[0].time_end];
        if ( otherSwath && distance(swath[0], otherSwath) < MAX_DISTANCE ) {
            // Remove entries for this swath
            delete startTimes[swath[0].time_start];
            delete endTimes[swath[swath.length - 1].time_end];
            
            // Remove entries for other swath
            delete startTimes[otherSwath[0].time_start];
            delete endTimes[otherSwath[otherSwath.length - 1].time_end];
                        
            // Combine swaths
            var newSwath = swath.concat(otherSwath);
            
            startTimes[newSwath[0].time_start] = newSwath;
            endTimes[newSwath[newSwath.length - 1].time_end] = newSwath;
            combined = true;
            swath = newSwath;
        }        
        */
       
        if ( combined ) {
            combineSwath(swath);
        }
    };
    
    var distance = function(g1, g2) {
        var x1 = g1.centroid[projection].x;
        var x2 = g2.centroid[projection].x;
        return Math.abs(x2 - x1);    
    };
    
    return self;
    
};

