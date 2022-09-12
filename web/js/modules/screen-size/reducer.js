import { isMobileOnly, isTablet } from 'react-device-detect';
import { SET_SCREEN_INFO } from './constants';

export const initialState = {
  screenHeight: '',
  screenWidth: '',
  isMobileDevice: false,
  orientation: '',
  breakpoints: {},
};

export const getInitialState = () => ({
  screenHeight: window.innerHeight,
  screenWidth: window.innerWidth,
  isMobileDevice: isMobileOnly || isTablet || window.innerWidth < 768,
  orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
  breakpoints: {
    extraSmall: 480,
    small: 768,
    medium: 992,
    large: 1200,
  }

});

export const screenSizeReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SCREEN_INFO:
      return {
        ...state,
        screenHeight: action.screenHeight,
        screenWidth: action.screenWidth,
        isMobileDevice: action.isMobileDevice,
        orientation: action.orientation,
      };
    default:
      return state;
  }
};
