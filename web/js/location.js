import { assign as lodashAssign, get } from 'lodash';
import update from 'immutability-helper';
import { encode } from './modules/link/util';
// legacy crutches
// import { getLayersParameterSetup } from './modules/layers/util';
import { serializeDate, tryCatchDate, mapLocationToDateState } from './modules/date/util';
import {
  checkTourBuildTimestamp,
  mapLocationToTourState,
} from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import { eventParse, serializeEvent } from './modules/natural-events/util';
import { mapLocationToCompareState } from './modules/compare/util';
import {
  mapLocationToProjState,
  parseProjection,
} from './modules/projection/util';
import {
  layersParse12,
  serializeLayers,
  mapLocationToLayerState,
} from './modules/layers/util';
import { resetLayers, hasSubDaily } from './modules/layers/selectors';
import { eventsReducerState } from './modules/natural-events/reducers';
import { mapLocationToPaletteState } from './modules/palettes/util';
import { mapLocationToAnimationState } from './modules/animation/util';
import { mapLocationToSidebarState } from './modules/sidebar/util';
import util from './util/util';
import { mapLocationToDataState } from './modules/data/util';

/**
 * Override state with information from location.search when "REDUX-LOCATION-POP-ACTION"
 * is dispatched
 *
 * mapLocationToState
 * @param {Object} state | Default state object
 * @param {Object} location | Redux-location-state Location object
 */
export const mapLocationToState = (state, location) => {
  const { config } = state;
  if (location.search) {
    const parameters = util.fromQueryString(location.search);
    let stateFromLocation = location.query;
    stateFromLocation = mapLocationToDateState(
      parameters,
      stateFromLocation,
      state,
    );
    stateFromLocation = mapLocationToProjState(
      parameters,
      stateFromLocation,
      state,
    );
    stateFromLocation = mapLocationToLayerState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    stateFromLocation = mapLocationToCompareState(
      parameters,
      stateFromLocation,
    );
    stateFromLocation = mapLocationToDataState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    stateFromLocation = mapLocationToPaletteState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    stateFromLocation = mapLocationToAnimationState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    stateFromLocation = mapLocationToSidebarState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    stateFromLocation = mapLocationToTourState(
      parameters,
      stateFromLocation,
      state,
      config,
    );

    // one level deep merge of newState with defaultState
    Object.keys(stateFromLocation).forEach((key) => {
      const obj = lodashAssign({}, state[key], stateFromLocation[key]);
      stateFromLocation = update(stateFromLocation, {
        [key]: { $set: obj },
      });
    });
    return update(state, { $merge: stateFromLocation });
  }
  const startTour = checkTourBuildTimestamp(state.config);
  if (
    startTour
      && config.features.tour
      && config.stories
      && config.storyOrder
  ) {
    return update(state, {
      tour: { active: { $set: true } },
    });
  }
  return state;
};

const getParameters = function(config, parameters) {
  const now = config.pageLoadTime;
  const nowMinusSevenDays = util.dateAdd(config.pageLoadTime, 'day', -7);
  // If at the beginning of the day, wait on the previous day until GIBS
  // catches up (about three hours)
  const initialDate = now.getUTCHours() < 3
    ? new Date(now).setUTCDate(now.getUTCDate() - 1)
    : now;
  return {
    p: {
      stateKey: 'proj.id',
      initialState: 'geographic',
      options: {
        parse: (str) => parseProjection(str, config),
      },
    },
    now: {
      stateKey: 'date.testNow',
      initialState: undefined,
      type: 'date',
      options: {
        serializeNeedsGlobalState: false,
        setAsEmptyItem: true,
        serialize: (currentItemState) => (currentItemState
          ? util.toISOStringSeconds(currentItemState)
          : undefined),
        parse: (str) => tryCatchDate(str, now),
      },
    },
    t: {
      stateKey: 'date.selected',
      initialState: new Date(initialDate),
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        setAsEmptyItem: true,
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'compare.active');
          const isCompareA = get(state, 'compare.isCompareA');
          const dateB = get(state, 'date.selectedB');
          const appNow = get(state, 'date.appNow');
          const appNowString = util.toISOStringSeconds(appNow);

          return !compareIsActive && !isCompareA
            ? util.toISOStringSeconds(dateB) === appNowString
              ? undefined
              : serializeDate(dateB)
            : util.toISOStringSeconds(currentItemState) === appNowString
              ? undefined
              : !currentItemState
                ? undefined
                : serializeDate(currentItemState);
        },
        parse: (str) => {
          let time = tryCatchDate(str, now);
          if (time instanceof Date) {
            const startDate = new Date(config.startDate);
            if (time < startDate) {
              time = startDate;
            } else if (time > now) {
              time = now;
            }
          }
          return time;
        },
      },
    },
    t1: {
      stateKey: 'date.selectedB',
      initialState: nowMinusSevenDays,
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        setAsEmptyItem: true,
        serialize: (currentItemState, state) => {
          const isActive = get(state, 'compare.active');
          const appNow = get(state, 'date.appNow');
          const appNowMinusSevenDays = util.dateAdd(appNow, 'day', -7);
          const appNowMinusSevenDaysString = util.toISOStringSeconds(
            appNowMinusSevenDays,
          );
          if (!isActive) return undefined;
          return appNowMinusSevenDaysString
            === util.toISOStringSeconds(currentItemState)
            ? undefined
            : serializeDate(currentItemState || appNowMinusSevenDays);
        },
        parse: (str) => tryCatchDate(str, nowMinusSevenDays),
      },
    },
    z: {
      stateKey: 'date.selectedZoom',
      initialState: 3,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          let zoom = currentItemState;
          // check if subdaily timescale zoom to determine if reset is needed
          if (zoom > 3) {
            const { layers, compare } = state;
            const hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
            if (!hasSubdailyLayers) {
              zoom = 3; // reset to day
            }
          }
          return zoom === 3 ? undefined : zoom.toString();
        },
        parse: (str) => (str ? Number(str) : 3),
      },
    },
    i: {
      stateKey: 'date.interval',
      initialState: 3,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          let interval = currentItemState;
          // check if subdaily timescale zoom to determine if reset is needed
          if (interval > 3) {
            const { layers, compare } = state;
            const hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
            if (!hasSubdailyLayers) {
              interval = 3; // reset to day
            }
          }
          return interval === 3 ? undefined : interval.toString();
        },
        parse: (str) => (str ? Number(str) : 3),
      },
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
          return currentItemState;
        },
        parse: (val) => val === 'true',
      },
    },
    ici: {
      stateKey: 'date.customInterval',
      initialState: undefined,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isCustomSelected = get(state, 'date.customSelected');
          if (!isCustomSelected) return undefined;
          let customInterval = currentItemState;
          // check if subdaily customInterval to determine if reset is needed
          if (customInterval > 3) {
            const { layers, compare } = state;
            const hasSubdailyLayers = hasSubDaily(layers[compare.activeString]);
            if (!hasSubdailyLayers) {
              customInterval = 3; // reset to day
            }
          }
          return customInterval.toString();
        },
        parse: (val) => Number(val),
      },
    },
    icd: {
      stateKey: 'date.customDelta',
      initialState: undefined,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isCustomSelected = get(state, 'date.customSelected');
          if (!isCustomSelected) return undefined;
          return currentItemState.toString();
        },
        parse: (val) => Number(val),
      },
    },
    as: {
      stateKey: 'animation.startDate',
      initialState: nowMinusSevenDays,
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isAnimActive = get(state, 'animation.isActive');
          return isAnimActive
            ? serializeDate(currentItemState || nowMinusSevenDays)
            : undefined;
        },
        parse: (str) => tryCatchDate(str, nowMinusSevenDays),
      },
    },
    ae: {
      stateKey: 'animation.endDate',
      initialState: now,
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isAnimActive = get(state, 'animation.isActive');
          return isAnimActive
            ? serializeDate(currentItemState || now)
            : undefined;
        },
        parse: (str) => tryCatchDate(str, now),
      },
    },
    e: {
      stateKey: 'events',
      type: 'object',
      initialState: eventsReducerState,
      options: {
        parse: eventParse,
        serialize: serializeEvent,
      },
    },
    l: {
      stateKey: 'layers.active',
      initialState: resetLayers(config.defaults.startingLayers, config.layers),
      type: 'array',
      options: {
        parse: (permalink) => layersParse12(permalink, config),
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          const compareIsActive = get(state, 'compare.active');
          const isCompareA = get(state, 'compare.isCompareA');
          const activeLayersB = get(state, 'layers.activeB');
          return !isCompareA && !compareIsActive
            ? serializeLayers(activeLayersB, state, 'activeB')
            : serializeLayers(currentLayers, state, 'active');
        },
      },
    },
    l1: {
      stateKey: 'layers.activeB',
      initialState: [],
      type: 'array',
      options: {
        parse: (permalink) => layersParse12(permalink, config),
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          const compareIsActive = get(state, 'compare.active');
          return compareIsActive
            ? serializeLayers(currentLayers, state, 'activeB')
            : undefined;
        },
      },
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
        },
      },
    },
    cm: {
      stateKey: 'compare.mode',
      initialState: 'swipe',
    },
    cv: {
      stateKey: 'compare.value',
      initialState: 50,
      type: 'number',
    },
    tr: {
      stateKey: 'tour.selected',
      initialState: '',
    },
    al: {
      stateKey: 'animation.loop',
      initialState: false,
      type: 'bool',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (boo, state) => {
          const isAnimActive = get(state, 'animation.isActive');
          return isAnimActive ? boo : undefined;
        },
      },
    },
    av: {
      stateKey: 'animation.speed',
      initialState: 3,
      type: 'number',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (num, state) => {
          const isAnimActive = get(state, 'animation.isActive');
          return isAnimActive ? num : undefined;
        },
      },
    },
    ab: {
      stateKey: 'animation.isActive',
      initialState: false,
      options: {
        serialize: (boo) => (boo ? 'on' : undefined),
        parse: (str) => str === 'on',
      },
    },
    download: {
      stateKey: 'data.selectedProduct',
      initialState: '',
      type: 'string',
      options: {
        delimiter: ',',
        serializeNeedsGlobalState: true,
        parse: (id) => {
          if (!config.products[id]) {
            console.warn(`No such product: ${id}`);
            return '';
          }
          return id;
        },
        serialize: (currentItemState, state) => {
          if (state.sidebar.activeTab !== 'download') return undefined;
          return encode(currentItemState);
        },
      },
    },
  };
};

export function getParamObject(
  parameters,
  config,
  models,
  legacyState,
  errors,
) {
  const mapParamObject = getMapParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors,
  );
  const obj = lodashAssign(
    {},
    mapParamObject,
    getParameters(config, parameters),
  );
  return {
    global: obj,
    RLSCONFIG: {
      queryParser: (q) => q.match(/^.*?(?==)|[^=\n\r].*$/gm),
    },
  };
}
