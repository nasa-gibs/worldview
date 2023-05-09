import { get } from 'lodash';
import update from 'immutability-helper';

// legacy crutches
import {
  serializeDate,
  serializeDateWrapper,
  serializeDateBWrapper,
  tryCatchDate,
  parsePermalinkDate,
  mapLocationToDateState,
} from './modules/date/util';
import {
  checkTourBuildTimestamp,
  mapLocationToTourState,
} from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import {
  parseEvent,
  serializeEvent,
  serializeCategories,
  mapLocationToEventFilterState,
  serializeEventFilterDates,
  parseEventFilterDates,
} from './modules/natural-events/util';
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
import { resetLayers, subdailyLayersActive } from './modules/layers/selectors';
import { getInitialEventsState } from './modules/natural-events/reducers';
import { mapLocationToPaletteState } from './modules/palettes/util';
import { mapLocationToEmbedState } from './modules/embed/util';
import { mapLocationToAnimationState } from './modules/animation/util';
import { mapLocationToLocationSearchState, serializeCoordinatesWrapper } from './modules/location-search/util';
import mapLocationToSidebarState from './modules/sidebar/util';
import util from './util/util';
import {
  serializeSmartHandoff,
  parseSmartHandoff,
} from './modules/smart-handoff/util';

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
    stateFromLocation = mapLocationToLocationSearchState(
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
    stateFromLocation = mapLocationToEmbedState(
      parameters,
      stateFromLocation,
    );
    stateFromLocation = mapLocationToEventFilterState(
      parameters,
      stateFromLocation,
      state,
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
  const startingLayers = resetLayers(config);
  const eventsReducerState = getInitialEventsState(config);
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
    z: {
      stateKey: 'date.selectedZoom',
      initialState: 3,
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          let zoom = currentItemState;
          // check if subdaily timescale zoom to determine if reset is needed
          if (zoom > 3) {
            if (!subdailyLayersActive(state)) {
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
            if (!subdailyLayersActive(state)) {
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
            if (!subdailyLayersActive(state)) {
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
    df: {
      stateKey: 'ui.isDistractionFreeModeActive',
      initialState: false,
      type: 'bool',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (boo, state) => {
          const isDistractionFreeModeActive = get(state, 'ui.isDistractionFreeModeActive');
          return isDistractionFreeModeActive ? boo : undefined;
        },
      },
    },
    kiosk: {
      stateKey: 'ui.isKioskModeActive',
      initialState: false,
      type: 'bool',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (boo, state) => {
          const isKioskModeActive = get(state, 'ui.isKioskModeActive');
          return isKioskModeActive ? boo : undefined;
        },
      },
    },
    eic: {
      stateKey: 'ui.eic',
      initialState: '',
    },
    em: {
      stateKey: 'embed.isEmbedModeActive',
      initialState: false,
      type: 'bool',
      options: {
        parse: (str) => str === 'true',
      },
    },
    e: {
      stateKey: 'events',
      type: 'object',
      initialState: eventsReducerState,
      options: {
        parse: parseEvent,
        serialize: serializeEvent,
      },
    },
    efs: {
      stateKey: 'events.showAll',
      initialState: true,
      type: 'bool',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (showAll, state) => {
          const eventsActive = get(state, 'events.active');
          return eventsActive ? showAll : undefined;
        },
        setAsEmptyItem: true,
      },
    },
    efa: {
      stateKey: 'events.showAllTracks',
      initialState: false,
      type: 'bool',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (showAllTracks, state) => {
          const eventsActive = get(state, 'events.active');
          return eventsActive ? showAllTracks : undefined;
        },
        setAsEmptyItem: true,
      },
    },
    efd: {
      stateKey: 'events.selectedDates',
      type: 'object',
      initialState: eventsReducerState.selectedDates,
      options: {
        parse: parseEventFilterDates,
        serialize: serializeEventFilterDates,
        serializeNeedsGlobalState: true,
        setAsEmptyItem: true,
      },
    },
    efc: {
      stateKey: 'events.selectedCategories',
      type: 'array',
      initialState: eventsReducerState.selectedCategories,
      options: {
        serialize: serializeCategories,
        serializeNeedsGlobalState: true,
        setAsEmptyItem: true,
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
      options: {
        parse: (param) => (config.initialIsMobile ? 'swipe' : param),
      },
    },
    cv: {
      stateKey: 'compare.value',
      initialState: 50,
      type: 'number',
      options: {
        parse: (param) => (config.initialIsMobile ? 50 : param),
      },
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
    aa: {
      stateKey: 'animation.autoplay',
      initialState: false,
      options: {
        serialize: (boo) => (boo ? 'true' : undefined),
        parse: (str) => str === 'true',
      },
    },
    abt: {
      stateKey: 'modalAbout.isOpen',
      initialState: false,
      options: {
        serialize: (boo) => (boo ? 'on' : undefined),
        parse: (str) => str === 'on',
      },
    },
    sh: {
      stateKey: 'smartHandoffs',
      initialState: '',
      type: 'string',
      options: {
        setAsEmptyItem: true,
        serializeNeedsGlobalState: true,
        serialize: serializeSmartHandoff,
        parse: parseSmartHandoff,
      },
    },
    s: {
      stateKey: 'locationSearch.coordinates',
      initialState: [],
      type: 'array',
      options: {
        serializeNeedsGlobalState: true,
        parse: (coordinates) => coordinates,
        serialize: serializeCoordinatesWrapper,
      },
    },
    t: {
      stateKey: 'date.selected',
      initialState: new Date(initialDate),
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        serializeNeedsPrev: true,
        setAsEmptyItem: true,
        serialize: serializeDateWrapper,
        parse: (str) => parsePermalinkDate(now, str, parameters.l, config),
      },
    },
    t1: {
      stateKey: 'date.selectedB',
      initialState: nowMinusSevenDays,
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        serializeNeedsPrev: true,
        setAsEmptyItem: true,
        serialize: serializeDateBWrapper,
        parse: (str) => parsePermalinkDate(nowMinusSevenDays, str, parameters.l1, config),
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
