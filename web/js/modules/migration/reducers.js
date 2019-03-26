import {
  CONFIG_HAS_BEEN_LOADED,
  INIT_COMPLETE,
  UPDATE_IN_LEGACY_STATE
} from './constants';
import { assign as lodashAssign, cloneDeep as lodashCloneDeep } from 'lodash';

const legacyState = {
  loaded: false,
  models: {},
  config: {},
  compare: {
    active: false
  },
  date: {
    now: ''
  },
  layers: {
    active: [],
    activeB: []
  },
  map: { selectedMap: null, rotation: 0 },
  initComplete: false
};

export default function legacyReducer(state = legacyState, action) {
  switch (action.type) {
    case CONFIG_HAS_BEEN_LOADED:
      return lodashAssign({}, state, {
        models: action.models,
        config: action.config,
        loaded: true
      });
    case UPDATE_IN_LEGACY_STATE:
      const model = lodashCloneDeep(action.model);
      return lodashAssign({}, state, { [action.key]: model });
    case INIT_COMPLETE:
      return lodashAssign({}, state, { initComplete: true });
    default:
      return state;
  }
}
