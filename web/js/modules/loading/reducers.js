import { LOADING_START, LOADING_STOP, LOADING_LOADING_LIST_ADD, LOADING_LOADED_LIST_ADD } from './constants';
import {
  assign as lodashAssign,
} from 'lodash';

export const initialState = {
  loadingList: {},
  loadedList: {},
  isLoading: false,
  startTime: 0,
};

export function loadingReducer (state = initialState, action) {
  const { type, key, item } = action;

  const isLoading = (loadingMap) => {
    const keys = Object.keys(loadingMap);
    return keys.some((k) => loadingMap[k]);
  };

  switch (type) {
    case LOADING_START: {
      const newLoadingMap = {
        ...state.loadingMap,
        [key]: true,
      };
      return {
        ...state,
        isLoading: true,
        loadingMap: newLoadingMap,
        startTime: Date.now(),
      };
    }

    case LOADING_STOP: {
      const newLoadingMap = {
        ...state.loadingMap,
        [key]: false,
      };
      return {
        ...state,
        loadingList: {},
        loadedList: {},
        isLoading: isLoading(newLoadingMap),
        loadingMap: newLoadingMap,
      };
    }

    case LOADING_LOADING_LIST_ADD: {
      return {
        ...state,
        loadingList: lodashAssign({}, state.loadingList, {
          [item]: (state.loadingList[item] || 0) + 1,
        }),
      };
    }

    case LOADING_LOADED_LIST_ADD: {
      return {
        ...state,
        loadedList: lodashAssign({}, state.loadedList, {
          [item]: (state.loadedList[item] || 0) + 1,
        }),
      };
    }

    default:
      return state;
  }
}
