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
          tooltips: ["40 – 40.4", "40.4 – 50", "50 – 60"],
          units: 'ppb'
        };
        var value = this.runner.getDataLabel(scale, "1e00eaff");
        buster.assert.equals(value.label, "50 – 60 ppb");
    },
    "1.2: Removes layers that are no longer present": function() {
        var arra1 = ['layer1', 'layer2', 'layer3'];
        var arra2 = ['layer1', 'layer2'];

        var value = this.runner.LayersToRemove(arra1, arra2);
        buster.assert.equals(value, ['layer3']);
    }

});
