import {
  cloneDeep as lodashCloneDeep,
  findIndex as lodashFindIndex,
} from 'lodash';
import update from 'immutability-helper';
import {
  ADD_LAYER,
  INIT_SECOND_LAYER_GROUP,
  REORDER_LAYERS,
  TOGGLE_LAYER_VISIBILITY,
  TOGGLE_COLLAPSE_OVERLAY_GROUP,
  TOGGLE_OVERLAY_GROUP_VISIBILITY,
  TOGGLE_OVERLAY_GROUPS,
  REMOVE_LAYER,
  UPDATE_OPACITY,
  ADD_LAYERS_FOR_EVENT,
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_OPTIONS,
  UPDATE_GRANULE_LAYER_GEOMETRY,
  CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP,
  REORDER_OVERLAY_GROUPS,
  REMOVE_GROUP,
  UPDATE_DDV_LAYER,
  UPDATE_COLLECTION,
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
import safeLocalStorage from '../../util/local-storage';

const { GROUP_OVERLAYS } = safeLocalStorage.keys;

const groupState = {
  groupOverlays: true,
  layers: [],
  overlayGroups: [],
  prevLayers: [],
  granuleFootprints: {},
  granuleLayers: {},
  granulePlatform: '',
};

export const initialState = {
  active: { ...groupState },
  activeB: { ...groupState },
  collections: {},
  layerConfig: {},
  startingLayers: [],
  granuleFootprints: {},
  eventLayers: [],
};

export function getInitialState(config) {
  const { layers: layerConfig, defaults } = config;
  const startingLayers = resetLayers(config);
  const groupsALocalStorage = safeLocalStorage.getItem(GROUP_OVERLAYS) !== 'disabled';
  const updatedState = {
    ...initialState,
    active: {
      ...initialState.active,
      groupOverlays: groupsALocalStorage,
      layers: startingLayers,
      overlayGroups: getOverlayGroups(startingLayers),
    },
    layerConfig,
    startingLayers: defaults.startingLayers,
  };
  return updatedState;
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
    case ADD_LAYER:
    case REORDER_LAYERS:
    case TOGGLE_OVERLAY_GROUP_VISIBILITY:
      return update(state, {
        [compareState]: {
          $merge: {
            layers: action.layers,
            overlayGroups: getOverlayGroups(action.layers, getPrevOverlayGroups()),
            prevLayers: [],
          },
        },
      });

    case REMOVE_LAYER:
    case REMOVE_GROUP:
      return update(state, {
        [compareState]: {
          $merge: {
            layers: action.layers,
            overlayGroups: getOverlayGroups(action.layers, getPrevOverlayGroups()),
            prevLayers: [],
            granuleLayers: action.granuleLayers,
          },
        },
      });

    case ADD_LAYERS_FOR_EVENT:
    case REORDER_OVERLAY_GROUPS:
      return update(state, {
        [compareState]: {
          layers: { $set: action.layers },
          overlayGroups: { $set: action.overlayGroups },
          prevLayers: { $set: [] },
        },
        eventLayers: action.eventLayers === undefined ? { $push: [] } : action.eventLayers.length ? { $set: action.eventLayers } : { $push: [] },
      });

    case TOGGLE_OVERLAY_GROUPS:
      return update(state, {
        [compareState]: {
          $merge: {
            groupOverlays: action.groupOverlays,
            layers: action.layers,
            overlayGroups: action.overlayGroups,
            prevLayers: action.prevLayers,
          },
        },
      });

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

    case TOGGLE_LAYER_VISIBILITY:
      if (getLayerIndex() === -1) return state;
      return update(state, {
        [compareState]: {
          layers: {
            [getLayerIndex()]: {
              visible: {
                $set: action?.visible,
              },
            },
          },
          prevLayers: { $set: [] },
        },
      });

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

    case SET_THRESHOLD_RANGE_AND_SQUASH:
    case SET_DISABLED_CLASSIFICATION: {
      const layerIndex = getLayerIndex();
      if (layerIndex < 0) return state;
      return update(state, {
        [compareState]: {
          layers: {
            [layerIndex]: {
              $merge: action.props,
            },
          },
        },
      });
    }

    case CLEAR_CUSTOM_PALETTE: {
      const layerIndex = getLayerIndex();
      if (layerIndex < 0) { return state; }
      return update(state, {
        [compareState]: {
          layers: {
            [layerIndex]: {
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

    case ADD_GRANULE_LAYER_DATES: {
      const {
        id, activeKey, dates, granuleFootprints, granulePlatform, count,
      } = action;

      return update(state, {
        [activeKey]: {
          granuleLayers: {
            $merge: {
              [id]: {
                dates,
                count,
                granuleFootprints,
                granulePlatform,
              },
            },
          },
          granulePlatform: {
            $set: granulePlatform,
          },
          granuleFootprints: {
            $set: granuleFootprints,
          },
        },
      });
    }

    case UPDATE_GRANULE_LAYER_OPTIONS: {
      const {
        id, activeKey, count, dates,
      } = action;

      return update(state, {
        [activeKey]: {
          granuleLayers: {
            [id]: {
              $merge: { count, dates },
            },
          },
        },
      });
    }

    case UPDATE_GRANULE_LAYER_GEOMETRY: {
      const {
        id, activeKey, dates, granuleFootprints, count,
      } = action;

      return update(state, {
        [activeKey]: {
          granuleLayers: {
            [id]: {
              $merge: {
                dates,
                granuleFootprints,
                count,
              },
            },
          },
          granuleFootprints: {
            $set: granuleFootprints,
          },
        },
      });
    }

    case CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP:
      return update(state, {
        [action.activeKey]: {
          granulePlatform: {
            $set: action.granulePlatform,
          },
          granuleFootprints: {
            $set: action.geometry,
          },
        },
      });

    case UPDATE_COLLECTION: {
      const updates = {};
      action.payload.forEach((collection) => {
        const {
          id, date, type, version, projection,
        } = collection;
        // If the layer doesn't exist, initialize it
        if (!state.collections[id]) {
          updates[id] = {
            $set: {
              dates: [{
                version,
                type,
                date,
                projection,
              }],
            },
          };
        } else {
          // If the layer exists, prepare to push to the dates array
          const newEntry = {
            date,
            type,
            version,
            projection,
          };
          updates[id] = {
            dates: { $push: [newEntry] },
          };
        }
      });
      return update(state, {
        collections: {
          $apply: (collections) => update(collections, updates),
        },
      });
    }

    // This is required because to update band combinations we need to actually remove and re-add these layers
    // This case sets the ddv layer back to its original index before being removed and added again
    case UPDATE_DDV_LAYER: {
      const { layerIndex, id, layers } = action;
      const indexToMove = layers.findIndex((activeLayer) => activeLayer.id === id);
      const [layerToMove] = layers.splice(indexToMove, 1);
      layers.splice(layerIndex, 0, layerToMove);

      return update(state, {
        [compareState]: {
          $merge: {
            layers,
            overlayGroups: getOverlayGroups(layers, getPrevOverlayGroups()),
            prevLayers: [],
            layerIndex: action.layerIndex,
          },
        },
      });
    }

    default:
      return state;
  }
}
