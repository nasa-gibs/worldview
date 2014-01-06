/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

Worldview.namespace("Widget");

Worldview.Widget.CRS = function(config) {

    var self = {};
    self.containerId = "crs";

    var projection = "4326";
    var changeDate = null;

    var init = function() {
        changeDate = Worldview.ARCTIC_PROJECTION_CHANGE_DATE;
        REGISTRY.register(self.containerId, self);
        REGISTRY.markComponentReady(self.containerId);
    };

    self.getValue = function() {
        return "epsg=" + projection;
    };

    self.setValue = function() {};

    self.updateComponent = function(queryString) {
        try {
            if ( !changeDate ) {
                return;
            }
            query = Worldview.queryStringToObject(queryString);
            var time;
            if ( query.time ) {
                try {
                    time = Date.parseISOString(query.time).clearUTCTime();
                } catch ( error ) {
                    console.warn("Invalid time: " + query.time);
                    time = Worldview.today();
                }
            } else {
                time = Worldview.today();
            }
            if ( query["switch"] === "geographic" ) {
                projection = "4326";
                REGISTRY.fire(self);
            } else if ( query["switch"] === "arctic" ) {
                if ( time < changeDate ) {
                    projection = "3995";
                } else {
                    projection = "3413";
                }
                REGISTRY.fire(self);
            } else if ( query["switch"] === "antarctic" ) {
                projection = "3031";
                REGISTRY.fire(self);
            }
        } catch ( error ) {
            Worldview.error("Internal error", error);
        }
    };

    self.loadFromQuery = self.updateComponent;

    self.parse = function(queryString, object) {
        var epsg = Worldview.extractFromQuery("epsg", queryString);
        object.epsg = epsg;
        object.crs = "EPSG:" + epsg;
        return object;
    };

    init();
    return self;
};
