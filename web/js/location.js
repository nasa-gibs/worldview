import { assign as lodashAssign, get } from 'lodash';
import { encode } from './modules/link/util';
// legacy crutches
// import { getLayersParameterSetup } from './modules/layers/util';
import { getDateParameterSetup } from './modules/date/util';
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
import util from './util/util';
import update from 'immutability-helper';

/**
 * Override state with information from location.search
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
  return {
    p: {
      stateKey: 'proj.id',
      initialState: 'geographic'
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
          //   if (parameters.ca !== undefined) {
          return layersParse12(permalink, config);
          // }
          // return [];
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
  // const dateParamObject = getDateParameterSetup(
  //   parameters,
  //   config,
  //   models,
  //   legacyState,
  //   errors
  // );
  const obj = lodashAssign(
    {},
    // dateParamObject,
    // animationParamObject,
    mapParamObject,
    getParameters(config, parameters)
  );
  return {
    global: obj
  };
}
