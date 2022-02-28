import {
  SELECT_COLLECTION,
} from './constants';

export const smartHadoffState = {
  conceptId: null,
  layerId: null,
};

export function smartHandoffReducer(state = smartHadoffState, action) {
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
