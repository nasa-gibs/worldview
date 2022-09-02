import { SET_SCREEN_INFO } from "./constants";

export const initialState = {
  screenHeight: '',
  screenWidth: '',
  isMobileDevice: false,
};

export const screenSizeReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SCREEN_INFO:
      return {
        ...state,
        screenHeight: action.value,
      }
    default:
    return state;
  }
};