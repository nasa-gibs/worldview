import {
  assign as lodashAssign,
  orderBy as lodashOrderBy,
  uniqBy as lodashUniqBy,
  get as lodashGet,
} from 'lodash';
import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  REQUEST_CATEGORIES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SET_EVENTS_FILTER,
  SHOW_ALL_EVENTS,
  ONLY_SHOW_VISIBLE,
  TOGGLE_SHOW_ALL,
  FINISHED_ANIMATING_TO_EVENT,
  REQUEST_CATEGORIES_SUCCESS,
} from './constants';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../sidebar/constants';

/**
 * Sort events by date, filter by categories
 *
 * @param {*} events
 * @param {*} categories
 * @returns
 */
const sortEvents = function(events, categories) {
  return events
    .filter((e) => e.categories.some(({ title }) => categories.includes(title)))
    .map((e) => {
      e.geometry = lodashOrderBy(e.geometry, 'date', 'desc');
      // Discard duplicate geometry dates
      e.geometry = lodashUniqBy(e.geometry, (g) => g.date.split('T')[0]);
      return e;
    })
    .sort((eventA, eventB) => {
      const dateA = new Date(eventA.geometry[0].date).valueOf();
      const dateB = new Date(eventB.geometry[0].date).valueOf();
      return dateB - dateA;
    });
};

const formatResponse = function(item, ignored) {
  if (item.categories) {
    const category = Array.isArray(item.categories)
      ? item.categories[0]
      : item.categories;
    // Add slug to categories
    category.slug = category.title
      .toLowerCase()
      .split(' ')
      .join('-');
    return !ignored.includes(category.title);
  }
  return !ignored.includes(item.title);
};

const endDate = new Date();

export const eventsReducerState = {
  selected: {
    id: '',
    date: null,
    eventObject: null,
    geometryForDate: null,
  },
  active: false,
  showAll: true,
  isAnimatingToEvent: false,
  selectedCategories: [],
  selectedStartDate: new Date().setDate(endDate.getDate() - 60),
  selectedEndDate: new Date(),
};

export function eventsReducer(state = eventsReducerState, action) {
  switch (action.type) {
    case SELECT_EVENT: {
      const {
        id, date,
      } = action;
      return {
        ...state,
        selected: {
          id,
          date,
        },
        isAnimatingToEvent: true,
      };
    }
    case DESELECT_EVENT:
      return {
        ...state,
        selected: eventsReducerState.selected,
      };
    case REQUEST_CATEGORIES_SUCCESS: {
      const skipCategories = lodashGet(action.state, 'config.naturalEvents.skip') || [];
      const { categories } = action.response;
      return {
        ...state,
        selectedCategories: categories
          .filter(({ title }) => !skipCategories.includes(title))
          .map(({ title }) => title),
      };
    }

    case SET_EVENTS_FILTER:
      return {
        ...state,
        selectedCategories: action.categories,
        selectedStartDate: action.startDate,
        selectedEndDate: action.endDate,
      };
    case SHOW_ALL_EVENTS:
      return {
        ...state,
        showAll: true,
      };
    case TOGGLE_SHOW_ALL:
      return {
        ...state,
        showAll: !state.showAll,
      };
    case ONLY_SHOW_VISIBLE:
      return {
        ...state,
        showAll: false,
      };
    case CHANGE_SIDEBAR_TAB: {
      const isActive = action.activeTab === 'events';
      if (isActive === state.active) return state;
      return {
        ...state,
        active: isActive,
      };
    }
    case FINISHED_ANIMATING_TO_EVENT:
      return {
        ...state,
        isAnimatingToEvent: false,
      };
    default:
      return state;
  }
}

export const defaultRequestState = {
  isLoading: false,
  error: null,
  response: null,
  type: null,
  ignore: [],
};

export function eventRequestResponse(props = {}) {
  return lodashAssign({}, defaultRequestState, props);
}

export function eventsRequestReducer(actionName, state, action) {
  const START = `${actionName}_START`;
  const SUCCESS = `${actionName}_SUCCESS`;
  const FAILURE = `${actionName}_FAILURE`;
  const selectedCategories = lodashGet(action, 'state.events.selectedCategories') || [];

  switch (action.type) {
    case START:
      return eventRequestResponse({
        ...state,
        isLoading: true,
        response: null,
      });

    case SUCCESS: {
      const key = actionName === REQUEST_EVENTS
        ? 'events'
        : actionName === REQUEST_CATEGORIES
          ? 'categories'
          : 'sources';
      const filtered = action.response[key].filter((item) => formatResponse(item, state.ignore));
      return eventRequestResponse({
        response: actionName === REQUEST_EVENTS
          ? sortEvents(filtered, selectedCategories)
          : filtered,
        isLoading: false,
      });
    }

    case FAILURE:
      return eventRequestResponse({
        response: null,
        error: action.error,
        isLoading: false,
      });
    default:
      return eventRequestResponse(state);
  }
}

export function requestedEvents(state = {}, action) {
  return eventsRequestReducer(REQUEST_EVENTS, state, action);
}

export function requestedEventSources(state = {}, action) {
  return eventsRequestReducer(REQUEST_SOURCES, state, action);
}

export function requestedEventCategories(state = {}, action) {
  return eventsRequestReducer(REQUEST_CATEGORIES, state, action);
}
