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
wv.map = wv.map || {};

// FIXME: The code is like this for historical reasons and should be refactored
// at some point.
wv.map.model = wv.map.model || function(models, config) {

    var self = {};

    self.extent = null;
    self.rotation = 0; //initial rotation from url. This is shared amongst both polar rotations
    self.events = wv.util.events();

    self.update = function(extent) {
        self.extent = extent;
        self.events.trigger("update", extent);
    };

    //Set map view from parsed URL
    self.load = function(state, errors) {
        if ( state.v ) {
            var proj = models.proj.selected;
            var extent = state.v;
            var maxExtent = proj.maxExtent;
            if ( ol.extent.intersects(extent, maxExtent) ) {
                self.extent = state.v;
            } else {
                self.extent = _.clone(proj.maxExtent);
                errors.push({message: "Extent outside of range"});
            }
        }

        //get rotation if it exists
        if(state.p === 'arctic' || state.p === 'antarctic')
            if (!isNaN(state.r))  //convert to radians here
                self.rotation = state.r * (Math.PI / 180.0);

    };

    //When models.link.toQueryString() is called, save extent and rotation
    self.save = function(state) {
        state.v = _.clone(self.extent);
        if(self.rotation !== 0.0 && self.rotation !== 0 && models.proj.selected.id !== 'geographic')
            state.r = (self.rotation * (180.0 / Math.PI)).toPrecision(6); //convert from radians to degrees
    };

    self.getLeadingExtent = function() {
        // Set default extent according to time of day:
        //   at 00:00 UTC, start at far eastern edge of map: "20.6015625,-46.546875,179.9296875,53.015625"
        //   at 23:00 UTC, start at far western edge of map: "-179.9296875,-46.546875,-20.6015625,53.015625"
        var curHour = wv.util.now().getUTCHours();

        // For earlier hours when data is still being filled in, force a far eastern perspective
        if (curHour < 3) {
            curHour = 23;
        }
        else if (curHour < 9) {
            curHour = 0;
        }

        // Compute east/west bounds
        var minLon = 20.6015625 + curHour * (-200.53125/23.0);
        var maxLon = minLon + 159.328125;

        var minLat = -46.546875;
        var maxLat = 53.015625;

        return [minLon, minLat, maxLon, maxLat];
    };

    return self;
};
