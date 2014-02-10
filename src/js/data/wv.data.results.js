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
 * @module wv.data
 */
var wv = wv || {};
wv.data = wv.data || {};


wv.data.results = wv.data.results || {};

wv.data.results.antiMeridianMulti = function(maxDistance) {

    var self = {};
    self.name = "AntiMeridianMulti";

    self.process = function(meta, granule) {
        var geom = granule.geometry[wv.map.CRS_WGS_84];
        if ( !wv.map.isPolygonValid(geom, maxDistance) ) {
            var geomEast = wv.util.map.adjustAntiMeridian(geom, 1);
            var geomWest = wv.util.map.adjustAntiMeridian(geom, -1);
            var centroidEast = geomEast.getCentroid();
            var centroidWest = geomWest.getCentroid();
            var newGeom =
                new OpenLayers.Geometry.MultiPolygon([geomEast, geomWest]);
            var newCentroid =
                new OpenLayers.Geometry.MultiPoint([centroidEast, centroidWest]);
            granule.geometry[wv.map.CRS_WGS_84] = newGeom;
            granule.centroid[wv.map.CRS_WGS_84] = newCentroid;
        }
        return granule;
    };

    return self;
};


wv.data.results.chain = function() {

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


wv.data.results.collectPreferred = function(prefer) {

    var self = {};

    self.name = "CollectPreferred";

    self.process = function(meta, granule) {
        if ( !meta.preferred ) {
            meta.preferred = {};
        }
        var preferred =
                (prefer === "nrt" && granule.nrt) ||
                (prefer === "science" && !granule.nrt);
        if ( preferred ) {
            var timeStart = wv.data.echo.roundTime(granule.time_start);
            meta.preferred[timeStart] = granule;
        }
        return granule;
    };

    return self;
};


wv.data.results.collectVersions = function() {

    var self = {};

    self.name = "CollectVersions";

    self.process = function(meta, granule) {
        if ( !meta.versions ) {
            meta.versions = {};
        }
        if ( granule.version ) {
            var timeStart = wv.data.echo.roundTime(granule.time_start);
            var previousVersion = meta.versions[timeStart] || 0;
            meta.versions[timeStart] = Math.max(previousVersion,
                    granule.version);
        }
        return granule;
    };

    return self;
};


wv.data.results.connectSwaths = function(projection) {

    var MAX_DISTANCE_GEO = 270;
    var startTimes = {};
    var endTimes = {};

    var self = {};
    self.name = "ConnectSwaths";

    self.process = function(meta, granule) {
        if ( !granule.centroid[projection] ) {
            return;
        }
        var timeStart = roundTime(granule.time_start);
        var timeEnd = roundTime(granule.time_end);

        if ( startTimes[timeStart] ) {
            console.warn("Discarding duplicate start time", timeStart,
                    granule, startTimes[timeStart]);
            return;
        }
        if ( endTimes[timeEnd] ) {
            console.warn("Discarding duplicate end time", timeEnd,
                    granule, endTimes[timeEnd]);
            return;
        }
        var swath = [granule];
        startTimes[timeStart] = swath;
        endTimes[timeEnd] = swath;

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

        var maxDistance = ( projection === wv.map.CRS_WGS_84 ) ?
                MAX_DISTANCE_GEO : Number.POSITIVE_INFINITY;
        var thisTimeStart = roundTime(swath[0].time_start);
        var thisTimeEnd = roundTime(swath[swath.length - 1].time_end);
        var otherSwath = endTimes[thisTimeStart];

        // Can this swath be added to the end of other swath?
        if ( otherSwath ) {
            var otherGranule = otherSwath[otherSwath.length - 1];
            var otherTimeStart = roundTime(otherSwath[0].time_start);
            var otherTimeEnd =
                    roundTime(otherSwath[otherSwath.length - 1].time_end);

            if ( connectionAllowed(swath[0], otherGranule, maxDistance) ) {
                // Remove entries for this swath
                delete startTimes[thisTimeStart];
                delete endTimes[thisTimeEnd];

                // Remove entries for other swath
                delete startTimes[otherTimeStart];
                delete endTimes[otherTimeEnd];

                // Combine swaths
                var newSwath = otherSwath.concat(swath);

                var newTimeStart = roundTime(newSwath[0].time_start);
                var newTimeEnd =
                    roundTime(newSwath[newSwath.length - 1].time_end);

                startTimes[newTimeStart] = newSwath;
                endTimes[newTimeEnd] = newSwath;
                combined = true;
                swath = newSwath;
            }
        }

        if ( combined ) {
            combineSwath(swath);
        }
    };

    // Connection is allowed as long as there is at least one path between
    // centroids that is less than the max distance
    var connectionAllowed = function(g1, g2, maxDistance) {
        var polys1 = wv.map.toPolys(g1.geometry[projection]);
        var polys2 = wv.map.toPolys(g2.geometry[projection]);
        var allowed = false;

        $.each(polys1, function(index, poly1) {
            $.each(polys2, function(index, poly2) {
                var x1 = poly1.getCentroid().x;
                var x2 = poly2.getCentroid().x;
                if ( Math.abs(x2 - x1) < maxDistance ) {
                    allowed = true;
                    return false;
                }
            });
        });
        return allowed;
    };


    var roundTime = function(timeString) {
        return wv.data.echo.roundTime(timeString);
    };

    return self;

};


wv.data.results.dateTimeLabel = function(time) {

    var self = {};

    self.name = "DateTimeLabel";

    self.process = function(meta, granule) {
        var timeStart = wv.util.parseTimestampUTC(granule.time_start);

        // Some granules may not have an end time
        if ( granule.time_end ) {
            var timeEnd = wv.util.parseTimestampUTC(granule.time_end);
            granule.label = wv.util.toISOStringDate(timeStart) + ": " +
                wv.util.toISOStringTimeHM(timeStart) + "-" +
                wv.util.toISOStringTimeHM(timeEnd);
        } else {
            granule.label = wv.util.toISOStringDate(timeStart) + ": " +
                wv.util.toISOStringTimeHM(timeStart);
        }

        return granule;
    };

    return self;

};


wv.data.results.densify = function() {

    var MAX_DISTANCE = 5;
    var self = {};

    self.name = "Densify";

    self.process = function(meta, granule) {
        var geom = granule.geometry[wv.map.CRS_WGS_84];
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
        granule.geometry[wv.map.CRS_WGS_84] = newGeom;
        return granule;
    };

    var densifyPolygon = function(poly) {
        // Get the outer ring and then get an array of all the points
        var ring = poly.components[0].components.slice();
        var points = [];
        var end;
        for ( var i = 0; i < ring.length - 2; i++ ) {
            var start = ring[i];
            end = ring[i + 1];
            var distance = wv.map.distance2D(start, end);
            var numPoints = Math.floor(distance / MAX_DISTANCE);
            points.push(start);
            for ( var j = 1; j < numPoints - 1; j++ ) {
                var d = j / numPoints;
                // This is what REVERB does, so we will do the same
                var p = wv.map.interpolate2D(start, end, d);
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


wv.data.results.extentFilter = function(projection, extent) {

    var self = {};

    self.name = "ExtentFilter";

    self.process = function(meta, granule) {
        var geom = granule.geometry[projection];
        if ( !geom ) {
            return result;
        }
        var mbr = geom.getBounds();
        if ( extent.intersectsBounds(mbr) ) {
            return granule;
        }
    };

    if ( !extent ) { throw new Error("No extent"); }
    return self;
};


wv.data.results.geometryFromECHO = function(densify) {

    var self = {};

    self.name = "GeometryFromECHO";

    self.process = function(meta, granule) {
        if ( !granule.geometry ) {
            granule.geometry = {};
        }
        if ( !granule.centroid ) {
            granule.centroid = {};
        }

        if ( !granule.geometry[wv.map.CRS_WGS_84] ) {
            var echoGeom = wv.data.echo.geometry(granule, densify);
            var geom = echoGeom.toOpenLayers();
            var centroid = geom.getCentroid();
            granule.geometry[wv.map.CRS_WGS_84] = geom;
            granule.centroid[wv.map.CRS_WGS_84] = centroid;
        }
        return granule;
    };

    return self;
};


wv.data.results.geometryFromMODISGrid = function(projection) {

    var parser = new OpenLayers.Format.GeoJSON();

    var self = {};

    self.name = "GeoemtryFromMODISGrid";

    self.process = function(meta, granule) {
        if ( !granule.geometry ) {
            granule.geometry = {};
            granule.centroid = {};
        }

        if ( !granule.geometry[projection] ) {
            var json = meta.grid[granule.hv];
            if ( !json ) {
                return;
            }
            var grid = meta.grid[granule.hv];
            var geom = parser.read(meta.grid[granule.hv].geometry, "Geometry");
            var centroid = new OpenLayers.Geometry.Point(
                grid.properties.CENTER_X,
                grid.properties.CENTER_Y
            );

            granule.geometry[projection] = geom;
            granule.centroid[projection] = centroid;
        }
        return granule;
    };

    return self;
};


wv.data.results.modisGridIndex = function() {

    var self = {};

    self.name = "MODISGridIndex";

    self.process = function(meta, granule) {
        var id = granule.producer_granule_id;
        var matches = id.match(/\.h(\d+)v(\d+)\./);
        granule.h = parseInt(matches[1], 10);
        granule.v = parseInt(matches[2], 10);
        granule.hv = "h" + granule.h + "v" + granule.v;
        return granule;
    };

    self.after = function(results) {
        results.meta.grid = {};
        $.each(results.meta.gridFetched.features, function(index, feature) {
            var key = "h" + feature.properties.H + "v" + feature.properties.V;
            results.meta.grid[key] = feature;
        });
    };

    return self;
};


wv.data.results.modisGridLabel = function() {

    var self = {};

    self.name = "MODISGridLabel";

    self.process = function(meta, granule) {
        granule.label = "h" + granule.h + " - " + "v" + granule.v;

        var timeStart = wv.util.parseTimestampUTC(granule.time_start);
        var date = wv.util.toISOStringDate(timeStart);

        granule.downloadLabel = date + ": h" + granule.h + "-" + granule.v;

        return granule;
    };

    return self;
};


wv.data.results.preferredFilter = function(prefer) {

    var self = {};

    self.name = "PreferredFilter";

    self.process = function(meta, granule) {
        var timeStart = wv.data.echo.roundTime(granule.time_start);
        if ( meta.preferred[timeStart] ) {
            if ( prefer === "nrt" && !granule.nrt ) {
                return;
            }
            if ( prefer === "science" && granule.nrt ) {
                return;
            }
        }
        return granule;
    };

    return self;
};


wv.data.results.productLabel = function(name) {

    var self = {};

    self.name = "ProductLabel";

    self.process = function(meta, granule) {
        granule.label = name;
        return granule;
    };

    return self;
};


wv.data.results.tagList = function(spec) {

    var self = {};

    self.name = "TagList";

    self.process = function(meta, granule) {
        return granule;
    };

    self.after = function(results) {
        results.meta.showList = true;
    };

    return self;
};


wv.data.results.tagNRT = function(spec) {

    var self = {};

    self.name = "TagNRT";

    self.process = function(meta, granule) {
        // Exit now if this product doesn't have information about NRT
        if ( !spec ) {
            return granule;
        }
        var isNRT;
        if ( spec.by === "value" ) {
            isNRT = granule[spec.field] === spec.value;
        } else if ( spec.by === "regex" ) {
            var re = new RegExp(spec.value);
            isNRT = re.test(granule[spec.field]);
        } else {
            throw new Error("Unknown TagNRT method: " + spec.by);
        }
        if ( isNRT ) {
            granule.nrt = true;
            meta.nrt = true;
        }
        return granule;
    };

    return self;
};


wv.data.results.tagProduct = function(product) {

    var self = {};

    self.name = "TagProduct";

    self.process = function(meta, granule) {
        granule.product = product;
        return granule;
    };

    return self;

};

// FIXME: Code copy and pasted from TagNRT, maybe consoldate this?
wv.data.results.tagURS = function(spec) {

    var self = {};

    self.name = "TagURS";

    self.process = function(meta, granule) {
        // Exit now if this product doesn't have information about NRT
        if ( !spec ) {
            return granule;
        }
        var isURS;
        if ( spec.by === "value" ) {
            isURS = granule[spec.field] === spec.value;
        } else if ( spec.by === "regex" ) {
            var re = new RegExp(spec.value);
            isURS = re.test(granule[spec.field]);
        } else {
            throw new Error("Unknown TagURS method: " + spec.by);
        }
        granule.urs = isURS;
        if ( isURS ) {
            meta.urs = ( meta.urs ) ? meta.urs += 1 : 1;
        }
        return granule;
    };

    return self;
};


wv.data.results.tagVersion = function() {

    var self = {};

    self.name = "TagVersion";

    self.process = function(meta, granule) {
        var match = granule.dataset_id.match("V(\\d{3})(\\d*)");
        if ( match ) {
            var major = match[1];
            var minor = match[2] || 0;
            granule.version = parseFloat(major + "." + minor);
            return granule;
        }

        match = granule.dataset_id.match("V([\\d\\.]+)");
        if ( match ) {
            granule.version = parseFloat(match[1]);
            return granule;
        }

        return granule;
    };

    return self;
};


wv.data.results.timeFilter = function(spec) {

    var westZone = null;
    var eastZone = null;
    var maxDistance = null;

    var self = {};

    self.name = "TimeFilter";

    var init = function() {
        westZone = new Date(spec.time.getTime())
                .setUTCMinutes(spec.westZone);
        eastZone = new Date(spec.time.getTime())
                .setUTCMinutes(spec.eastZone);
        maxDistance = spec.maxDistance;
        timeOffset = spec.timeOffset || 0;
    };

    self.process = function(meta, granule) {
        var geom = granule.geometry[wv.map.CRS_WGS_84];
        var time = wv.util.parseTimestampUTC(granule.time_start);
        time.setUTCMinutes(time.getUTCMinutes() + timeOffset);
        if ( !wv.map.isPolygonValid(geom, maxDistance) ) {
            var adjustSign = ( time < eastZone ) ? 1 : -1;
            geom =
                wv.map.adjustAntiMeridian(geom, adjustSign);
            granule.geometry[wv.map.CRS_WGS_84] = geom;
            granule.centroid[wv.map.CRS_WGS_84] = geom.getCentroid();
        }

        var x = granule.centroid[wv.map.CRS_WGS_84].x;
        if ( time < eastZone && x < 0 ) {
            return;
        }
        if ( time > westZone && x > 0 ) {
            return;
        }
        return granule;
    };

    init();
    return self;
};


wv.data.results.timeLabel = function(time) {

    var self = {};

    self.name = "TimeLabel";

    self.process = function(meta, granule) {
        var timeStart = wv.util.parseTimestampUTC(granule.time_start);

        // Sometimes an end time is not provided by ECHO
        var timeEnd;
        if ( granule.time_end ) {
            timeEnd = wv.util.parseTimestampUTC(granule.time_end);
        }

        var diff = Math.floor(
            (timeStart.getTime() - time.getTime()) / (1000 * 60 * 60 * 24)
        );

        var suffix = "";
        if ( diff !== 0 ) {
            if ( diff < 0 ) {
                suffix = " (" + diff + " day)";
            } else {
                suffix = " (+" + diff + " day)";
            }
        }
        var displayStart = wv.util.toISOStringTimeHM(timeStart);
        var displayEnd = null;
        if ( timeEnd ) {
            displayEnd = wv.util.toISOStringTimeHM(timeEnd);
        } else {
            displayEnd = "?";
        }
        granule.label = displayStart + " - " + displayEnd + suffix;

        granule.downloadLabel = wv.util.toISOStringDate(timeStart) + ": " +
            displayStart + "-" + displayEnd;

        return granule;
    };

    return self;
};


wv.data.results.transform = function(projection) {

    var self = {};

    self.name = "Transform";

    self.process = function(meta, granule) {
        if ( granule.geometry[projection] ) {
            return granule;
        }
        var geom = granule.geometry[wv.map.CRS_WGS_84];
        var projGeom = geom.clone()
                .transform(wv.map.CRS_WGS_84, projection);
        granule.geometry[projection] = projGeom;
        granule.centroid[projection] = projGeom.getCentroid();
        return granule;
    };

    return self;
};


wv.data.results.versionFilter = function() {

    var self = {};

    self.name = "VersionFilter";

    self.process = function(meta, granule) {
        if ( granule.version ) {
            var timeStart = wv.data.echo.roundTime(granule.time_start);
            if ( meta.versions[timeStart] ) {
                if ( meta.versions[timeStart] !== granule.version ) {
                    return;
                }
            }
        }
        return granule;
    };

    return self;
};


