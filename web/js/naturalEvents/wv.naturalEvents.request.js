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

  self.apiURL = config.features.naturalEvents.host;
  var querySuccessFlag = false;
  var model = models.naturalEvents;
  self.ignored = config.naturalEvents.skip || [];
  model.data = {};

  var init = function() {
    self.events.on("queryResults", onQueryResults);
    self.query();
  };

  var onQueryResults = function() {
    if (model.data.sources && model.data.types && model.data.events) {
      querySuccessFlag = true;

      // prune the events of types we don't want
      var pruned = [];
      _.each(model.data.events, function(event) {
        // this is assuming there is ever only one category per event.
        // may need to be updated if any events have multiple categories
        if (!self.ignored.includes(event.categories[0].title)) {
          // make a slug from category name
          event.categories[0].slug = event.categories[0].title
            .toLowerCase()
            .split(' ')
            .join('-');
          pruned.push(event);
        }
      });
      model.data.events = pruned;
      // TODO: Reuse permalinks when we have historical events
      //models.link.register(self);
      //models.link.load(self);
    }
  };

  var queryEvents = function() {
    var url = self.apiURL + "/events";
    if (config.parameters.mockEvents) {
      console.warn("Using mock events data: " + config.parameters.mockEvents);
      url = "mock/events_data.json-" + config.parameters.mockEvents;
    }
    $.getJSON(url, function(data) {
      model.data.events = data.events;
      self.events.trigger('queryResults');
    });
  };

  var queryTypes = function() {
    var url = self.apiURL + "/categories";
    if (config.parameters.mockCategories) {
      console.warn("Using mock categories data: " + config.parameters.mockEvents);
      url = "mock/categories_data.json-" + config.parameters.mockCategories;
    }
    $.getJSON(url, function(data) {
      model.data.types = data.categories;
      self.events.trigger('queryResults');
    });
  };

  var querySources = function() {
    var url = self.apiURL + "/sources";
    if (config.parameters.mockSources) {
      console.warn("Using mock sources data: " + config.parameters.mockEvents);
      url = "mock/sources_data.json-" + config.parameters.mockSources;
    }
    $.getJSON(url, function(data) {
      model.data.sources = data.sources;
      self.events.trigger('queryResults');
    });
  };

  self.query = function() {
    queryTypes();
    queryEvents();
    querySources();
  };

  init();
  return self;
};
