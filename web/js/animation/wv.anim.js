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

wv.anim = (function(self) {

  //Given the raw string, parse state.a into an object
  self.parse = function(state, errors) {
    if (state.a) {
      var str = state.a,
        astate = {
          attributes: []
        };

      //Get text before (
      var on = str.match(/[^\(,]+/)[0];
      if (on !== 'on') { //don't do anything if wrong format
        state.a = undefined;
        return;
      }

      //remove (, get key value pairs
      str = str.match(/\(.*\)/)[0].replace(/[\(\)]/g, "");
      var kvps = str.split(",");
      _.each(kvps, function(kvp) {
        var parts = kvp.split("=");
        astate.attributes.push({
          id: parts[0],
          value: parts[1]
        });
      });
      state.a = astate;
    }
  };
  return self;
})(wv.anim || {});
