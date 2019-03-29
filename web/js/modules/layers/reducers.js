import {
  RESET_LAYERS,
  TOGGLE_ACTIVE_STATE,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYER_GROUP,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  REMOVE_LAYER
} from './constants';
import { resetLayers, addLayer } from './selectors';
import { toggleVisibility, removeLayer } from './util';
import { cloneDeep as lodashCloneDeep, assign as lodashAssign } from 'lodash';

export const initialState = {
  active: [],
  activeB: [],
  layersConfig: {},
  activeString: 'active',
  hoveredLayer: '',
  layerConfig: {},
  startingLayers: []
};
export function getInitialState(config) {
  return lodashAssign({}, initialState, {
    active: resetLayers(config.defaults.startingLayers, config.layers),
    layerConfig: config.layers,
    startingLayers: config.defaults.startingLayers
  });
}

export function layerReducer(state = initialState, action) {
  const layerGroupStr = state.activeString;
  switch (action.type) {
    case RESET_LAYERS:
      if (
        (action.stateStr && action.stateStr === 'activeB') ||
        state.activeString === 'activeB'
      ) {
        return lodashAssign({}, state, {
          layersB: resetLayers()
        });
      } else {
        return lodashAssign({}, state, {
          layersA: resetLayers()
        });
      }

    case ADD_LAYER:
      return lodashAssign({}, state, {
        [layerGroupStr]: addLayer(
          action.id,
          {},
          state[layerGroupStr],
          state.layerConfig
        )
      });
    case INIT_SECOND_LAYER_GROUP:
      if (state.layersB.length > 0) return state;
      return lodashAssign({}, state, {
        layersB: lodashCloneDeep(state.layersA)
      });
    case REORDER_LAYER_GROUP:
      return lodashAssign({}, state, {
        [layerGroupStr]: action.layerArray
      });
    case TOGGLE_ACTIVE_STATE:
      return lodashAssign({}, state, {
        activeString: state.activeString === 'active' ? 'activeB' : 'active'
      });
    case ON_LAYER_HOVER:
      return lodashAssign({}, state, {
        hoveredLayer: action.active ? action.id : ''
      });
    case TOGGLE_LAYER_VISIBILITY:
      return lodashAssign({}, state, {
        [layerGroupStr]: toggleVisibility(action.id, state[layerGroupStr])
      });
    case REMOVE_LAYER:
      return lodashAssign({}, state, {
        [layerGroupStr]: removeLayer(action.id, state[layerGroupStr]) // returns new object
      });
    default:
      return state;
  }
}
