import {
  SELECT_COLLECTION,
} from './constants';

export const initialState = {
  conceptId: null,
  layerId: null,
};

export function getInitialState(config) {
  const { features: { cmr } } = config;
  return {
    ...initialState,
    cmrBaseUrl: cmr.url,
  };
}

export function smartHandoffReducer(state = initialState, action) {
  switch (action.type) {
    case SELECT_COLLECTION:
      return {
        ...state,
        conceptId: action.conceptId,
        layerId: action.layerId,
      };
    default:
      return state;
  }
}
