import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW,
  TOGGLE_CUSTOM_MODAL,
  customModalType,
  INIT_SECOND_DATE,
  ARROW_DOWN,
  ARROW_UP,
  SET_PRELOAD,
  CLEAR_PRELOAD,
} from './constants';
import util from '../../util/util';

export const dateReducerState = {
  arrowDown: '',
  lastArrowDirection: undefined,
  preloaded: false,
  lastPreloadDate: undefined,
  selectedZoom: 3,
  interval: 3,
  delta: 1,
  customSelected: false,
  customDelta: undefined,
  customInterval: undefined,
  timelineCustomModalOpen: false,
  animationCustomModalOpen: false,
  testNow: undefined,
};

export function getInitialState(config) {
  return {
    ...dateReducerState,
    selected: config.initialDate,
    selectedB: util.dateAdd(config.initialDate, 'day', -7),
    appNow: config.pageLoadTime,
  };
}

export function dateReducer(state = dateReducerState, action) {
  switch (action.type) {
    case CHANGE_TIME_SCALE:
      return {
        ...state,
        selectedZoom: action.value,
      };
    case INIT_SECOND_DATE:
      return {
        ...state,
        selectedB: util.dateAdd(state.selected, 'day', -7),
      };
    case CHANGE_CUSTOM_INTERVAL: {
      const { interval, delta } = action;
      return {
        ...state,
        customInterval: interval,
        customDelta: delta,
        customSelected: !(!interval && !delta),
      };
    }
    case CHANGE_INTERVAL:
      return {
        ...state,
        interval: action.interval,
        delta: action.delta,
        customSelected: action.customSelected,
      };
    case SELECT_DATE:
      return {
        ...state,
        [action.activeString]: action.value,
        lastArrowDirection: action.lastArrowDirection,
      };
    case ARROW_DOWN: {
      const { value } = action;
      return {
        ...state,
        arrowDown: value,
        lastArrowDirection: value,
      };
    }
    case ARROW_UP:
      return {
        ...state,
        arrowDown: '',
      };
    case SET_PRELOAD:
      return {
        ...state,
        preloaded: action.preloaded,
        lastPreloadDate: action.lastPreloadDate,
      };
    case CLEAR_PRELOAD: {
      return {
        ...state,
        preloaded: null,
        lastPreloadDate: null,
      };
    }
    case TOGGLE_CUSTOM_MODAL: {
      const timelineToggle = action.toggleBy === customModalType.TIMELINE;
      const animationToggle = action.toggleBy === customModalType.ANIMATION;
      return {
        ...state,
        timelineCustomModalOpen: animationToggle ? false : action.value,
        animationCustomModalOpen: timelineToggle ? false : action.value,
      };
    }
    case UPDATE_APP_NOW:
      return {
        ...state,
        appNow: action.value,
      };
    default:
      return state;
  }
}
