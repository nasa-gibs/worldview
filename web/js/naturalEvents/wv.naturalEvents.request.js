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
wv.naturalEvents = wv.naturalEvents || {};
/**
 * @module wv.naturalEvents.request
 */
wv.naturalEvents.request = wv.naturalEvents.request || function(models, ui, config) {
    self = {};
    self.events = wv.util.events();

    self.EVENT_QUERY_RESULTS = "queryResults";
    self.EVENT_SELECT = "select";

    // Set URL to http://localhost:3000/mock for testing data.
    self.apiURL = config.features.naturalEvents.host;
    var querySuccessFlag = false;
    var model = models.naturalEvents;
    self.ignored = config.naturalEvents.skip || [];
    model.data = {};

    var init = function() {
        self.events.on( "queryResults", onQueryResults );
        self.query();
    };

    var onQueryResults = function(){
        if ( model.data.sources && model.data.types && model.data.events) {
            querySuccessFlag = true;

            // prune the events of types we don't want
            var pruned = [];
            _.each( model.data.events, function( event ) {
                // this is assuming there is ever only one category per event.
                // may need to be updated if any events have multiple categories
                if ( !self.ignored.includes( event.categories[0].title ) ) {
                    // make a usuable css class from category name
                    event.categories[0].css = event.categories[0].title
                        .toLowerCase()
                        .split(' ').join('-');
                    pruned.push( event );
                }
            });
            model.data.events = pruned;
            // TODO: Reuse permalinks when we have historical events
            //models.link.register(self);
            //models.link.load(self);
        }
    };

    // Point url to test_file.json to pull in mock data.
    var queryEvents = function(callback) {
        var url = self.apiURL + "/events";
        $.getJSON(url, function(data) {
            model.data.events = data.events;
            self.events.trigger('queryResults');
        });
    };

    var queryTypes = function(callback) {
        var url = self.apiURL + "/categories";
        $.getJSON(url, function(data) {
            model.data.types = data.categories;
            self.events.trigger('queryResults');
        });
    };

    var querySources = function(callback) {
        var url = self.apiURL + "/sources";
        $.getJSON(url, function(data) {
            model.data.sources = data.sources;
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
