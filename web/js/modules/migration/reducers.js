import { CONFIG_HAS_BEEN_LOADED } from './constants';
import { assign as lodashAssign } from 'lodash';

const legacyState = {
  loaded: false,
  models: {},
  config: {}
};

export default function legacyReducer(state = legacyState, action) {
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
