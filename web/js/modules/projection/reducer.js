import { CHANGE_PROJECTION } from './constants';

export const projectionState = {
  id: 'geographic',
  selected: {},
};

export default function projectionReducer(state = projectionState, action) {
  switch (action.type) {
    case CHANGE_PROJECTION:
      return {
        ...state,
        id: action.id,
        selected: action.selected,
      };
    default:
      return state;
  }
}
