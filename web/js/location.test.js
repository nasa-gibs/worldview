import { mapLocationToState, getParamObject } from './location';

jest.mock('./util/util', () => ({
  fromQueryString: jest.fn(),
  dateAdd: jest.fn(() => new Date('2019-12-25T00:00:00Z')),
  toISOStringSeconds: jest.fn((d) => d.toISOString().split('.')[0] + 'Z'),
}));

jest.mock('immutability-helper', () => jest.fn((state, update) => {
  if (update.$merge) return { ...state, ...update.$merge };
  const key = Object.keys(update)[0];
  if (update[key].$set !== undefined) return { ...state, [key]: update[key].$set };
  if (key === 'tour') return { ...state, tour: { ...state.tour, active: update.tour.active.$set } };
  return state;
}));

jest.mock('./modules/date/util', () => ({
  serializeDate: jest.fn(),
  serializeDateWrapper: jest.fn(),
  serializeDateBWrapper: jest.fn(),
  serializeDateChartingWrapper: jest.fn(),
  tryCatchDate: jest.fn((str, fallback) => fallback),
  parsePermalinkDate: jest.fn((now) => now),
  mapLocationToDateState: jest.fn((params, state) => state),
}));

jest.mock('./modules/tour/util', () => ({
  checkTourBuildTimestamp: jest.fn(() => false),
  mapLocationToTourState: jest.fn((params, state) => state),
}));

jest.mock('./modules/map/util', () => ({
  getMapParameterSetup: jest.fn(() => ({ mapParam: 'mapValue' })),
}));

jest.mock('./modules/natural-events/util', () => ({
  parseEvent: jest.fn(),
  serializeEvent: jest.fn(),
  serializeCategories: jest.fn(),
  mapLocationToEventFilterState: jest.fn((params, state) => state),
  serializeEventFilterDates: jest.fn(),
  parseEventFilterDates: jest.fn(),
}));

jest.mock('./modules/compare/util', () => ({
  mapLocationToCompareState: jest.fn((params, state) => state),
}));

jest.mock('./modules/charting/util', () => ({
  mapLocationToChartingState: jest.fn((params, state) => state),
}));

jest.mock('./modules/projection/util', () => ({
  mapLocationToProjState: jest.fn((params, state) => state),
  parseProjection: jest.fn((str) => str),
}));

jest.mock('./modules/layers/util', () => ({
  layersParse12: jest.fn(),
  serializeLayers: jest.fn(),
  serializeGroupOverlays: jest.fn(),
  mapLocationToLayerState: jest.fn((params, state) => state),
}));

jest.mock('./modules/layers/selectors', () => ({
  resetLayers: jest.fn(() => []),
  subdailyLayersActive: jest.fn(() => false),
}));

jest.mock('./modules/natural-events/reducers', () => ({
  getInitialEventsState: jest.fn(() => ({
    active: false,
    showAll: true,
    showAllTracks: false,
    selectedDates: {},
    selectedCategories: [],
  })),
}));

jest.mock('./modules/palettes/util', () => ({
  mapLocationToPaletteState: jest.fn((params, state) => state),
}));

jest.mock('./modules/embed/util', () => ({
  mapLocationToEmbedState: jest.fn((params, state) => state),
}));

jest.mock('./modules/animation/util', () => ({
  mapLocationToAnimationState: jest.fn((params, state) => state),
}));

jest.mock('./modules/location-search/util', () => ({
  mapLocationToLocationSearchState: jest.fn((params, state) => state),
  serializeCoordinatesWrapper: jest.fn(),
}));

jest.mock('./modules/sidebar/util', () => jest.fn((params, state) => state));

jest.mock('./modules/smart-handoff/util', () => ({
  serializeSmartHandoff: jest.fn(),
  parseSmartHandoff: jest.fn(),
}));

import util from './util/util';
import { checkTourBuildTimestamp } from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import { getInitialEventsState } from './modules/natural-events/reducers';
import { resetLayers } from './modules/layers/selectors';

const makeState = (overrides = {}) => ({
  config: {
    pageLoadTime: new Date('2020-01-01T00:00:00Z'),
    initialDate: new Date('2020-01-01T00:00:00Z'),
    features: {},
    parameters: {},
  },
  date: { selected: new Date('2020-01-01T00:00:00Z') },
  proj: { id: 'geographic' },
  layers: {
    active: {layers: [], groupOverlays: true },
    activeB: { layers: [], groupOverlays: true },
  },
  compare: { active: false, isCompareA: true, mode: 'swipe', value: 50 },
  charting: { active: false },
  animation: { isActive: false },
  sidebar: {},
  tour: { active: false, selected: '' },
  embed: { isEmbedModeActive: false },
  events: { active: false },
  ui: {},
  palettes: {},
  locationSearch: { coordinates: [] },
  smartHandoffs: '',
  modalAbout: { isOpen: false },
  ...overrides,
});

describe('mapLocationToState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns state unchanged when location.search is empty', () => {
    const state = makeState();
    const result = mapLocationToState(state, { search: '' });
    expect(result).toBe(state);
  });

  it('returns state unchanged when location.search is null', () => {
    const state = makeState();
    const result = mapLocationToState(state, { search: null });
    expect(result).toBe(state);
  });

  it('calls util.fromQueryString when location.search is provided', () => {
    util.fromQueryString.mockReturnValue({});
    const state = makeState();
    mapLocationToState(state, { search: '?t=2020-01-01', query: {} });
    expect(util.fromQueryString).toHaveBeenCalledWith('?t=2020-01-01');
  });

  it('uses location.query as initial stateFromLocation', () => {
    util.fromQueryString.mockReturnValue({});
    const state = makeState();
    const query = { someKey: 'someValue' };
    mapLocationToState(state, { search: '?t=2020-01-01', query });
    expect(util.fromQueryString).toHaveBeenCalled();
  });

  it('uses empty object when location.query is undefined', () => {
    util.fromQueryString.mockReturnValue({});
    const state = makeState();
    expect(() => mapLocationToState(state, { search: '?t=2020-01-01' })).not.toThrow();
  });

  it('calls all mapLocation functions when search is provided', () => {
    util.fromQueryString.mockReturnValue({});
    const {
      mapLocationToDateState,
    } = require('./modules/date/util');
    const {
      mapLocationToProjState,
    } = require('./modules/projection/util');
    const {
      mapLocationToLayerState,
    } = require('./modules/layers/util');
    const {
      mapLocationToCompareState,
    } = require('./modules/compare/util');
    const {
      mapLocationToPaletteState,
    } = require('./modules/palettes/util');
    const {
      mapLocationToAnimationState,
    } = require('./modules/animation/util');
    const {
      mapLocationToEmbedState,
    } = require('./modules/embed/util');
    const {
      mapLocationToEventFilterState,
    } = require('./modules/natural-events/util');

    const state = makeState();
    mapLocationToState(state, { search: '?t=2020-01-01', query: {} });

    expect(mapLocationToDateState).toHaveBeenCalled();
    expect(mapLocationToProjState).toHaveBeenCalled();
    expect(mapLocationToLayerState).toHaveBeenCalled();
    expect(mapLocationToCompareState).toHaveBeenCalled();
    expect(mapLocationToPaletteState).toHaveBeenCalled();
    expect(mapLocationToAnimationState).toHaveBeenCalled();
    expect(mapLocationToEmbedState).toHaveBeenCalled();
    expect(mapLocationToEventFilterState).toHaveBeenCalled();
  });

  it('merges stateFromLocation into state', () => {
    util.fromQueryString.mockReturnValue({});
    const { mapLocationToProjState } = require('./modules/projection/util');
    mapLocationToProjState.mockReturnValue({ proj: { id: 'arctic' } });

    const state = makeState();
    const result = mapLocationToState(state, { search: '?p=arctic', query: {} });
    expect(result).toBeDefined();
  });

  it('sets tour.active to true when checkTourBuildTimestamp returns true and tour features exist', () => {
    checkTourBuildTimestamp.mockReturnValue(true);
    const state = makeState({
      config: {
        pageLoadTime: new Date('2020-01-01T00:00:00Z'),
        initialDate: new Date('2020-01-01T00:00:00Z'),
        features: { tour: true },
        stories: [{ id: 'story1' }],
        storyOrder: ['story1'],
        parameters: {},
      },
    });
    const result = mapLocationToState(state, { search: '' });
    expect(result.tour.active).toBe(true);
  });

  it('does not set tour.active when checkTourBuildTimestamp returns false', () => {
    checkTourBuildTimestamp.mockReturnValue(false);
    const state = makeState({
      config: {
        pageLoadTime: new Date('2020-01-01T00:00:00Z'),
        initialDate: new Date('2020-01-01T00:00:00Z'),
        features: { tour: true },
        stories: [{ id: 'story1' }],
        storyOrder: ['story1'],
        parameters: {},
      },
    });
    const result = mapLocationToState(state, { search: '' });
    expect(result.tour.active).toBe(false);
  });

  it('does not set tour.active when features.tour is missing', () => {
    checkTourBuildTimestamp.mockReturnValue(true);
    const state = makeState({
      config: {
        pageLoadTime: new Date('2020-01-01T00:00:00Z'),
        initialDate: new Date('2020-01-01T00:00:00Z'),
        features: {},
        stories: [{ id: 'story1' }],
        storyOrder: ['story1'],
        parameters: {},
      },
    });
    const result = mapLocationToState(state, { search: '' });
    expect(result.tour.active).toBe(false);
  });

  it('does not set tour.active when stories is missing', () => {
    checkTourBuildTimestamp.mockReturnValue(true);
    const state = makeState({
      config: {
        pageLoadTime: new Date('2020-01-01T00:00:00Z'),
        initialDate: new Date('2020-01-01T00:00:00Z'),
        features: { tour: true },
        storyOrder: ['story1'],
        parameters: {},
      },
    });
    const result = mapLocationToState(state, { search: '' });
    expect(result.tour.active).toBe(false);
  });

  it('does not set tour.active when storyOrder is missing', () => {
    checkTourBuildTimestamp.mockReturnValue(true);
    const state = makeState({
      config: {
        pageLoadTime: new Date('2020-01-01T00:00:00Z'),
        initialDate: new Date('2020-01-01T00:00:00Z'),
        features: { tour: true },
        stories: [{ id: 'story1' }],
        parameters: {},
      },
    });
    const result = mapLocationToState(state, { search: '' });
    expect(result.tour.active).toBe(false);
  });

  it('returns original state when no search and tour conditions not met', () => {
    checkTourBuildTimestamp.mockReturnValue(false);
    const state = makeState();
    const result = mapLocationToState(state, { search: '' });
    expect(result).toBe(state);
  });
});

describe('getParamObject', () => {
  const config = {
    pageLoadTime: new Date('2020-01-01T00:00:00Z'),
    initialDate: new Date('2020-01-01T00:00:00Z'),
    features: {},
    parameters: {},
    initialIsMobile: false,
  };
  const parameters = {};
  const models = {};
  const legacyState = {};
  const errors = [];

  beforeEach(() => {
    jest.clearAllMocks();
    getInitialEventsState.mockReturnValue({
      active: false,
      showAll: true,
      showAllTracks: false,
      selectedDates: {},
      selectedCategories: [],
    });
    resetLayers.mockReturnValue([]);
    util.dateAdd.mockReturnValue(new Date('2019-12-25T00:00:00Z'));
  });

  it('returns an object with global and RLSCONFIG keys', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result).toHaveProperty('global');
    expect(result).toHaveProperty('RLSCONFIG');
  });

  it('calls getMapParameterSetup with correct arguments', () => {
    getParamObject(parameters, config, models, legacyState, errors);
    expect(getMapParameterSetup).toHaveBeenCalledWith(
      parameters, config, models, legacyState, errors);
  });

  it('merges mapParamObject into global', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.mapParam).toBe('mapValue');
  });

  it('RLSCONFIG has queryParser function', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(typeof result.RLSCONFIG.queryParser).toBe('function');
  });

  it('queryParser parses key=value pairs', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const parsed = result.RLSCONFIG.queryParser('t=2020-01-01');
    expect(parsed).toContain('t');
    expect(parsed).toContain('2020-01-01');
  });

  it('global contains p parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.p).toBeDefined();
    expect(result.global.p.stateKey).toBe('proj.id');
  });

  it('global contains t parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.t).toBeDefined();
    expect(result.global.t.stateKey).toBe('date.selected');
  });

  it('global contains t1 parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.t1).toBeDefined();
    expect(result.global.t1.stateKey).toBe('date.selectedB');
  });

  it('global contains now parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.now).toBeDefined();
    expect(result.global.now.stateKey).toBe('date.testNow');
  });

  it('global contains z parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.z).toBeDefined();
    expect(result.global.z.stateKey).toBe('date.selectedZoom');
    expect(result.global.z.initialState).toBe(3);
  });

  it('global contains i parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.i).toBeDefined();
    expect(result.global.i.stateKey).toBe('date.interval');
  });

  it('global contains ics parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ics).toBeDefined();
    expect(result.global.ics.stateKey).toBe('date.customSelected');
  });

  it('global contains ias parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ias).toBeDefined();
    expect(result.global.ias.stateKey).toBe('date.autoSelected');
  });

  it('global contains ici parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ici).toBeDefined();
    expect(result.global.ici.stateKey).toBe('date.customInterval');
  });

  it('global contains icd parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.icd).toBeDefined();
    expect(result.global.icd.stateKey).toBe('date.customDelta');
  });

  it('global contains as parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.as).toBeDefined();
    expect(result.global.as.stateKey).toBe('animation.startDate');
  });

  it('global contains ae parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ae).toBeDefined();
    expect(result.global.ae.stateKey).toBe('animation.endDate');
  });

  it('global contains df parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.df).toBeDefined();
    expect(result.global.df.stateKey).toBe('ui.isDistractionFreeModeActive');
  });

  it('global contains kiosk parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.kiosk).toBeDefined();
    expect(result.global.kiosk.stateKey).toBe('ui.isKioskModeActive');
  });

  it('global contains eic parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.eic).toBeDefined();
    expect(result.global.eic.stateKey).toBe('ui.eic');
  });

  it('global contains e2e parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.e2e).toBeDefined();
    expect(result.global.e2e.stateKey).toBe('ui.isE2eModeActive');
  });

  it('global contains scenario parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.scenario).toBeDefined();
    expect(result.global.scenario.stateKey).toBe('ui.scenario');
  });

  it('global contains em parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.em).toBeDefined();
    expect(result.global.em.stateKey).toBe('embed.isEmbedModeActive');
  });

  it('global contains e parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.e).toBeDefined();
    expect(result.global.e.stateKey).toBe('events');
  });

  it('global contains efs parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.efs).toBeDefined();
    expect(result.global.efs.stateKey).toBe('events.showAll');
  });

  it('global contains efa parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.efa).toBeDefined();
    expect(result.global.efa.stateKey).toBe('events.showAllTracks');
  });

  it('global contains efd parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.efd).toBeDefined();
    expect(result.global.efd.stateKey).toBe('events.selectedDates');
  });

  it('global contains efc parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.efc).toBeDefined();
    expect(result.global.efc.stateKey).toBe('events.selectedCategories');
  });

  it('global contains l parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.l).toBeDefined();
    expect(result.global.l.stateKey).toBe('layers.active.layers');
  });

  it('global contains lg parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.lg).toBeDefined();
    expect(result.global.lg.stateKey).toBe('layers.active.groupOverlays');
  });

  it('global contains l1 parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.l1).toBeDefined();
    expect(result.global.l1.stateKey).toBe('layers.activeB.layers');
  });

  it('global contains lg1 parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.lg1).toBeDefined();
    expect(result.global.lg1.stateKey).toBe('layers.activeB.groupOverlays');
  });

  it('global contains ca parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ca).toBeDefined();
    expect(result.global.ca.stateKey).toBe('compare.isCompareA');
  });

  it('global contains cm parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.cm).toBeDefined();
    expect(result.global.cm.stateKey).toBe('compare.mode');
    expect(result.global.cm.initialState).toBe('swipe');
  });

  it('global contains cv parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.cv).toBeDefined();
    expect(result.global.cv.stateKey).toBe('compare.value');
    expect(result.global.cv.initialState).toBe(50);
  });

  it('global contains cha parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.cha).toBeDefined();
    expect(result.global.cha.stateKey).toBe('charting.active');
  });

  it('global contains chl parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.chl).toBeDefined();
    expect(result.global.chl.stateKey).toBe('charting.activeLayer');
  });

  it('global contains chc parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.chc).toBeDefined();
    expect(result.global.chc.stateKey).toBe('charting.aoiCoordinates');
  });

  it('global contains cht parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.cht).toBeDefined();
    expect(result.global.cht.stateKey).toBe('charting.timeSpanStartDate');
  });

  it('global contains cht2 parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.cht2).toBeDefined();
    expect(result.global.cht2.stateKey).toBe('charting.timeSpanEndDate');
  });

  it('global contains chch parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.chch).toBeDefined();
    expect(result.global.chch.stateKey).toBe('charting.isChartOpen');
  });

  it('global contains tr parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.tr).toBeDefined();
    expect(result.global.tr.stateKey).toBe('tour.selected');
  });

  it('global contains al parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.al).toBeDefined();
    expect(result.global.al.stateKey).toBe('animation.loop');
  });

  it('global contains av parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.av).toBeDefined();
    expect(result.global.av.stateKey).toBe('animation.speed');
    expect(result.global.av.initialState).toBe(3);
  });

  it('global contains ab parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ab).toBeDefined();
    expect(result.global.ab.stateKey).toBe('animation.isActive');
  });

  it('global contains aa parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.aa).toBeDefined();
    expect(result.global.aa.stateKey).toBe('animation.autoplay');
  });

  it('global contains abt parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.abt).toBeDefined();
    expect(result.global.abt.stateKey).toBe('modalAbout.isOpen');
  });

  it('global contains sh parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.sh).toBeDefined();
    expect(result.global.sh.stateKey).toBe('smartHandoffs');
  });

  it('global contains s parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.s).toBeDefined();
    expect(result.global.s.stateKey).toBe('locationSearch.coordinates');
  });

  it('global contains travel parameter', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.travel).toBeDefined();
    expect(result.global.travel.stateKey).toBe('ui.travelMode');
  });

  describe('parameter options', () => {
    it('p.options.parse calls parseProjection', () => {
      const { parseProjection } = require('./modules/projection/util');
      const result = getParamObject(parameters, config, models, legacyState, errors);
      result.global.p.options.parse('arctic');
      expect(parseProjection).toHaveBeenCalledWith('arctic', config);
    });

    it('now.options.parse calls tryCatchDate', () => {
      const { tryCatchDate } = require('./modules/date/util');
      const result = getParamObject(parameters, config, models, legacyState, errors);
      result.global.now.options.parse('2020-01-01');
      expect(tryCatchDate).toHaveBeenCalled();
    });

    it('now.options.serialize returns undefined when currentItemState is falsy', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.now.options.serialize(null);
      expect(serialized).toBeUndefined();
    });

    it('now.options.serialize calls toISOStringSeconds when currentItemState is set', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const date = new Date('2020-01-01T00:00:00Z');
      result.global.now.options.serialize(date);
      expect(util.toISOStringSeconds).toHaveBeenCalledWith(date);
    });

    it('z.options.parse returns 3 when str is falsy', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.z.options.parse(null)).toBe(3);
    });

    it('z.options.parse returns number when str is provided', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.z.options.parse('5')).toBe(5);
    });

    it('z.options.serialize returns undefined when zoom is 3', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.z.options.serialize(3, {})).toBeUndefined();
    });

    it('z.options.serialize resets zoom to 3 when > 3 and no subdaily layers', () => {
      const { subdailyLayersActive } = require('./modules/layers/selectors');
      subdailyLayersActive.mockReturnValue(false);
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.z.options.serialize(5, {})).toBeUndefined();
    });

    it('z.options.serialize returns zoom string when > 3 and subdaily layers active', () => {
      const { subdailyLayersActive } = require('./modules/layers/selectors');
      subdailyLayersActive.mockReturnValue(true);
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.z.options.serialize(5, {})).toBe('5');
    });

    it('i.options.parse returns 3 when str is falsy', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.i.options.parse(null)).toBe(3);
    });

    it('i.options.serialize returns undefined when interval is 3', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.i.options.serialize(3, {})).toBeUndefined();
    });

    it('ics.options.parse returns true when val is "true"', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.ics.options.parse('true')).toBe(true);
    });

    it('ics.options.parse returns false when val is not "true"', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.ics.options.parse('false')).toBe(false);
    });

    it('ias.options.parse returns true when val is "true"', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.ias.options.parse('true')).toBe(true);
    });

    it('ab.options.serialize returns "on" when boo is true', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.ab.options.serialize(true)).toBe('on');
    });

    it('ab.options.serialize returns undefined when boo is false', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.ab.options.serialize(false)).toBeUndefined();
    });

    it('ab.options.parse returns true when str is "on"', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.ab.options.parse('on')).toBe(true);
    });

    it('aa.options.serialize returns "true" when boo is true', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.aa.options.serialize(true)).toBe('true');
    });

    it('aa.options.serialize returns undefined when boo is false', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.aa.options.serialize(false)).toBeUndefined();
    });

    it('abt.options.serialize returns "on" when boo is true', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.abt.options.serialize(true)).toBe('on');
    });

    it('em.options.parse returns true when str is "true"', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.em.options.parse('true')).toBe(true);
    });

    it('em.options.parse returns false when str is not "true"', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.em.options.parse('false')).toBe(false);
    });

    it('chc.options.parse splits and converts string to floats', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.chc.options.parse('10.5,20.3')).toEqual([10.5, 20.3]);
    });

    it('chc.options.serialize joins coordinates', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.chc.options.serialize([10.5, 20.3])).toBe('10.5,20.3');
    });

    it('cm.options.parse returns "swipe" when initialIsMobile is true', () => {
      const mobileConfig = { ...config, initialIsMobile: true };
      const result = getParamObject(parameters, mobileConfig, models, legacyState, errors);
      expect(result.global.cm.options.parse('opacity')).toBe('swipe');
    });

    it('cm.options.parse returns param when initialIsMobile is false', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.cm.options.parse('opacity')).toBe('opacity');
    });

    it('cv.options.parse returns 50 when initialIsMobile is true', () => {
      const mobileConfig = { ...config, initialIsMobile: true };
      const result = getParamObject(parameters, mobileConfig, models, legacyState, errors);
      expect(result.global.cv.options.parse(75)).toBe(50);
    });

    it('cv.options.parse returns param when initialIsMobile is false', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      expect(result.global.cv.options.parse(75)).toBe(75);
    });

    it('as.options.serialize returns undefined when animation not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.as.options.serialize(new Date(), {
        animation: { isActive: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('ae.options.serialize returns undefined when animation not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.ae.options.serialize(new Date(), {
        animation: { isActive: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('al.options.serialize returns undefined when animation not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.al.options.serialize(true, {
        animation: { isActive: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('av.options.serialize returns undefined when animation not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.av.options.serialize(3, { animation: { isActive: false } });
      expect(serialized).toBeUndefined();
    });

    it('df.options.serialize returns undefined when distraction free mode not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.df.options.serialize(true, {
        ui: { isDistractionFreeModeActive: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('kiosk.options.serialize returns undefined when kiosk mode not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.kiosk.options.serialize(true, {
        ui: { isKioskModeActive: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('e2e.options.serialize returns undefined when e2e mode not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.e2e.options.serialize(true, {
        ui: { isE2eModeActive: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('efs.options.serialize returns undefined when events not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.efs.options.serialize(true, {
        events: { active: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('efs.options.serialize returns value when events active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.efs.options.serialize(true, { events: { active: true } });
      expect(serialized).toBe(true);
    });

    it('efa.options.serialize returns undefined when events not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.efa.options.serialize(true, { events: { active: false } });
      expect(serialized).toBeUndefined();
    });

    it('ca.options.serialize returns undefined when compare not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.ca.options.serialize(true, { compare: { active: false } });
      expect(serialized).toBeUndefined();
    });

    it('ca.options.serialize returns value when compare active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.ca.options.serialize(true, { compare: { active: true } });
      expect(serialized).toBe(true);
    });

    it('lg1.options.serialize returns undefined when compare not active', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.lg1.options.serialize(true, { compare: { active: false } });
      expect(serialized).toBeUndefined();
    });

    it('l1.options.serialize returns undefined when compare not active', () => {
      const { serializeLayers } = require('./modules/layers/util');
      serializeLayers.mockReturnValue('serialized');
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.l1.options.serialize([], { compare: { active: false } });
      expect(serialized).toBeUndefined();
    });

    it('ici.options.serialize returns undefined when not custom selected', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.ici.options.serialize(3, {
        date: { customSelected: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('icd.options.serialize returns undefined when not custom selected', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.icd.options.serialize(1, {
        date: { customSelected: false },
      });
      expect(serialized).toBeUndefined();
    });

    it('ics.options.serialize returns undefined when customDelta is 1 and customInterval exists', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.ics.options.serialize(true, {
        date: { customDelta: 1, customInterval: 3 },
      });
      expect(serialized).toBeUndefined();
    });

    it('cht2.options.serialize returns undefined when not charting range', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const serialized = result.global.cht2.options.serialize(new Date(), {
        charting: { timeSpanSelection: 'single', timeSpanEndDate: new Date() },
      });
      expect(serialized).toBeUndefined();
    });

    it('s.options.parse returns coordinates as-is', () => {
      const result = getParamObject(parameters, config, models, legacyState, errors);
      const coords = [10, 20];
      expect(result.global.s.options.parse(coords)).toEqual(coords);
    });
  });
});

describe('additional parameter option coverage', () => {
  const config = {
    pageLoadTime: new Date('2020-01-01T00:00:00Z'),
    initialDate: new Date('2020-01-01T00:00:00Z'),
    features: {},
    parameters: {},
    initialIsMobile: false,
  };
  const parameters = {};
  const models = {};
  const legacyState = {};
  const errors = [];

  beforeEach(() => {
    jest.clearAllMocks();
    getInitialEventsState.mockReturnValue({
      active: false,
      showAll: true,
      showAllTracks: false,
      selectedDates: {},
      selectedCategories: [],
    });
    resetLayers.mockReturnValue([]);
    util.dateAdd.mockReturnValue(new Date('2019-12-25T00:00:00Z'));
  });

  it('z.options.serialize returns zoom string when zoom != 3 and no subdaily reset needed', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(false);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    // zoom <= 3, not > 3, so no reset branch, zoom=2 !== 3 so returns string
    expect(result.global.z.options.serialize(2, {})).toBe('2');
  });

  it('i.options.serialize resets interval to 3 when > 3 and no subdaily layers', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(false);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    // interval > 3, subdaily not active => reset to 3 => returns undefined
    expect(result.global.i.options.serialize(5, { date: {} })).toBeUndefined();
  });

  it('i.options.serialize returns interval string when > 3 and subdaily layers active', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(true);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.i.options.serialize(5, { date: {} })).toBe('5');
  });

  it('i.options.serialize returns interval string when interval != 3 and no subdaily reset', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(false);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.i.options.serialize(2, { date: {} })).toBe('2');
  });

  it('i.options.serialize uses customInterval when customSelected and customDelta=1', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(false);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    // customSelected=true, customDelta=1, customInterval=2 => interval=2, not >3, return '2'
    const state = { date: { customSelected: true, customDelta: 1, customInterval: 2 } };
    expect(result.global.i.options.serialize(5, state)).toBe('2');
  });

  it('ics.options.serialize returns currentItemState when customDelta != 1', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = { date: { customDelta: 2, customInterval: 3 } };
    expect(result.global.ics.options.serialize(true, state)).toBe(true);
  });

  it('ics.options.serialize returns undefined when customDelta=1 and customInterval exists', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = { date: { customDelta: 1, customInterval: 3 } };
    expect(result.global.ics.options.serialize(true, state)).toBeUndefined();
  });

  it('ici.options.serialize returns string when customSelected is true and no subdaily reset', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(false);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = { date: { customSelected: true } };
    expect(result.global.ici.options.serialize(2, state)).toBe('2');
  });

  it('ici.options.serialize resets customInterval to 3 when > 3 and no subdaily layers', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(false);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = { date: { customSelected: true } };
    // customInterval > 3, subdaily not active => reset to 3 => '3'
    expect(result.global.ici.options.serialize(5, state)).toBe('3');
  });

  it('ici.options.serialize keeps customInterval when > 3 and subdaily layers active', () => {
    const { subdailyLayersActive } = require('./modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(true);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = { date: { customSelected: true } };
    expect(result.global.ici.options.serialize(5, state)).toBe('5');
  });

  it('ici.options.parse converts string to number', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.ici.options.parse('4')).toBe(4);
  });

  it('icd.options.serialize returns string when customSelected is true', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = { date: { customSelected: true } };
    expect(result.global.icd.options.serialize(5, state)).toBe('5');
  });

  it('icd.options.parse converts string to number', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.icd.options.parse('3')).toBe(3);
  });

  it('as.options.serialize calls serializeDate when animation active', () => {
    const { serializeDate } = require('./modules/date/util');
    serializeDate.mockReturnValue('2020-01-01');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const date = new Date('2020-01-01T00:00:00Z');
    const serialized = result.global.as.options.serialize(date, { animation: { isActive: true } });
    expect(serializeDate).toHaveBeenCalled();
    expect(serialized).toBe('2020-01-01');
  });

  it('as.options.serialize uses nowMinusSevenDays fallback when currentItemState is falsy', () => {
    const { serializeDate } = require('./modules/date/util');
    serializeDate.mockReturnValue('2019-12-25');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.as.options.serialize(null, { animation: { isActive: true } });
    expect(serializeDate).toHaveBeenCalledWith(new Date('2019-12-25T00:00:00Z'));
    expect(serialized).toBe('2019-12-25');
  });

  it('as.options.parse calls tryCatchDate', () => {
    const { tryCatchDate } = require('./modules/date/util');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.as.options.parse('2020-01-01');
    expect(tryCatchDate).toHaveBeenCalled();
  });

  it('ae.options.serialize calls serializeDate when animation active', () => {
    const { serializeDate } = require('./modules/date/util');
    serializeDate.mockReturnValue('2020-01-01');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const date = new Date('2020-01-01T00:00:00Z');
    const serialized = result.global.ae.options.serialize(date, { animation: { isActive: true } });
    expect(serializeDate).toHaveBeenCalled();
    expect(serialized).toBe('2020-01-01');
  });

  it('ae.options.serialize uses now fallback when currentItemState is falsy', () => {
    const { serializeDate } = require('./modules/date/util');
    serializeDate.mockReturnValue('2020-01-01');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.ae.options.serialize(null, { animation: { isActive: true } });
    expect(serializeDate).toHaveBeenCalledWith(config.pageLoadTime);
  });

  it('ae.options.parse calls tryCatchDate', () => {
    const { tryCatchDate } = require('./modules/date/util');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.ae.options.parse('2020-01-01');
    expect(tryCatchDate).toHaveBeenCalled();
  });

  it('df.options.serialize returns value when distraction free mode active', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.df.options.serialize(true, {
      ui: { isDistractionFreeModeActive: true },
    });
    expect(serialized).toBe(true);
  });

  it('kiosk.options.serialize returns value when kiosk mode active', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.kiosk.options.serialize(true, {
      ui: { isKioskModeActive: true },
    });
    expect(serialized).toBe(true);
  });

  it('e2e.options.serialize returns value when e2e mode active', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.e2e.options.serialize(true, { ui: { isE2eModeActive: true } });
    expect(serialized).toBe(true);
  });

  it('al.options.serialize returns value when animation active', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.al.options.serialize(true, { animation: { isActive: true } });
    expect(serialized).toBe(true);
  });

  it('av.options.serialize returns value when animation active', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.av.options.serialize(5, { animation: { isActive: true } });
    expect(serialized).toBe(5);
  });

  it('efa.options.serialize returns value when events active', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.efa.options.serialize(true, { events: { active: true } });
    expect(serialized).toBe(true);
  });

  it('efd.options.parse calls parseEventFilterDates', () => {
    const { parseEventFilterDates } = require('./modules/natural-events/util');
    parseEventFilterDates.mockReturnValue({ start: '2020-01-01' });
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.efd.options.parse('2020-01-01,2020-01-07');
    expect(parseEventFilterDates).toHaveBeenCalled();
  });

  it('efd.options.serialize calls serializeEventFilterDates', () => {
    const { serializeEventFilterDates } = require('./modules/natural-events/util');
    serializeEventFilterDates.mockReturnValue('2020-01-01,2020-01-07');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.efd.options.serialize({ start: '2020-01-01' }, {});
    expect(serializeEventFilterDates).toHaveBeenCalled();
  });

  it('efc.options.serialize calls serializeCategories', () => {
    const { serializeCategories } = require('./modules/natural-events/util');
    serializeCategories.mockReturnValue('dustHaze');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.efc.options.serialize(['dustHaze'], {});
    expect(serializeCategories).toHaveBeenCalled();
  });

  it('l.options.parse calls layersParse12', () => {
    const { layersParse12 } = require('./modules/layers/util');
    layersParse12.mockReturnValue([]);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.l.options.parse('MODIS_Terra_CorrectedReflectance_TrueColor');
    expect(layersParse12).toHaveBeenCalled();
  });

  it('l.options.serialize uses activeB layers when not compareA and compare not active', () => {
    const { serializeLayers } = require('./modules/layers/util');
    serializeLayers.mockReturnValue('serialized-b');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = {
      compare: { active: false, isCompareA: false },
      layers: { activeB: { layers: ['layerB'] } },
    };
    const serialized = result.global.l.options.serialize([], state);
    expect(serializeLayers).toHaveBeenCalledWith(['layerB'], state, 'activeB');
    expect(serialized).toBe('serialized-b');
  });

  it('l.options.serialize uses active layers when isCompareA is true', () => {
    const { serializeLayers } = require('./modules/layers/util');
    serializeLayers.mockReturnValue('serialized-active');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const currentLayers = ['layerA'];
    const state = { compare: { active: false, isCompareA: true } };
    const serialized = result.global.l.options.serialize(currentLayers, state);
    expect(serializeLayers).toHaveBeenCalledWith(currentLayers, state, 'active');
    expect(serialized).toBe('serialized-active');
  });

  it('l.options.serialize uses active layers when compare is active', () => {
    const { serializeLayers } = require('./modules/layers/util');
    serializeLayers.mockReturnValue('serialized-compare');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const currentLayers = ['layerA'];
    const state = { compare: { active: true, isCompareA: false } };
    result.global.l.options.serialize(currentLayers, state);
    expect(serializeLayers).toHaveBeenCalledWith(currentLayers, state, 'active');
  });

  it('lg.options.serialize calls serializeGroupOverlays', () => {
    const { serializeGroupOverlays } = require('./modules/layers/util');
    serializeGroupOverlays.mockReturnValue(true);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.lg.options.serialize(true, {});
    expect(serializeGroupOverlays).toHaveBeenCalledWith(true, {}, 'active');
  });

  it('lg1.options.serialize calls serializeGroupOverlays when compare active', () => {
    const { serializeGroupOverlays } = require('./modules/layers/util');
    serializeGroupOverlays.mockReturnValue(true);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const serialized = result.global.lg1.options.serialize(true, { compare: { active: true } });
    expect(serializeGroupOverlays).toHaveBeenCalledWith(true, { compare: { active: true } }, 'activeB');
    expect(serialized).toBe(true);
  });

  it('l1.options.parse calls layersParse12', () => {
    const { layersParse12 } = require('./modules/layers/util');
    layersParse12.mockReturnValue([]);
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.l1.options.parse('MODIS_Terra_CorrectedReflectance_TrueColor');
    expect(layersParse12).toHaveBeenCalled();
  });

  it('l1.options.serialize calls serializeLayers when compare active', () => {
    const { serializeLayers } = require('./modules/layers/util');
    serializeLayers.mockReturnValue('serialized-b');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const currentBLayers = ['layerB'];
    const state = { compare: { active: true } };
    const serialized = result.global.l1.options.serialize(currentBLayers, state);
    expect(serializeLayers).toHaveBeenCalledWith(currentBLayers, state, 'activeB');
    expect(serialized).toBe('serialized-b');
  });

  it('sh.options.serialize calls serializeSmartHandoff', () => {
    const { serializeSmartHandoff } = require('./modules/smart-handoff/util');
    serializeSmartHandoff.mockReturnValue('sh-value');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.sh.options.serialize('sh-value', {});
    expect(serializeSmartHandoff).toHaveBeenCalled();
  });

  it('sh.options.parse calls parseSmartHandoff', () => {
    const { parseSmartHandoff } = require('./modules/smart-handoff/util');
    parseSmartHandoff.mockReturnValue({});
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.sh.options.parse('sh-value');
    expect(parseSmartHandoff).toHaveBeenCalled();
  });

  it('s.options.serialize calls serializeCoordinatesWrapper', () => {
    const { serializeCoordinatesWrapper } = require('./modules/location-search/util');
    serializeCoordinatesWrapper.mockReturnValue('10,20');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.s.options.serialize([10, 20], {});
    expect(serializeCoordinatesWrapper).toHaveBeenCalled();
  });

  it('t.options.serialize calls serializeDateWrapper', () => {
    const { serializeDateWrapper } = require('./modules/date/util');
    serializeDateWrapper.mockReturnValue('2020-01-01');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.t.options.serialize(new Date('2020-01-01'), {});
    expect(serializeDateWrapper).toHaveBeenCalled();
  });

  it('t.options.parse calls parsePermalinkDate', () => {
    const { parsePermalinkDate } = require('./modules/date/util');
    parsePermalinkDate.mockReturnValue(new Date('2020-01-01'));
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.t.options.parse('2020-01-01');
    expect(parsePermalinkDate).toHaveBeenCalled();
  });

  it('t1.options.serialize calls serializeDateBWrapper', () => {
    const { serializeDateBWrapper } = require('./modules/date/util');
    serializeDateBWrapper.mockReturnValue('2019-12-25');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.t1.options.serialize(new Date('2019-12-25'), {});
    expect(serializeDateBWrapper).toHaveBeenCalled();
  });

  it('t1.options.parse calls parsePermalinkDate', () => {
    const { parsePermalinkDate } = require('./modules/date/util');
    parsePermalinkDate.mockReturnValue(new Date('2019-12-25'));
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.t1.options.parse('2019-12-25');
    expect(parsePermalinkDate).toHaveBeenCalled();
  });

  it('cht.options.serialize calls serializeDateChartingWrapper', () => {
    const { serializeDateChartingWrapper } = require('./modules/date/util');
    serializeDateChartingWrapper.mockReturnValue('2020-01-01');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.cht.options.serialize(new Date('2020-01-01'), {});
    expect(serializeDateChartingWrapper).toHaveBeenCalled();
  });

  it('cht.options.parse calls parsePermalinkDate', () => {
    const { parsePermalinkDate } = require('./modules/date/util');
    parsePermalinkDate.mockReturnValue(new Date('2020-01-01'));
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.cht.options.parse('2020-01-01');
    expect(parsePermalinkDate).toHaveBeenCalled();
  });

  it('cht2.options.serialize calls serializeDateChartingWrapper when charting range and endDate exist', () => {
    const { serializeDateChartingWrapper } = require('./modules/date/util');
    serializeDateChartingWrapper.mockReturnValue('2020-01-07');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    const state = {
      charting: {
        timeSpanSelection: 'range',
        timeSpanEndDate: new Date('2020-01-07'),
      },
    };
    const serialized = result.global.cht2.options.serialize(new Date('2020-01-07'), state);
    expect(serializeDateChartingWrapper).toHaveBeenCalled();
    expect(serialized).toBe('2020-01-07');
  });

  it('cht2.options.parse calls parsePermalinkDate', () => {
    const { parsePermalinkDate } = require('./modules/date/util');
    parsePermalinkDate.mockReturnValue(new Date('2020-01-07'));
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.cht2.options.parse('2020-01-07');
    expect(parsePermalinkDate).toHaveBeenCalled();
  });

  it('e.options.parse calls parseEvent', () => {
    const { parseEvent } = require('./modules/natural-events/util');
    parseEvent.mockReturnValue({});
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.e.options.parse('EONET_1');
    expect(parseEvent).toHaveBeenCalled();
  });

  it('e.options.serialize calls serializeEvent', () => {
    const { serializeEvent } = require('./modules/natural-events/util');
    serializeEvent.mockReturnValue('EONET_1');
    const result = getParamObject(parameters, config, models, legacyState, errors);
    result.global.e.options.serialize({}, {});
    expect(serializeEvent).toHaveBeenCalled();
  });

  it('abt.options.parse returns true when str is "on"', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.abt.options.parse('on')).toBe(true);
  });

  it('abt.options.parse returns false when str is not "on"', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.global.abt.options.parse('off')).toBe(false);
  });

  it('RLSCONFIG.queryParser returns null for empty string', () => {
    const result = getParamObject(parameters, config, models, legacyState, errors);
    expect(result.RLSCONFIG.queryParser('')).toBeNull();
  });
});
