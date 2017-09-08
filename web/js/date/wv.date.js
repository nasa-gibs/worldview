/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
var wv = wv || {};

wv.date = (function(self) {

  self.parse = function(state, errors) {
    if (state.time) {
      state.t = state.time;
      delete state.time;
    }
    if (state.t) {
      try {
        state.t = wv.util.parseDateUTC(state.t);
      } catch (error) {
        delete state.t;
        errors.push({
          message: "Invalid date: " + state.t,
          cause: error
        });
      }
    }

    if (state.now) {
      try {
        state.now = wv.util.parseDateUTC(state.now);
        wv.util.now = function() {
          return new Date(state.now.getTime());
        };
        wv.util.warn("Overriding now: " + state.now.toISOString());
      } catch (error) {
        delete state.now;
        errors.push({
          message: "Invalid now: " + state.now,
          cause: error
        });
      }
    }
  };

  return self;

})(wv.date || {});