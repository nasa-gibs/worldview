/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.debug
 */
var wv = wv || {};
wv.debug = wv.debug || {};

wv.debug.map = function(config) {

    if ( config.parameters.develGIBS ) {
        wv.util.warn("Using map2.vis.earthdata.nasa.gov");

        config.sources["GIBS:arctic"] = {
            url: [
                "//map2a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
                "//map2b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
                "//map2c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"
            ]
        };

        config.sources["GIBS:antarctic"] = {
            url: [
                "//map2a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi",
                "//map2b.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi",
                "//map2c.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi"
            ]
        };

        config.sources["GIBS:geographic"] = {
            url: [
                "//map2a.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi",
                "//map2b.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi",
                "//map2c.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"
            ]
        };
    }
};

