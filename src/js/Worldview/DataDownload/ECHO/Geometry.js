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

Worldview.DataDownload.ECHO.Geometry = function(result) {

    var MAX_DISTANCE = 5;
    
    var self = {};
    self.polygons = [];
        
    var init = function() {
        if ( result.polygons ) {
            initFromPolygons(result.polygons);
        } else if ( result.boxes ) {
            initFromBoxes(result.boxes);
        } else {
            throw new Error("Unable to find spatial field");
        }
    };
    
    self.toOpenLayers = function() {
        olPolygons = [];
        $.each(self.polygons, function(index, polygon) {
            var olRings = [];
            $.each(polygon, function(index, ring) {
                var olPoints = [];
                $.each(ring, function(index, point) {
                    var p = new OpenLayers.Geometry.Point(point.x, point.y);
                    olPoints.push(p);    
                });
                olRings.push(new OpenLayers.Geometry.LinearRing(olPoints));
            });
            olPolygons.push(new OpenLayers.Geometry.Polygon(olRings));
        });
        return olPolygons[0];    
    };
        
    var initFromPolygons = function(echoPolygons) {
        $.each(echoPolygons, function(index, echoPolygon) {
            var rings = [];
            $.each(echoPolygon, function(index, echoRing) {
                var ring = [];
                var parts = echoRing.split(" ");
                for ( var i = 0; i < parts.length; i+= 2 ) {
                    var y = parseFloat(parts[i]);
                    var x = parseFloat(parts[i + 1]);
                    ring.push({x: x, y: y});
                }
                rings.push(ring);    
            });
            self.polygons.push(rings);
        });
    };
    
    var initFromBoxes = function(echoBoxes) {
        $.each(echoBoxes, function(index, echoBox) {
            var ring = [];
            var fields = echoBox.split(" ");
            var ymin = parseFloat(fields[0]);
            var xmin = parseFloat(fields[1]);
            var ymax = parseFloat(fields[2]);
            var xmax = parseFloat(fields[3]);
            ring.push({x: xmin, y: ymin});
            ring.push({x: xmax, y: ymin});
            ring.push({x: xmax, y: ymax});
            ring.push({x: xmin, y: ymax});
            ring.push({x: xmin, y: ymin});
           
            self.polygons.push([densify(ring)]);
        });    
    };
    
    var densify = function(ring) {
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
        return points;      
    };
    
    init();
    return self;
}
