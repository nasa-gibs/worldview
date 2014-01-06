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
 * @module wv.proj
 */
var wv = wv || {};
wv.proj = wv.proj || {};

/**
 * @class wv.proj.change
 */
wv.proj.change = wv.proj.change || function(models) {

    var PROJECTION_CHANGE_DATE = new Date(Date.UTC(2013, 05, 06));
    var self = {};

    self.events = wv.util.events();
    self.old = false;
    self.crs = null;
    self.epsg = null;

    var init = function() {
        models.proj.register("EPSG:3995",
            "+title=WGS 84 / Arctic Polar Stereographic +proj=stere " +
            "lat_0=90 +lat_ts=71 +lon_0=0 +k=1 +x_0=0 +y_0=0 " +
            "+datum=WGS84 +units=m +no_def");
        models.proj.events.on("select", update);
        models.date.events.on("select", update);
        update();
    };

    var update = function() {
        var proj = models.proj.selected;
        self.old = false;
        self.crs = proj.crs;
        self.epsg = proj.epsg;
        if ( proj.id === "arctic" || proj.id === "antarctic" ) {
            var day = models.date.selected.getTime();
            var change = PROJECTION_CHANGE_DATE.getTime();
            if ( day < change ) {
                self.old = true;
                if ( proj.id === "arctic" ) {
                    self.crs = "EPSG:3995";
                    self.epsg = 3995;
                }
            }
        }
        self.events.trigger("selected", self);
    };

    init();
    return self;
};

