import {
  cloneDeep as lodashCloneDeep,
  findIndex as lodashFindIndex,
} from 'lodash';
import update from 'immutability-helper';
import {
  RESET_LAYERS,
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYERS,
  ON_LAYER_HOVER,
  TOGGLE_LAYER_VISIBILITY,
  TOGGLE_COLLAPSE_OVERLAY_GROUP,
  TOGGLE_OVERLAY_GROUP_VISIBILITY,
  TOGGLE_OVERLAY_GROUPS,
  REMOVE_LAYER,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
  REORDER_OVERLAY_GROUPS,
  REMOVE_GROUP,
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
import { getOverlayGroups } from './util';

const groupState = {
  groupOverlays: true,
  layers: [],
  overlayGroups: [],
  prevLayers: [],
};

export const initialState = {
  active: { ...groupState },
  activeB: { ...groupState },
  hoveredLayer: '',
  layerConfig: {},
  startingLayers: [],
};

export function getInitialState(config) {
  const { layers: layerConfig, defaults } = config;
  const startingLayers = resetLayers(defaults.startingLayers, layerConfig);
  return {
    ...initialState,
    active: {
      ...groupState,
      layers: startingLayers,
      overlayGroups: getOverlayGroups(startingLayers),
    },
    layerConfig,
    startingLayers: defaults.startingLayers,
  };
}

export function layerReducer(state = initialState, action) {
  const compareState = action.activeString;
  const getPrevOverlayGroups = () => state[compareState].overlayGroups;
  const getLayerIndex = () => {
    const activeLayers = state[compareState].layers;
    return lodashFindIndex(activeLayers, { id: action.id || action.layerId });
  };
  const getGroupIndex = () => lodashFindIndex(
    getPrevOverlayGroups(),
    { groupName: action.groupName },
  );

  switch (action.type) {
    case RESET_LAYERS:
    case ADD_LAYER:
    case ADD_LAYERS_FOR_EVENT:
    case REMOVE_LAYER:
    case REMOVE_GROUP:
    case REORDER_LAYERS:
    case TOGGLE_OVERLAY_GROUP_VISIBILITY:
      return update(state, {
        [compareState]: {
          layers: { $set: action.layers },
          overlayGroups: { $set: getOverlayGroups(action.layers, getPrevOverlayGroups()) },
          prevLayers: { $set: [] },
        },
      });

    case REORDER_OVERLAY_GROUPS:
      return update(state, {
        [compareState]: {
          layers: {
            $set: action.layers,
          },
          overlayGroups: {
            $set: action.overlayGroups,
          },
          prevLayers: { $set: [] },
        },
      });

    case TOGGLE_OVERLAY_GROUPS:
      return {
        ...state,
        [compareState]: {
          groupOverlays: action.groupOverlays,
          layers: action.layers,
          overlayGroups: action.overlayGroups,
          prevLayers: action.prevLayers,
        },
      };

    case TOGGLE_COLLAPSE_OVERLAY_GROUP:
      return update(state, {
        [compareState]: {
          overlayGroups: {
            [getGroupIndex()]: {
              collapsed: { $set: action.collapsed },
            },
          },
        },
      });

    case INIT_SECOND_LAYER_GROUP:
      return {
        ...state,
        activeB: lodashCloneDeep(state.active),
      };

    case ON_LAYER_HOVER:
      return {
        ...state,
        hoveredLayer: action.active ? action.id : '',
      };

    case TOGGLE_LAYER_VISIBILITY:
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              visible: {
                $set: action.visible,
              },
            },
          },
        },
      });

    case SET_THRESHOLD_RANGE_AND_SQUASH:
    case SET_DISABLED_CLASSIFICATION: {
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              $merge: action.props,
            },
          },
        },
      });
    }

    case CLEAR_CUSTOM_PALETTE: {
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              custom: {
                $set: undefined,
              },
            },
          },
        },
      });
    }

    case SET_CUSTOM_PALETTE: {
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              custom: {
                $set: [action.paletteId],
              },
            },
          },
        },
      });
    }

    case SET_FILTER_RANGE: {
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              $merge: action.props,
            },
          },
        },
      });
    }

    case CLEAR_VECTORSTYLE: {
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              custom: {
                $set: undefined,
              },
            },
          },
        },
      });
    }

    case SET_VECTORSTYLE: {
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              custom: {
                $set: action.vectorStyleId,
              },
            },
          },
        },
      });
    }

    case UPDATE_OPACITY:
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              opacity: { $set: action.opacity },
            },
          },
        },
      });

    default:
      return state;
  }
}
