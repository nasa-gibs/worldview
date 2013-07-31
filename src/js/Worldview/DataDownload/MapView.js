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
    var self = {};
    var results = null;
        
    var buttonLayers = ns.ButtonLayers(model, maps, config);
    var hoverLayers = ns.HoverLayers(model, maps, config);
        
    var bounds = {};
    
    var init = function() {
        $.each(config.projections, function(projection, projectionConfig) {
            bounds[projection] = 
                new OpenLayers.Bounds(projectionConfig.echo.extent);
        });
        
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
    
    var onQueryResults = function(r) {
        results = r;
        update();
    };
    
    var update = function() {
        if ( !results ) {
            return;
        }
        
        $.each(results, function(index, result) {
            if ( !result.geometry ) {
                result.geometry = {};
            }  
            if ( !result.centroid ) {
                result.centroid = {};
            }
            if ( !result.geometry[model.epsg] ) {
                var geom = Worldview.DataDownload.ECHOGeometry(result)
                        .toOpenLayers("EPSG:4326", "EPSG:" + model.epsg);
                // Only add the geometry if it is in the extents
                var extent = bounds[model.projection];
                var mbr = geom.getBounds();
                if ( extent.intersectsBounds(mbr) ) {
                    result.geometry[model.epsg] = geom;
                    result.centroid[model.epsg] = geom.getCentroid();
                }                
            }         
        });        
        buttonLayers.update(results);
        
    }
            
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
