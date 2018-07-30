import $ from 'jquery';
import lodashOrderBy from 'lodash/orderBy';
import lodashUniqBy from 'lodash/uniqBy';

import util from '../util/util';

export default function naturalEventsRequest(models, ui, config) {
  var self = {};
  self.events = util.events();

  self.EVENT_QUERY_RESULTS = 'queryResults';
  self.EVENT_SELECT = 'select';

  self.apiURL = config.features.naturalEvents.host;
  self.querySuccessFlag = false;
  var model = models.naturalEvents;
  self.ignored = config.naturalEvents.skip || [];
  model.data = {};

  var init = function() {
    self.events.on('queryResults', onQueryResults);
    self.query();
  };

  var onQueryResults = function() {
    if (model.data.sources && model.data.types && model.data.events) {
      self.querySuccessFlag = true;

      // Remove types and events for ignored event categories
      var removeIgnoredItems = function(item) {
        if (item.categories) {
          var category = Array.isArray(item.categories)
            ? item.categories[0]
            : item.categories;
          // Add slug to categories
          category.slug = category.title
            .toLowerCase()
            .split(' ')
            .join('-');
          return !self.ignored.includes(category.title);
        } else {
          return !self.ignored.includes(item.title);
        }
      };
      model.data.events = model.data.events.filter(removeIgnoredItems);
      model.data.types = model.data.types.filter(removeIgnoredItems);

      // Sort event geometries by descending date
      model.data.events = model.data.events.map(function(e) {
        e.geometries = lodashOrderBy(e.geometries, 'date', 'desc');
        // Discard duplicate geometry dates
        e.geometries = lodashUniqBy(e.geometries, function(g) {
          return g.date.split('T')[0];
        });
        return e;
      });

      // Sort events by descending date
      model.data.events = lodashOrderBy(
        model.data.events,
        function(e) {
          return e.geometries[0].date;
        },
        'desc'
      );

      model.events.trigger('hasData');
    }
  };

  var queryEvents = function() {
    return new Promise(function(resolve) {
      var url = self.apiURL + '/events';
      if (config.parameters.mockEvents) {
        console.warn('Using mock events data: ' + config.parameters.mockEvents);
        url = 'mock/events_data.json-' + config.parameters.mockEvents;
      }
      $.getJSON(url, function(data) {
        resolve(data);
      });
    });
  };

  var queryTypes = function() {
    return new Promise(function(resolve) {
      var url = self.apiURL + '/categories';
      if (config.parameters.mockCategories) {
        console.warn(
          'Using mock categories data: ' + config.parameters.mockEvents
        );
        url = 'mock/categories_data.json-' + config.parameters.mockCategories;
      }
      $.getJSON(url, function(data) {
        resolve(data);
      });
    });
  };

  var querySources = function() {
    return new Promise(function(resolve) {
      var url = self.apiURL + '/sources';
      if (config.parameters.mockSources) {
        console.warn(
          'Using mock sources data: ' + config.parameters.mockEvents
        );
        url = 'mock/sources_data.json-' + config.parameters.mockSources;
      }
      $.getJSON(url, function(data) {
        resolve(data);
      });
    });
  };

  self.query = function() {
    Promise.all([queryTypes(), queryEvents(), querySources()]).then(function(
      res
    ) {
      model.data.types = res[0].categories;
      model.data.events = res[1].events;
      model.data.sources = res[2].sources;
      self.events.trigger('queryResults');
    });
  };

  init();
  return self;
}
