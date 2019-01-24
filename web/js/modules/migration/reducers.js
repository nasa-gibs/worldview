import { CONFIG_HAS_BEEN_LOADED } from './constants';
import { assign as lodashAssign } from 'lodash';

const modelsState = {
  loaded: false,
  models: {},
  config: {}
};

export default function modelsReducer(state = modelsState, action) {
  console.log(action);
  switch (action.type) {
    case CONFIG_HAS_BEEN_LOADED:
      return lodashAssign({}, state, {
        models: action.models,
        config: action.config,
        loaded: true
      });
    default:
      return state;
  }
}
