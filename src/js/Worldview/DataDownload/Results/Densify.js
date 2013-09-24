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

Worldview.DataDownload.Results.Densify = function() {

    var MAX_DISTANCE = 5;    
    var self = {};
    
    self.name = "Densify";
    
    self.process = function(meta, granule) {
        var geom = granule.geometry[Worldview.Map.CRS_WGS_84];
        var newGeom = null;
        if ( geom.CLASS_NAME === "OpenLayers.Geometry.Polygon" ) {
            newGeom = densifyPolygon(geom);       
        } else if ( geom.CLASS_NAME === "OpenLayers.Geometry.MultiPolygon" ) {
            var polys = [];
            $.each(geom.components, function(index, poly) {
                polys.push(densifyPolygon(poly));
            });
            newGeom = new OpenLayers.Geometry.MultiPolygon(polys);
        } else {
            throw Error("Cannot handle geometry: " + geom.CLASS_NAME);
        }
        granule.geometry[Worldview.Map.CRS_WGS_84] = newGeom;
        return granule;
    };
    
    var densifyPolygon = function(poly) {
        // Get the outer ring and then get an array of all the points
        var ring = poly.components[0].components.slice();
        var points = [];
        for ( var i = 0; i < ring.length - 2; i++ ) {
            var start = ring[i];
            var end = ring[i + 1];
            var distance = Worldview.Map.distance2D(start, end);
            var numPoints = Math.floor(distance / MAX_DISTANCE);
            points.push(start);
            for ( var j = 1; j < numPoints - 1; j++ ) {
                var d = j / numPoints;
                // This is what REVERB does, so we will do the same
                var p = Worldview.Map.interpolate2D(start, end, d);
                points.push(p);
            }
        }
        points.push(end);
        var newRing = new OpenLayers.Geometry.LinearRing(points);
        var newPoly = new OpenLayers.Geometry.Polygon([newRing]);
                
        return newPoly;        
    };
    
    return self;
};  
        