import {
  assign as lodashAssign,
  orderBy as lodashOrderBy,
  uniqBy as lodashUniqBy,
} from 'lodash';
import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SET_EVENTS_FILTER,
  SHOW_ALL_EVENTS,
  ONLY_SHOW_VISIBLE,
  TOGGLE_SHOW_ALL,
  FINISHED_ANIMATING_TO_EVENT,
} from './constants';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../sidebar/constants';
import util from '../../util/util';

/**
 * Sort events by date, filter by categories
 *
 * @param {*} events
 * @param {*} categories
 * @returns
 */
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

const endDate = util.toISOStringDate(new Date());
const startDate = util.toISOStringDate(new Date(new Date().setDate(new Date().getDate() - 120)));

export function getInitialEventsState(config) {
  const { categories } = config.naturalEvents;
  return {
    ...eventsReducerState,
    allCategories: categories,
    selectedCategories: categories,
  };
}

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
  allCategories: [],
  selectedCategories: [],
  selectedDates: {
    start: startDate,
    end: endDate,
  },
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
    case SET_EVENTS_FILTER:
      return {
        ...state,
        selectedCategories: action.categories,
        selectedDates: {
          start: action.startDate,
          end: action.endDate,
        },
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
        ...state,
        isLoading: true,
        response: null,
      });

    case SUCCESS: {
      const key = actionName === REQUEST_EVENTS
        ? 'events'
        : 'sources';
      return eventRequestResponse({
        response: actionName === REQUEST_EVENTS
          ? sortEvents(action.response[key])
          : action.response[key],
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
