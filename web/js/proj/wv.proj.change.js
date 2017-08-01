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

  var PROJECTION_CHANGE_DATE = new Date(Date.UTC(2013, 5, 6));
  var EARLIEST_CHANGE_DATE = new Date(Date.UTC(2012, 11, 31));
  var DO_NOT_SHOW_AGAIN = "arcticProjectionChangeNotification";
  var notified = false;
  var polarVisited = 0;
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

    if (proj.id === "arctic" || proj.id === "antarctic") {
      polarVisited = polarVisited + 1;
      var day = models.date.selected.getTime();
      var change = PROJECTION_CHANGE_DATE.getTime();
      var earliest = EARLIEST_CHANGE_DATE.getTime();
      self.old = day < change && day > earliest;
    }

    if (proj.id === "arctic" && self.old) {
      self.crs = "EPSG:3995";
      self.epsg = 3995;
    } else {
      self.crs = proj.crs;
      self.epsg = proj.epsg;
    }
  };

  var onChange = function() {
    var wasOld = self.old;
    update();
    self.events.trigger("select", self);
    if (polarVisited > 1 && wasOld !== self.old) {
      checkNotify();
    }
  };

  var checkNotify = function() {
    // If the flag cannot be stored in local storage, do not notify
    // the user which will constantly annoy them.
    if (!wv.util.browser.localStorage) {
      return;
    }
    if (wv.util.localStorage(DO_NOT_SHOW_AGAIN) === "true") {
      return;
    }
    if (notified) {
      return;
    }
    notify();
  };

  var notify = function() {
    notified = true;
    var message = [
      "From 2013-01-01 to 2013-06-05, imagery in the polar projections",
      " are different than the other dates as follows:",
      "<br/><br/>",
      "The <b>Arctic projection</b> is in Arctic Polar ",
      "Stereographic (EPSG:3995, \"Greenwich down\") rather than NSIDC ",
      " Polar Stereographic North (EPSG:3413, \"Greenland down\"). ",
      "Coastlines and Graticule for this time range ",
      "can be found in the Add Layer tab by searching for ",
      " \"EPSG:3995\". Note that the image snapshot tool will not work ",
      "for Arctic imagery during this time range.",
      "<br/><br/>" +

      "The <b>Antarctic projection</b> is a sphere with radius of ",
      "6371007.181 meters during these dates rather than being ",
      "projected onto the WGS84 ",
      " ellipsoid. For all other dates, the projection is now the ",
      "correct Antarctic Polar Stereographic (EPSG:3031). This change ",
      "results in a shift of the imagery that ranges up to tens of ",
      "kilometers, depending on the location.",
      "<br/><br/>",

      "Imagery during this time range will be reprocessed during winter ",
      "2017-18 to be made consistent with all other imagery. In the ",
      "meantime, imagery will continue to be back-processed to the ",
      "start of the Terra and Aqua missions in 2000 and 2002, ",
      "respectively.",
      "<br/><br/>",

      "Thanks for your patience as we improve and expand our ",
      "imagery archive.",
      "<br/><br/>",

      "<input id='arcticChangeNoticeDontShowAgain' value='false' ",
      "type='checkbox'>Do not show again"
    ].join("");
    wv.ui.notify(message, "Notice", 400);
    var $check = $("#arcticChangeNoticeDontShowAgain");
    $check.on("click", function() {
      if ($check.is(":checked")) {
        wv.util.localStorage(DO_NOT_SHOW_AGAIN, "true");
      }
    });
  };


  init();
  return self;
};
