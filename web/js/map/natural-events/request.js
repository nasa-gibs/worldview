/* eslint-disable import/extensions */
import lodashOrderBy from 'lodash/orderBy';
import lodashUniqBy from 'lodash/uniqBy';
import util from '../../util/util';

export default function naturalEventsRequest(models, ui, config) {
  const self = {};
  self.events = util.events();

  self.EVENT_QUERY_RESULTS = 'queryResults';
  self.EVENT_SELECT = 'select';

  self.apiURL = config.features.naturalEvents.host;
  self.querySuccessFlag = false;
  const model = models.naturalEvents;
  self.ignored = config.naturalEvents.skip || [];
  model.data = {};

  const init = function() {
    self.events.on('queryResults', onQueryResults);
    self.query();
  };

  const onQueryResults = function() {
    if (model.data.sources && model.data.types && model.data.events) {
      self.querySuccessFlag = true;

      // Remove types and events for ignored event categories
      const removeIgnoredItems = function(item) {
        if (item.categories) {
          const category = Array.isArray(item.categories)
            ? item.categories[0]
            : item.categories;
          // Add slug to categories
          category.slug = category.title
            .toLowerCase()
            .split(' ')
            .join('-');
          return !self.ignored.includes(category.title);
        }
        return !self.ignored.includes(item.title);
      };
      model.data.events = model.data.events.filter(removeIgnoredItems);
      model.data.types = model.data.types.filter(removeIgnoredItems);

      // Sort event geometries by descending date
      model.data.events = model.data.events.map((e) => {
        e.geometry = lodashOrderBy(e.geometry, 'date', 'desc');
        // Discard duplicate geometry dates
        e.geometry = lodashUniqBy(e.geometry, (g) => g.date.split('T')[0]);
        return e;
      });

      // Sort events by descending date
      model.data.events = lodashOrderBy(
        model.data.events,
        (e) => e.geometry[0].date,
        'desc',
      );
      ui.sidebar.renderEvents();
      if (model.active) model.events.trigger('hasData');
    }
  };

  const queryEvents = function() {
    return new Promise((resolve) => {
      let url = `${self.apiURL}/events`;
      if (config.parameters.mockEvents) {
        console.warn(`Using mock events data: ${config.parameters.mockEvents}`);
        url = `mock/events_data.json-${config.parameters.mockEvents}`;
      }
      $.getJSON(url, (data) => {
        resolve(data);
      });
    });
  };

  const queryTypes = function() {
    return new Promise((resolve) => {
      let url = `${self.apiURL}/categories`;
      if (config.parameters.mockCategories) {
        console.warn(
          `Using mock categories data: ${config.parameters.mockEvents}`,
        );
        url = `mock/categories_data.json-${config.parameters.mockCategories}`;
      }
      $.getJSON(url, (data) => {
        resolve(data);
      });
    });
  };

  const querySources = function() {
    return new Promise((resolve) => {
      let url = `${self.apiURL}/sources`;
      if (config.parameters.mockSources) {
        console.warn(
          `Using mock sources data: ${config.parameters.mockEvents}`,
        );
        url = `mock/sources_data.json-${config.parameters.mockSources}`;
      }
      $.getJSON(url, (data) => {
        resolve(data);
      });
    });
  };

  self.query = function() {
    Promise.all([queryTypes(), queryEvents(), querySources()]).then((
      res,
    ) => {
      model.data.types = res[0].categories;
      model.data.events = res[1].events;
      model.data.sources = res[2].sources;
      self.events.trigger('queryResults');
    });
  };

  init();
  return self;
}
