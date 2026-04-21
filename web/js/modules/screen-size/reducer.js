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

export const getInitialState = () => ({
  breakpoints: {
    extraSmall: 480,
    small: 768,
    medium: 992,
    large: 1200,
  },
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
        isMobilePhone: action.isMobilePhone,
        isMobileTablet: action.isMobileTablet,
      };
    default:
      return state;
  }
};
