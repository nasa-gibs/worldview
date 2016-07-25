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

buster.testCase("wv.map.runningdata", {

    errors: null,

    setUp: function() {
      this.runner = new wv.map.runningdata();
    },
    "1.0: Get Label from Palette object": function() {
        var scale = { 
          colors: ["fbd1fbff", "a605b0ff", "1e00eaff"],
          labels: ["40 – 40.4 ppb", "40.4 – 50 ppb", "50 – 60 ppb"]
        };
        var value = this.runner.getDataLabel(scale, "1e00eaff");
        buster.assert.equals(value.label, "50 – 60 ppb");
    }

});
