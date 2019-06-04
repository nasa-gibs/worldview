import { assign as lodashAssign, get } from 'lodash';
import { encode } from './modules/link/util';
// legacy crutches
// import { getLayersParameterSetup } from './modules/layers/util';
import { serializeDate, tryCatchDate } from './modules/date/util';
import { checkTourBuildTimestamp } from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import { eventParse, serializeEvent } from './modules/natural-events/util';
import { mapLocationToCompareState } from './modules/compare/util';
import { mapLocationToProjState } from './modules/projection/util';
import {
  layersParse12,
  serializeLayers,
  mapLocationToLayerState
} from './modules/layers/util';
import { resetLayers } from './modules/layers/selectors';
import { eventsReducerState } from './modules/natural-events/reducers';
import { mapLocationToPaletteState } from './modules/palettes/util';
import { mapLocationToAnimationState } from './modules/animation/util';
import util from './util/util';
import update from 'immutability-helper';

/**
 * Override state with information from location.search when "REDUX-LOCATION-POP-ACTION"
 * is dispatched
 *
 * mapLocationToState
 * @param {Object} state | Default state object
 * @param {Object} location | Redux-location-state Location object
 */
export function mapLocationToState(state, location) {
  const config = state.config;
  if (location.search) {
    let parameters = util.fromQueryString(location.search);
    let stateFromLocation = location.query;
    stateFromLocation = mapLocationToProjState(
      parameters,
      stateFromLocation,
      state
    );
    stateFromLocation = mapLocationToLayerState(
      parameters,
      stateFromLocation,
      state,
      config
    );
    stateFromLocation = mapLocationToCompareState(
      parameters,
      stateFromLocation
    );
    stateFromLocation = mapLocationToPaletteState(
      parameters,
      stateFromLocation,
      state,
      config
    );
    stateFromLocation = mapLocationToAnimationState(
      parameters,
      stateFromLocation,
      state,
      config
    );
    // one level deep merge of newState with defaultState
    for (var key in stateFromLocation) {
      const obj = lodashAssign({}, state[key], stateFromLocation[key]);
      stateFromLocation = update(stateFromLocation, {
        [key]: { $set: obj }
      });
    }
    return update(state, { $merge: stateFromLocation });
  } else {
    const startTour = checkTourBuildTimestamp(state.config);
    if (
      startTour &&
      config.features.tour &&
      config.stories &&
      config.storyOrder
    ) {
      return update(state, {
        tour: { active: { $set: true } }
      });
    }
    return state;
  }
}

const getParameters = function(config, parameters) {
  const now = util.now();
  return {
    p: {
      stateKey: 'proj.id',
      initialState: 'geographic'
    },
    t: {
      stateKey: 'date.selected',
      initialState: now, // ! now is not the same as default util.now() in the date.state due to invoking at different times
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        setAsEmptyItem: true,
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'compare.active');
          const isCompareA = get(state, 'compare.isCompareA');
          const dateB = get(state, 'date.selectedB');
          return !compareIsActive && !isCompareA
            ? serializeDate(dateB)
            : !currentItemState
              ? undefined
              : serializeDate(currentItemState);
        },
        parse: str => {
          return tryCatchDate(str, now);
        }
      }
    },
    t1: {
      stateKey: 'legacy.date.selectedB',
      initialState: util.dateAdd(now, 'day', -7),
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isActive = get(state, 'compare.active');
          if (!isActive) return undefined;
          return serializeDate(
            currentItemState || util.dateAdd(now, 'day', -7)
          );
        },
        parse: str => {
          return tryCatchDate(str, util.dateAdd(now, 'day', -7));
        }
      }
    },
    z: {
      stateKey: 'date.selectedZoom',
      initialState: 3,
      options: {
        parse: str => {
          return str ? Number(str) : 3;
        },
        serialize: val => {
          return val.toString();
        }
      }
    },
    ics: {
      stateKey: 'date.customSelected',
      initialState: false,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const customDelta = get(state, 'date.customDelta');
          const customInterval = get(state, 'date.customInterval');
          if (customDelta === 1 && customInterval === 3) {
            return undefined;
          }
          return currentItemState.toString();
        },
        parse: val => {
          return val.toString();
        }
      }
    },
    ici: {
      stateKey: 'date.customInterval',
      initialState: 3,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isCustomSelected = get(state, 'date.customSelected');
          if (!isCustomSelected) return undefined;
          return currentItemState.toString();
        },
        parse: val => {
          return val.toString();
        }
      }
    },
    icd: {
      stateKey: 'date.customDelta',
      initialState: 1,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isCustomSelected = get(state, 'date.customSelected');
          if (!isCustomSelected) return undefined;
          return currentItemState.toString();
        },
        parse: val => {
          return Number(val);
        }
      }
    },
    e: {
      stateKey: 'events',
      type: 'object',
      initialState: eventsReducerState,
      options: {
        parse: eventParse,
        serialize: serializeEvent
      }
    },
    l: {
      stateKey: 'layers.active',
      initialState: resetLayers(config.defaults.startingLayers, config.layers),
      type: 'array',
      options: {
        parse: permalink => {
          return layersParse12(permalink, config);
        },
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          const compareIsActive = get(state, 'compare.active');
          const isCompareA = get(state, 'compare.isCompareA');
          const activeLayersB = get(state, 'layers.activeB');
          return !isCompareA && !compareIsActive
            ? serializeLayers(activeLayersB, state, 'activeB')
            : serializeLayers(currentLayers, state, 'active');
        }
      }
    },
    l1: {
      stateKey: 'layers.activeB',
      initialState: [],
      type: 'array',
      options: {
        parse: permalink => {
          return layersParse12(permalink, config);
        },
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          const compareIsActive = get(state, 'compare.active');
          return compareIsActive
            ? serializeLayers(currentLayers, state, 'activeB')
            : undefined;
        }
      }
    },
    ca: {
      stateKey: 'compare.isCompareA',
      initialState: true,
      type: 'bool',
      options: {
        setAsEmptyItem: true,
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'compare.active');
          return compareIsActive ? currentItemState : undefined;
        }
      }
    },
    cm: {
      stateKey: 'compare.mode',
      initialState: 'swipe'
    },
    cv: {
      stateKey: 'compare.value',
      initialState: 50,
      type: 'number'
    },
    tr: {
      stateKey: 'tour.selected',
      initialState: ''
    },
    al: {
      stateKey: 'animation.loop',
      initialState: false,
      type: 'bool'
    },
    as: {
      stateKey: 'animation.startDate',
      initialState: util.dateAdd(now, 'day', -7),
      type: 'date',
      options: {
        serialize: serializeDate,
        parse: tryCatchDate
      }
    },
    ae: {
      stateKey: 'animation.endDate',
      initialState: now,
      type: 'date',
      options: {
        serialize: serializeDate,
        parse: tryCatchDate
      }
    },
    av: {
      stateKey: 'animation.speed',
      initialState: 3,
      type: 'number'
    },
    ab: {
      stateKey: 'animation.isActive',
      initialState: false,
      options: {
        serialize: boo => {
          return boo ? 'on' : undefined;
        },
        parse: str => {
          return str === 'on';
        }
      }
    },
    download: {
      stateKey: 'data.selectedProduct',
      initialState: '',
      type: 'string',
      options: {
        delimiter: ',',
        serializeNeedsGlobalState: true,
        parse: id => {
          if (!config.products[id]) {
            console.warn('No such product: ' + id);
            return '';
          }
          return id;
        },
        serialize: (currentItemState, state) => {
          if (!state.sidebar.activeTab !== 'download') return undefined;
          return encode(currentItemState);
        }
      }
    }
  };
};

export function getParamObject(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const mapParamObject = getMapParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors
  );
  const obj = lodashAssign(
    {},
    mapParamObject,
    getParameters(config, parameters)
  );
  return {
    global: obj
  };
}
