import { SET_SCREEN_INFO } from './constants';

export const initialState = {
  screenHeight: '',
  screenWidth: '',
  isMobileDevice: false,
  orientation: '',
  breakpoints: {},
  isMobilePhone: false,
  isMobileTablet: false,
};

export const getInitialState = () => {
  const breakpoints = {
    extraSmall: 480,
    small: 768,
    medium: 992,
    large: 1200,
  };

  // Seed initial screen info synchronously so connected components can render
  // the correct mobile/desktop layout on first paint.
  if (typeof window === 'undefined') {
    return { breakpoints };
  }

  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  const isMobileDevice = screenWidth < breakpoints.small;
  const orientation = screenHeight > screenWidth ? 'portrait' : 'landscape';

  return {
    breakpoints,
    screenHeight,
    screenWidth,
    isMobileDevice,
    orientation,
    isMobilePhone: false,
    isMobileTablet: false,
  };
};

export const screenSizeReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SCREEN_INFO:
      return {
        ...state,
        screenHeight: action.screenHeight,
        screenWidth: action.screenWidth,
        isMobileDevice: action.isMobileDevice,
        orientation: action.orientation,
        isMobilePhone: action.isMobilePhone,
        isMobileTablet: action.isMobileTablet,
      };
    default:
      return state;
  }
};
