/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.naturalEvents
 */
var wv = wv || {};
wv.naturalEvents = wv.naturalEvents || {};

/**
 * @class wv.naturalEvents.model
 */
wv.naturalEvents.model = wv.naturalEvents.model || function(models, config) {

    var self = {};
    self.selected = null;
    self.active = false;
    var state = {
        layersString: null,
        projection: null,
        epsg: null,
        time: null
    };

    self.EVENT_QUERY_RESULTS = "queryResults";
    self.EVENT_SELECT = "select";

    self.apiURL = config.features.naturalEvents.host;
    var querySuccessFlag = false;
    /**
     * Handler for events fired by this class.
     *
     * @attribute events {Events}
     * @readOnly
     * @type Events
     */
    self.events = wv.util.events();

    self.layers = config.naturalEvents.layers;
    self.ignored = config.naturalEvents.skip || [];
    self.data = {};



    self.save = function(state) {
        if ( self.active ){
            state.e = 't';
        }
    };

    self.load = function(state) {
        if (state.e == 't') {
            models.wv.events.on("startup", function() {
                wvx.ui.sidebar.selectTab("events");
            });
        }
    };
    /*
    self.register = function(crs, def) {
        if ( def && window.proj4 ) {
            proj4.defs(crs, def);
        }
    };
    */


    return self;
};
