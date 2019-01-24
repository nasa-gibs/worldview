import { MODELS_HAVE_BEEN_LOADED } from './constants';
import { assign as lodashAssign } from 'lodash';

const modelsState = {
  loaded: false,
  models: {}
};

export default function modelsReducer(state = modelsState, action) {
  console.log(action);
  switch (action.type) {
    case MODELS_HAVE_BEEN_LOADED:
      console.log(action);
      return lodashAssign({}, state, {
        models: action.models,
        loaded: true
      });
    default:
      return state;
  }
}
