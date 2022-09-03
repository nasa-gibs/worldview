import { isMobileOnly, isTablet } from 'react-device-detect';
import { SET_SCREEN_INFO } from "./constants";

export const initialState = {
  screenHeight: '',
  screenWidth: '',
  isMobileDevice: false,
  orientation: ''
};

export const getInitialState = () => {
  return {
   screenHeight : window.innerHeight,
   screenWidth : window.innerWidth,
   isMobileDevice : isMobileOnly || isTablet || window.innerWidth < 768,
   orientation : window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    }
  }

export const screenSizeReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SCREEN_INFO:
      return {
        ...state,
        screenHeight: action.screenHeight,
        screenWidth: action.screenWidth,
        isMobileDevice: action.isMobileDevice,
        orientation: action.orientation,
      }
    default:
    return state;
  }
};