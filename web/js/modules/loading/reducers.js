import { LOADING_START, LOADING_STOP } from './constants';


export const initialState = {
  msg: '',
  isLoading: false,
};

export function loadingReducer (state = initialState, action) {
  const { type, key, msg } = action;

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
        msg,
        loadingMap: newLoadingMap,
      };
    }

    case LOADING_STOP: {
      const newLoadingMap = {
        ...state.loadingMap,
        [key]: false,
      };
      return {
        ...state,
        isLoading: isLoading(newLoadingMap),
        loadingMap: newLoadingMap,
      };
    }

    default:
      return state;
  }
}
