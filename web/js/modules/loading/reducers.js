import { LOADING_START, LOADING_STOP } from './constants';

export const initialState = {
  title: '',
  msg: '',
  isLoading: false,
};

export function loadingReducer (state = initialState, action) {
  const { title, msg } = action;

  switch (action.type) {
    case LOADING_START:
      return {
        ...state,
        isLoading: true,
        title,
        msg,
      };
    case LOADING_STOP:
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}
