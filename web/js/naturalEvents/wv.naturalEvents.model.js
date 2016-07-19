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
wv.naturalEvents.model = wv.naturalEvents.model || function(config) {

    var self = {};
    self.selected = null;

    self.EVENT_QUERY_RESULTS = "queryResults";

    /**
     * Handler for events fired by this class.
     *
     * @attribute events {Events}
     * @readOnly
     * @type Events
     */
    self.events = wv.util.events();

    self.data = {};

    var init = function() {
        self.query();
    };

    self.select = function(id) {
        
    };

    self.save = function(state) {
        state.event = self.selected.id;
    };

    self.load = function(state) {
        var eventId = state.event;
        if ( eventId ) {
            self.select(eventId);
        }
    };

    self.register = function(crs, def) {
        if ( def && window.proj4 ) {
            proj4.defs(crs, def);
        }
    };

    var queryEvents = function(callback) {
        var url = "https://eonet.sci.gsfc.nasa.gov/api/v1/events";
        $.getJSON(url, function(data) {
            self.data = data.item;
            self.events.trigger('queryResults');
        });
    };

    var queryTypes = function(callback) {
        var url = "https://eonet.sci.gsfc.nasa.gov/api/v1/types";
        $.getJSON(url, function(data) {
            self.types = data.item;
            self.events.trigger('queryResults');
        });
    };

    var querySources = function(callback) {
        var url = "https://eonet.sci.gsfc.nasa.gov/api/v1/sources";
        $.getJSON(url, function(data) {
            self.sources = data.item;
            self.events.trigger('queryResults');
        });
    };

    self.query = function(callback) {
        queryTypes();
        queryEvents();
        querySources();
    };

    init();
    return self;
};
