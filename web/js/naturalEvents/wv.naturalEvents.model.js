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

    var init = function() {
        self.events.on( "queryResults", onQueryResults );
        //self.events.on( "select", onSelect );
        self.query();
    };
    // TODO: Reuse permalinks when we have historical events
    var onQueryResults = function(){
        if ( self.data ) {
            querySuccessFlag = true;
            
            //models.link.register(self);
            //models.link.load(self);
        }
    };
    var onSelect = function(){
        self.save();
    };

    self.save = function(state) {
        if ( self.active ){
            state.events = self.selected;
        }
    };

    self.load = function(state) {
        var eventsTab = state.events;
        if ( eventsTab ) {
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

    var queryEvents = function(callback) {
        var url = self.apiURL + "/events";
        $.getJSON(url, function(data) {
            self.data.events = data.events;
            self.events.trigger('queryResults');
        });
    };

    var queryTypes = function(callback) {
        var url = self.apiURL + "/categories";
        $.getJSON(url, function(data) {
            self.data.types = data.categories;
            self.events.trigger('queryResults');
        });
    };

    var querySources = function(callback) {
        var url = self.apiURL + "/sources";
        $.getJSON(url, function(data) {
            self.data.sources = data.sources;
            self.events.trigger('queryResults');
        });
    };

    self.query = function(callback) {
        queryTypes();
        queryEvents();
        querySources();
    };

    // Retrieve event category name, if possible;  otherwise returns null
    var getEventCategoryName = function() {
        var eventCategoryName = null;
        if ((lastIndex != -1) && (self.data !== null) && (self.data[lastIndex] !== null)) {
            var eventCategory = self.data[lastIndex].categories;
            if (eventCategory.length > 0)
            {
                eventCategory = eventCategory[0];
                eventCategoryName = eventCategory["#text"];
            }
        }
        return eventCategoryName;
    };

    init();
    return self;
};
