import { get } from 'lodash';
import update from 'immutability-helper';
// legacy crutches
import {
  serializeDate, tryCatchDate, parsePermalinkDate, mapLocationToDateState,
} from './modules/date/util';
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
  serializeGroupOverlays,
  mapLocationToLayerState,
} from './modules/layers/util';
import { resetLayers, hasSubDaily, getActiveLayers } from './modules/layers/selectors';
import { eventsReducerState } from './modules/natural-events/reducers';
import { mapLocationToPaletteState } from './modules/palettes/util';
import { mapLocationToAnimationState } from './modules/animation/util';
import { areCoordinatesWithinExtent, mapLocationToGeosearchState } from './modules/geosearch/util';
import mapLocationToSidebarState from './modules/sidebar/util';
import util from './util/util';

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
    stateFromLocation = mapLocationToGeosearchState(
      parameters,
      stateFromLocation,
      state,
    );
    stateFromLocation = mapLocationToCompareState(
      parameters,
      stateFromLocation,
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
      const obj = { ...state[key], ...stateFromLocation[key] };
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
  const { initialDate } = config;
  const startingLayers = resetLayers(config.defaults.startingLayers, config.layers);
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
          const initialDateString = util.toISOStringSeconds(initialDate);
          return !compareIsActive && !isCompareA
            ? util.toISOStringSeconds(dateB) === initialDateString
              ? undefined
              : serializeDate(dateB)
            : util.toISOStringSeconds(currentItemState) === initialDateString
              ? undefined
              : !currentItemState
                ? undefined
                : serializeDate(currentItemState);
        },
        parse: (str) => parsePermalinkDate(now, str, parameters.l, config),
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
          const initialDateString = util.toISOStringSeconds(initialDate);
          const appNowMinusSevenDays = util.dateAdd(initialDateString, 'day', -7);
          const appNowMinusSevenDaysString = util.toISOStringSeconds(
            appNowMinusSevenDays,
          );
          if (!isActive) return undefined;
          return appNowMinusSevenDaysString
            === util.toISOStringSeconds(currentItemState)
            ? undefined
            : serializeDate(currentItemState || appNowMinusSevenDays);
        },
        parse: (str) => parsePermalinkDate(nowMinusSevenDays, str, parameters.l1, config),
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
            const hasSubdailyLayers = hasSubDaily(getActiveLayers(state));
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
            const hasSubdailyLayers = hasSubDaily(getActiveLayers(state));
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
            const hasSubdailyLayers = hasSubDaily(getActiveLayers(state));
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
      stateKey: 'layers.active.layers',
      initialState: startingLayers,
      type: 'array',
      options: {
        parse: (permalink) => layersParse12(permalink, config),
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          const compareIsActive = get(state, 'compare.active');
          const isCompareA = get(state, 'compare.isCompareA');
          const activeLayersB = get(state, 'layers.activeB.layers');
          return !isCompareA && !compareIsActive
            ? serializeLayers(activeLayersB, state, 'activeB')
            : serializeLayers(currentLayers, state, 'active');
        },
      },
    },
    lg: {
      stateKey: 'layers.active.groupOverlays',
      initialState: true,
      type: 'bool',
      options: {
        setAsEmptyItem: true,
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => serializeGroupOverlays(currentItemState, state, 'active'),
      },
    },
    l1: {
      stateKey: 'layers.activeB.layers',
      initialState: [],
      type: 'array',
      options: {
        parse: (permalink) => layersParse12(permalink, config),
        serializeNeedsGlobalState: true,
        serialize: (currentBLayers, state) => {
          const compareIsActive = get(state, 'compare.active');
          return compareIsActive
            ? serializeLayers(currentBLayers, state, 'activeB')
            : undefined;
        },
      },
    },
    lg1: {
      stateKey: 'layers.activeB.groupOverlays',
      initialState: true,
      type: 'bool',
      options: {
        setAsEmptyItem: true,
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'compare.active');
          return compareIsActive
            ? serializeGroupOverlays(currentItemState, state, 'activeB')
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
    // download: {
    //   stateKey: 'data.selectedProduct',
    //   initialState: '',
    //   type: 'string',
    //   options: {
    //     delimiter: ',',
    //     serializeNeedsGlobalState: true,
    //     parse: (id) => {
    //       if (!config.products[id]) {
    //         console.warn(`No such product: ${id}`);
    //         return '';
    //       }
    //       return id;
    //     },
    //     serialize: (currentItemState, state) => {
    //       if (state.sidebar.activeTab !== 'download') return undefined;
    //       return encode(currentItemState);
    //     },
    //   },
    // },
    gm: {
      stateKey: 'geosearch.coordinates',
      initialState: [],
      type: 'string',
      options: {
        serializeNeedsGlobalState: true,
        parse: (coordinates) => coordinates,
        serialize: (coordinates, state) => {
          const { map } = state;
          if (map.ui.selected) {
            const coordinatesWithinExtent = areCoordinatesWithinExtent(map, config, coordinates);
            if (!coordinatesWithinExtent) {
              return;
            }
          }
          return coordinates;
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
  return {
    global: {
      ...mapParamObject,
      ...getParameters(config, parameters),
    },
    RLSCONFIG: {
      queryParser: (q) => q.match(/^.*?(?==)|[^=\n\r].*$/gm),
    },
  };
}
