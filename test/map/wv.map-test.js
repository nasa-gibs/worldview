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

buster.testCase("wv.map", {

  errors: null,

  setUp: function() {
    this.errors = [];
  },

  "1.1: Parses state": function() {
    var state = {
      map: "0,1,2,3"
    };
    wv.map.parse(state, this.errors);
    buster.assert.equals(state.v, [0, 1, 2, 3]);
    buster.assert.equals(this.errors.length, 0);
  },

  "1.2: Parses state": function() {
    var state = {
      v: "0,1,2,3"
    };
    wv.map.parse(state, this.errors);
    buster.assert.equals(state.v, [0, 1, 2, 3]);
    buster.assert.equals(this.errors.length, 0);
  },

  "Error on invalid extent": function() {
    var state = {
      map: "0,1,x,3"
    };
    wv.map.parse(state, this.errors);
    buster.refute(state.map);
    buster.assert.equals(this.errors.length, 1);
  }

});
