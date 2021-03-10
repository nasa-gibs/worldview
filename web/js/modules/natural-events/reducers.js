import {
  assign as lodashAssign,
  orderBy as lodashOrderBy,
  uniqBy as lodashUniqBy,
} from 'lodash';
import {
  ALL_CATEGORY,
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SELECT_CATEGORY,
  SHOW_ALL_EVENTS,
  ONLY_SHOW_VISIBLE,
  TOGGLE_SHOW_ALL,
  FINISHED_ANIMATING_TO_EVENT,
} from './constants';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../sidebar/constants';

const sortEvents = function(events) {
  return events
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

export const eventsReducerState = {
  prevSelected: null,
  selected: {
    id: '',
    date: null,
  },
  active: false,
  showAll: true,
  isAnimatingToEvent: false,
  category: ALL_CATEGORY,
};

export function eventsReducer(state = eventsReducerState, action) {
  switch (action.type) {
    case SELECT_EVENT:
      return {
        ...state,
        selected: {
          id: action.id,
          date: action.date,
        },
        isAnimatingToEvent: true,
      };
    case DESELECT_EVENT:
      return {
        ...state,
        prevSelected: state.selected,
        selected: {
          id: '',
          date: null,
        },
      };
    case SELECT_CATEGORY:
      return {
        ...state,
        category: action.category,
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

  switch (action.type) {
    case START:
      return eventRequestResponse({
        isLoading: true,
        response: null,
      });
    case SUCCESS: {
      const key = actionName === REQUEST_EVENTS ? 'events' : 'sources';
      const filtered = action.response[key].filter((item) => formatResponse(item, state.ignore));
      return eventRequestResponse({
        response: actionName === REQUEST_EVENTS
          ? sortEvents(filtered)
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
