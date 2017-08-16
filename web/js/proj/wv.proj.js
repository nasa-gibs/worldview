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

var wv = wv || {};

wv.proj = (function(self) {

  self.parse = function(state, errors, config) {
    // Permalink version 1.0 - 1.1
    if (state["switch"]) {
      state.p = state["switch"];
      delete state["switch"];
    }
    var projId = state.p;
    if (projId) {
      if (!config.projections[projId]) {
        delete state.p;
        errors.push({
          message: "Unsupported projection: " + projId
        });
      }
    }
  };

  return self;

})(wv.proj || {});
