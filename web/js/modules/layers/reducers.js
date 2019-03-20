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
  layersA: [],
  layersB: [],
  layersConfig: {},
  activeString: 'A',
  hoveredLayer: ''
};
export function getInitialState(config) {
  return lodashAssign({}, initialState, {
    layersA: resetLayers(config)
  });
}

export function layerReducer(state = initialState, action) {
  const layerGroupStr = 'layers' + state.activeString;
  switch (action.type) {
    case RESET_LAYERS:
      if (
        (action.stateStr && action.stateStr === 'B') ||
        state.activeString === 'B'
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
        [layerGroupStr]: addLayer(action.id, state[layerGroupStr])
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
        activeString: state.activeString === 'A' ? 'B' : 'A'
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
