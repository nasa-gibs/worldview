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

      // Remove types and events for ignored event categories
      var removeIgnoredItems = function(item){
        if (item.categories) {
          var category = Array.isArray(item.categories)
            ? item.categories[0]
            : item.categories;
          // Add slug to categories
          category.slug = category.title.toLowerCase().split(' ').join('-');
          return !self.ignored.includes(category.title);
        } else {
          return !self.ignored.includes(item.title);
        }
      };
      model.data.events = model.data.events.filter(removeIgnoredItems);
      model.data.types = model.data.types.filter(removeIgnoredItems);
      model.events.trigger('hasData');
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
