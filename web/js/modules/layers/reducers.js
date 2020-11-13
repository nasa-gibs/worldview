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
  TOGGLE_LAYER_GROUPS,
  REMOVE_LAYER,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
  REORDER_LAYER_GROUPS,
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

export const initialState = {
  active: { layers: [], groups: [] },
  activeB: { layers: [], groups: [] },
  showGroups: true,
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
      layers: startingLayers,
      groups: getOverlayGroups(startingLayers),
    },
    layerConfig,
    startingLayers: defaults.startingLayers,
  };
}

export function layerReducer(state = initialState, action) {
  const compareState = action.activeString;
  const getLayerIndex = () => {
    const activeLayers = state[compareState].layers;
    return lodashFindIndex(activeLayers, {
      id: action.layerId,
    });
  };

  switch (action.type) {
    case RESET_LAYERS:
    case ADD_LAYER:
    case REORDER_LAYER_GROUPS:
    case ADD_LAYERS_FOR_EVENT:
    case REMOVE_LAYER:
      return {
        ...state,
        [compareState]: {
          layers: action.layers,
          groups: action.groups || getOverlayGroups(action.layers),
        },
      };

    case REORDER_LAYERS:
      return update(state,
        {
          [compareState]: {
            layers: { $set: action.layers },
          },
        });

    case TOGGLE_LAYER_GROUPS:
      return {
        ...state,
        showGroups: !state.showGroups,
      };

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
            [action.index]: {
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
            [action.index]: {
              opacity: { $set: action.opacity },
            },
          },
        },
      });

    default:
      return state;
  }
}
