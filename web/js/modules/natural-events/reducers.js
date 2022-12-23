import {
  assign as lodashAssign,
  orderBy as lodashOrderBy,
  uniqBy as lodashUniqBy,
} from 'lodash';
import moment from 'moment';
import {
  REQUEST_EVENTS,
  REQUEST_SOURCES,
  SELECT_EVENT,
  DESELECT_EVENT,
  SET_EVENTS_FILTER,
  FINISHED_ANIMATING_TO_EVENT,
} from './constants';
import { CHANGE_TAB as CHANGE_SIDEBAR_TAB } from '../sidebar/constants';

/**
 * Sort events by date
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

const eventsReducerState = {
  selected: {
    id: '',
    date: null,
    eventObject: null,
    geometryForDate: null,
  },
  active: false,
  showAll: true,
  showAllTracks: false,
  isAnimatingToEvent: false,
  selectedCategories: [],
  selectedDates: {
    start: null,
    end: null,
  },
};

export function getInitialEventsState(config) {
  const { initialDate, naturalEvents } = config;
  const { categories } = naturalEvents;
  const endDate = moment.utc(initialDate).format('YYYY-MM-DD');
  const startDate = moment.utc(initialDate).subtract(120, 'days').format('YYYY-MM-DD');
  return {
    ...eventsReducerState,
    selectedCategories: categories,
    selectedDates: {
      start: startDate,
      end: endDate,
    },
  };
}

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
        showAll: action.showAll,
        showAllTracks: action.showAllTracks,
        selectedCategories: action.categories,
        selectedDates: {
          start: action.start,
          end: action.end,
        },
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
