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
Worldview.namespace("DataDownload");

Worldview.DataDownload.MapView = function(model, maps, config) {
    
    var ns = Worldview.DataDownload;
    var log = Logging.getLogger("Worldview.DataDownload");
    
    var self = {};
    var results = [];
        
    var buttonLayers = ns.ButtonLayers(model, maps, config);
    var hoverLayers = ns.HoverLayers(model, maps, config);
            
    var filterMap = {
        extent: ns.ExtentFilter,
        time: ns.TimeFilter
    };
    
    var init = function() {        
        model.events
            .on("query", clear)
            .on("queryResults", onQueryResults)
            .on("projectionUpdate", onProjectionUpdate)
            .on("deactivate", onDeactivate)    
            .on("activate", update);  
            
        buttonLayers.events
            .on("hoverover", function(event) {
                hoverLayers.hoverOver(event.feature);
            })
            .on("hoverout", function() {
                hoverLayers.hoverOut();
            });
    };
    
    var onQueryResults = function(newResults) {
        update(newResults);
    };
    
    var update = function(newResults) {
        if ( newResults ) {
            results = filter(newResults);
        }
        buttonLayers.update(results);    
    }
    
    var filter = function(newResults) {
        if ( newResults.length === 0 ) {
            return [];
        }
        var filters = createFilters();
        var filteredResults = [];
        
        $.each(newResults, function(index, result) {
            if ( !result.geometry ) {
                result.geometry = {};
            }  
            if ( !result.centroid ) {
                result.centroid = {};
            }
            var echoGeom = Worldview.DataDownload.ECHOGeometry(result);
            if ( !result.geometry["4326"] ) {
                var geom = echoGeom.toOpenLayers();
                var centroid = geom.getCentroid();
                result.geometry["4326"] = geom;
                result.centroid["4326"] = centroid;
            }          
            if ( !result.geometry[model.epsg] ) {
                var projGeom = echoGeom.toOpenLayers("EPSG:4326", 
                        "EPSG:" + model.epsg);
                var projCentroid = projGeom.getCentroid();
                result.geometry[model.epsg] = projGeom;
                result.centroid[model.epsg] = projCentroid;
            }
            $.each(filters, function(index, filter) {
                if ( result ) {
                    result = filter.filter(result);
                }
            });
            if ( result ) {
                filteredResults.push(result);
            }    
        });  
        log.debug("filteredResults", filteredResults.length);
        return filteredResults;        
    };

    var createFilters = function() {
        var layer = model.selectedLayer;
        var method = config.products[layer].echo.method
        var filterNames = config.echo[method].filters;
        var filters = [];
        $.each(filterNames, function(index, name) {
            var options = config.echo[method].options[name] || {};
            var func = filterMap[name];
            if ( !func ) {
                throw new Error("No such filter: " + name);
            }
            var filter = func(config, options, model);
            filters.push(filter);  
        }); 
        return filters;       
    };
                
    var onProjectionUpdate = function() {
        update();
    };
    
    var onDeactivate = function() {
        hoverLayers.dispose();
        buttonLayers.dispose();
    };
        
    var clear = function() {
        hoverLayers.clear();
        buttonLayers.clear();
    };
    
    init();
    return self;
}
