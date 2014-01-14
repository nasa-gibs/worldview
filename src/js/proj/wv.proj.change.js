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
    var DO_NOT_SHOW_AGAIN = "arcticProjectionChangeNotification";
    var notified = false;
    var polarVisited = false;
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
        models.proj.events.on("select", onChange);
        models.date.events.on("select", onChange);
        update();
    };

    var update = function() {
        var proj = models.proj.selected;
        self.old = false;

        if ( proj.id === "arctic" || proj.id === "antarctic" ) {
            polarVisited = true;
            var day = models.date.selected.getTime();
            var change = PROJECTION_CHANGE_DATE.getTime();
            self.old = day < change;
        }

        if ( proj.id === "arctic" && self.old ) {
            self.crs = "EPSG:3995";
            self.epsg = 3995;
        } else {
            self.crs = proj.crs;
            self.epsg = proj.epsg;
        }
    };

    var onChange = function() {
        var wasOld = self.old;
        var wasVisited = self.polarVisited;
        update();
        self.events.trigger("select", self);
        if ( !wasVisited && wasOld !== self.old ) {
            checkNotify();
            Worldview.Map.COORDINATE_CONTROLS.arctic.projection = self.crs;
        }

        if ( wasOld !== self.old && self.old ) {
            models.layers.replace("overlays",
                "arctic_coastlines_3413", "arctic_coastlines");
            models.layers.replace("overlays",
                "arctic_graticule_3413", "arctic_graticule");
        } else if ( wasOld !== self.old && !self.old ) {
            models.layers.replace("overlays",
                "arctic_coastlines", "arctic_coastlines_3413");
            models.layers.replace("overlays",
                "arctic_graticule", "arctic_graticule_3413");
        }
    };

    var checkNotify = function() {
        // If the flag cannot be stored in local storage, do not notify
        // the user which will constantly annoy them.
        if ( !wv.util.browser.localStorage ) {
            return;
        }
        if ( wv.util.localStorage(DO_NOT_SHOW_AGAIN) === "true" ) {
            return;
        }
        if ( notified ) {
            return;
        }
        notify();
    };

    var notify = function() {
        notified = true;
        var message = [
            "On " + wv.util.toISOStringDate(PROJECTION_CHANGE_DATE) +
            " the polar projections changed as follows:" ,
            "<br/><br/>",
            "The <b>Arctic projection</b> changed from Arctic Polar ",
            "Stereographic (EPSG:3995, \"Greenwich down\") to NSIDC Polar ",
            "Stereographic North (EPSG:3413, \"Greenland down\").",
            "<br/><br/>" +
            "The <b>Antarctic projection</b> changed from being projected onto ",
            "a sphere with radius of 6371007.181 meters to being projected ",
            "onto the WGS84 ellipsoid. The projection is now the correct ",
            "Antarctic Polar Stereographic (EPSG:3031). This change results ",
            "in a shift of the imagery that ranges up to tens of kilometers, ",
            "depending on the location.",
            "<br/><br/>",

            "Imagery before this date has not yet been reprocessed to the ",
            "new projection. In addition, the \"Population Density\" and ",
            "\"Global Label\" layers can no longer be displayed properly ",
            "in the older projection.",
            "<br/><br/>",

            "Thanks for your patience as we improve and expand our ",
            "imagery archive.",
            "<br/><br/>",

            "<input id='arcticChangeNoticeDontShowAgain' value='false' ",
                "type='checkbox'>Do not show again"
        ].join("");
        wv.ui.notify(message);
        var $check = $("#arcticChangeNoticeDontShowAgain");
        $check.on("click", function() {
            if ( $check.is(":checked") ) {
                wv.util.localStorage(DO_NOT_SHOW_AGAIN, "true");
            }
        });
    };


    init();
    return self;
};

