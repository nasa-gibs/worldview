import {
  cloneDeep as lodashCloneDeep,
  assign as lodashAssign,
  findIndex as lodashFindIndex,
} from 'lodash';
import update from 'immutability-helper';
import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYER_GROUP,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  REMOVE_LAYER,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_CMR_GEOMETRY,
  TOGGLE_HOVERED_GRANULE,
} from './constants';
import {
  SET_CUSTOM as SET_CUSTOM_PALETTE,
  CLEAR_CUSTOM as CLEAR_CUSTOM_PALETTE,
  SET_THRESHOLD_RANGE_AND_SQUASH,
  SET_DISABLED_CLASSIFICATION,
} from '../palettes/constants';
import {
  CLEAR_VECTORSTYLE,
  SET_VECTORSTYLE,
  SET_FILTER_RANGE,
} from '../vector-styles/constants';
import { resetLayers } from './selectors';

export const initialState = {
  active: [],
  activeB: [],
  hoveredLayer: '',
  layerConfig: {},
  facetArray: [],
  startingLayers: [],
  hoveredGranule: null,
  granuleLayers: {
    active: {},
    activeB: {},
  },
};
export function getInitialState(config) {
  return lodashAssign({}, initialState, {
    active: resetLayers(config.defaults.startingLayers, config.layers),
    layerConfig: config.layers,
    startingLayers: config.defaults.startingLayers,
  });
}

export function layerReducer(state = initialState, action) {
  const layerGroupStr = action.activeString;
  switch (action.type) {
    case RESET_LAYERS:
    case ADD_LAYER:
    case REORDER_LAYER_GROUP:
    case ADD_LAYERS_FOR_EVENT:
    case REMOVE_LAYER:
      return lodashAssign({}, state, {
        [layerGroupStr]: action.layers,
      });
    case INIT_SECOND_LAYER_GROUP:
      return lodashAssign({}, state, {
        activeB: lodashCloneDeep(state.active),
      });
    case ON_LAYER_HOVER:
      return lodashAssign({}, state, {
        hoveredLayer: action.active ? action.id : '',
      });
    case TOGGLE_LAYER_VISIBILITY:
      return update(state, {
        [layerGroupStr]: {
          [action.index]: { visible: { $set: action.visible } },
        },
      });
    case SET_THRESHOLD_RANGE_AND_SQUASH:
    case SET_DISABLED_CLASSIFICATION: {
      const layerIndex = lodashFindIndex(state[layerGroupStr], {
        id: action.layerId,
      });
      return update(state, {
        [layerGroupStr]: {
          [layerIndex]: {
            $merge: action.props,
          },
        },
      });
    }
    case CLEAR_CUSTOM_PALETTE: {
      const layerIndex = lodashFindIndex(state[layerGroupStr], {
        id: action.layerId,
      });

      return update(state, {
        [layerGroupStr]: {
          [layerIndex]: {
            custom: {
              $set: undefined,
            },
          },
        },
      });
    }
    case SET_CUSTOM_PALETTE: {
      const layerIndex = lodashFindIndex(state[layerGroupStr], {
        id: action.layerId,
      });
      return update(state, {
        [layerGroupStr]: {
          [layerIndex]: {
            custom: {
              $set: [action.paletteId],
            },
          },
        },
      });
    }
    case SET_FILTER_RANGE: {
      const layerIndex = lodashFindIndex(state[layerGroupStr], {
        id: action.layerId,
      });
      return update(state, {
        [layerGroupStr]: {
          [layerIndex]: {
            $merge: action.props,
          },
        },
      });
    }
    case CLEAR_VECTORSTYLE: {
      const layerIndex = lodashFindIndex(state[layerGroupStr], {
        id: action.layerId,
      });

      return update(state, {
        [layerGroupStr]: {
          [layerIndex]: {
            custom: {
              $set: undefined,
            },
          },
        },
      });
    }
    case SET_VECTORSTYLE: {
      const layerIndex = lodashFindIndex(state[layerGroupStr], {
        id: action.layerId,
      });
      return update(state, {
        [layerGroupStr]: {
          [layerIndex]: {
            custom: {
              $set: action.vectorStyleId,
            },
          },
        },
      });
    }
    case ADD_GRANULE_LAYER_DATES:
      return update(state, {
        granuleLayers: {
          [action.activeKey]: {
            $merge: {
              [action.id]: {
                dates: action.dates, count: action.count, geometry: action.geometry,
              },
            },
          },
        },
      });
    case UPDATE_GRANULE_LAYER_DATES:
      return update(state, {
        granuleLayers: {
          [action.activeKey]: {
            $merge: {
              [action.id]: {
                dates: action.dates, count: action.count, geometry: action.geometry,
              },
            },
          },
        },
      });
    case UPDATE_GRANULE_CMR_GEOMETRY:
      return update(state, {
        granuleLayers: {
          [action.activeKey]: {
            $merge: {
              [action.id]: {
                geometry: action.geometry,
              },
            },
          },
        },
      });
    case TOGGLE_HOVERED_GRANULE:
      return lodashAssign({}, state, {
        hoveredGranule: action.hoveredGranule,
      });
    case UPDATE_OPACITY:
      return update(state, {
        [layerGroupStr]: {
          [action.index]: { opacity: { $set: action.opacity } },
        },
      });
    default:
      return state;
  }
}
