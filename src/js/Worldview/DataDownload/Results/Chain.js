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
 * @module Worldview.DataDownload.Results
 */
Worldview.namespace("DataDownload.Results");

Worldview.DataDownload.Results.Chain = function() {

    var self = {};
    
    self.processes = [];
    
    self.process = function(results) {
        $.each(results.granules, function(index, granule) {
            delete granule.filtered;
            delete granule.filteredBy;    
        });
        $.each(self.processes, function(index, process) {
            $.each(results.granules, function(index2, granule) {
                if ( !granule.filtered ) {
                    var result = process.process(results.meta, granule);
                    if ( !result ) {
                        granule.filtered = true;
                        granule.filteredBy = process.name;
                    } 
                }   
            });
            if ( process.after ) {
                process.after(results);
            }
        });
        
        newGranules = [];
        filteredGranules = {};
        $.each(results.granules, function(index, granule) {
            if ( !granule.filtered ) {
                newGranules.push(granule); 
            } else {
                if ( !filteredGranules[granule.filteredBy] ) {
                    filteredGranules[granule.filteredBy] = [];
                }
                filteredGranules[granule.filteredBy].push(granule);
            }
        });

        return {
            meta: results.meta,
            granules: newGranules,
            filtered: filteredGranules
        };
    };
    
    return self;
        
};

