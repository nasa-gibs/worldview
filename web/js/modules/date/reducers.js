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
} from './constants';
import util from '../../util/util';

export const dateReducerState = {
  arrowDown: false,
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
    case CHANGE_CUSTOM_INTERVAL:
      return {
        ...state,
        customInterval: action.value,
        customDelta: action.delta,
        customSelected: true,
      };
    case CHANGE_INTERVAL:
      return {
        ...state,
        interval: action.value,
        delta: action.delta,
        customSelected: action.customSelected,
      };
    case SELECT_DATE:
      return {
        ...state,
        [action.activeString]: action.value,
      };
    case ARROW_DOWN:
      return {
        ...state,
        arrowDown: action.value,
        preloaded: false,
      };
    case ARROW_UP:
      return {
        ...state,
        arrowDown: false,
        lastPreloadDate: undefined,
      };
    case SET_PRELOAD:
      return {
        ...state,
        preloaded: action.preloaded,
        lastPreloadDate: action.lastPreloadDate,
      };
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
