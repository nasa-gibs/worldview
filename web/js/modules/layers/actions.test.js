import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import fixtures from '../../fixtures';
import {
  removeLayer,
  removeGroup,
  toggleOverlayGroups,
  reorderLayers,
  reorderOverlayGroups,
  toggleVisibility,
  toggleGroupVisibility,
  toggleGroupCollapsed,
  setOpacity,
  hideLayers,
  showLayers,
  addLayer as addLayerAction,
  initSecondLayerGroup,
  syncSecondLayerGroup,
  addTEMPODateRanges,
  addGranuleDateRanges,
  updateCollection,
  activateLayersForEventCategory,
  updateGranuleLayerState,
  updateGranuleLayerOptions,
  resetGranuleLayerDates,
  changeGranuleSatelliteInstrumentGroup,
  updateBandCombination,
} from './actions';
import * as LAYER_CONSTANTS from './constants';
import { getOverlayGroups, getLayersFromGroups } from './util';
import {
  addLayer,
  activateLayersForEventCategory as activateLayersForEventCategorySelector,
  findEventLayers,
  getLayers,
  getGranuleLayer,
} from './selectors';
import { getGranuleFootprints } from '../../map/granule/util';

jest.mock('./selectors', () => ({
  ...jest.requireActual('./selectors'),
  activateLayersForEventCategory: jest.fn(),
  findEventLayers: jest.fn(),
  getGranuleLayer: jest.fn(),
}));

jest.mock('./util', () => ({
  ...jest.requireActual('./util'),
  getOverlayGroups: jest.fn(),
  getLayersFromGroups: jest.fn(),
}));

jest.mock('../../map/granule/util', () => ({
  getGranuleFootprints: jest.fn(),
}));

const mockStore = configureMockStore([thunk]);
const config = fixtures.config();

function getState(layers, overrides = {}) {
  return {
    config,
    proj: { id: 'geographic', selected: config.projections.geographic },
    layers: {
      active: {
        prevLayers: [],
        groupOverlays: true,
        layers,
        overlayGroups: [
          {
            groupName: 'AOD',
            layers: ['aqua-aod', 'terra-aod'],
            collapsed: false,
          },
        ],
        granuleFootprints: {},
        granuleLayers: {},
        granulePlatform: '',
      },
      activeB: {
        layers,
        granuleLayers: {},
      },
      granuleFootprints: {},
      layerConfig: config.layers,
    },
    compare: {
      activeString: 'active',
      active: false,
      ...overrides.compare,
    },
    ...overrides,
  };
}

function addMockLayer(layerId, layerArray) {
  return addLayer(
    layerId,
    layerArray,
    config.layers,
    {},
    getLayers(getState(layerArray), { group: 'all' }, layerArray).overlays.length,
  );
}

describe('Layer actions', () => {
  let layers;
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    layers = [];
    layers = addLayer('terra-cr', [], config.layers, {}, 0);
    layers = addMockLayer('aqua-cr', layers);
    layers = addMockLayer('terra-aod', layers);
    layers = addMockLayer('aqua-aod', layers);
    store = mockStore(getState(layers));
  });

  test('initSecondLayerGroup returns correct action object [layers-action-init-second-group]', () => {
    const action = initSecondLayerGroup();
    expect(action).toEqual({ type: LAYER_CONSTANTS.INIT_SECOND_LAYER_GROUP });
  });

  test('syncSecondLayerGroup returns correct action object [layers-action-sync-second-group]', () => {
    const ids = ['terra-cr', 'aqua-cr'];
    const action = syncSecondLayerGroup(ids);
    expect(action).toEqual({
      type: LAYER_CONSTANTS.SYNC_SECOND_LAYER_GROUP,
      lastExitALayerIds: ids,
    });
  });

  test('updateCollection returns correct action object [layers-action-update-collection]', () => {
    const collection = { id: 'C1234', title: 'Test Collection' };
    const action = updateCollection(collection);
    expect(action).toEqual({
      type: LAYER_CONSTANTS.UPDATE_COLLECTION,
      payload: collection,
    });
  });

  test('REMOVE_LAYER removes layer by id [layers-action-remove-layer-by-id]', () => {
    const def = layers[0];
    store.dispatch(removeLayer('aqua-aod'));
    const actionResponse = store.getActions()[0];
    expect(actionResponse).toEqual({
      type: LAYER_CONSTANTS.REMOVE_LAYER,
      activeString: 'active',
      layersToRemove: [def],
      layers: [layers[1], layers[2], layers[3]],
      granuleLayers: {},
    });
  });

  test('REMOVE_LAYER does nothing on non-existent id [layers-action-remove-layer-no-id]', () => {
    store.dispatch(removeLayer('INVALID TEST LAYER ID'));
    expect(store.getActions()[0]).toBeUndefined();
  });

  test('REMOVE_GROUP removes each layer in group [layers-action-remove-group]', () => {
    store.dispatch(removeGroup(['terra-aod', 'aqua-aod']));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.REMOVE_GROUP,
      activeString: 'active',
      layersToRemove: [layers[0], layers[1]],
      layers: [layers[2], layers[3]],
      granuleLayers: {},
    });
  });

  test('REORDER_LAYERS dispatches correct action [layers-action-reorder-layers]', () => {
    const reordered = [layers[3], layers[2], layers[1], layers[0]];
    store.dispatch(reorderLayers(reordered));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.REORDER_LAYERS,
      activeString: 'active',
      layers: reordered,
    });
  });

  test('REORDER_OVERLAY_GROUPS dispatches correct action [layers-action-reorder-overlay-groups]', () => {
    const groups = [{ groupName: 'AOD', layers: ['aqua-aod', 'terra-aod'], collapsed: false }];
    store.dispatch(reorderOverlayGroups(layers, groups));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.REORDER_OVERLAY_GROUPS,
      activeString: 'active',
      layers,
      overlayGroups: groups,
    });
  });

  test('TOGGLE_LAYER_VISIBILITY dispatches correct action [layers-action-toggle-visibility]', () => {
    store.dispatch(toggleVisibility('aqua-aod', false));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.TOGGLE_LAYER_VISIBILITY,
      id: 'aqua-aod',
      visible: false,
      activeString: 'active',
    });
  });

  test('TOGGLE_LAYER_VISIBILITY dispatches correct action when setting visible true [layers-action-toggle-visibility-true]', () => {
    store.dispatch(toggleVisibility('terra-cr', true));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.TOGGLE_LAYER_VISIBILITY,
      id: 'terra-cr',
      visible: true,
      activeString: 'active',
    });
  });

  test('TOGGLE_OVERLAY_GROUP_VISIBILITY dispatches correct action [layers-action-toggle-group-visibility]', () => {
    store.dispatch(toggleGroupVisibility(['aqua-aod', 'terra-aod'], false));
    const actionResponse = store.getActions()[0];
    expect(actionResponse.type).toBe(LAYER_CONSTANTS.TOGGLE_OVERLAY_GROUP_VISIBILITY);
    expect(actionResponse.activeString).toBe('active');
    const updatedAqua = actionResponse.layers.find((l) => l.id === 'aqua-aod');
    const updatedTerra = actionResponse.layers.find((l) => l.id === 'terra-aod');
    expect(updatedAqua.visible).toBe(false);
    expect(updatedTerra.visible).toBe(false);
  });

  test('TOGGLE_OVERLAY_GROUP_VISIBILITY only modifies layers in the given ids [layers-action-toggle-group-visibility-partial]', () => {
    store.dispatch(toggleGroupVisibility(['aqua-aod'], true));
    const actionResponse = store.getActions()[0];
    const untouched = actionResponse.layers.find((l) => l.id === 'terra-aod');
    expect(untouched.visible).toBe(true);
  });

  test('TOGGLE_COLLAPSE_OVERLAY_GROUP dispatches correct action [layers-action-toggle-group-collapsed]', () => {
    store.dispatch(toggleGroupCollapsed('AOD', true));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.TOGGLE_COLLAPSE_OVERLAY_GROUP,
      groupName: 'AOD',
      activeString: 'active',
      collapsed: true,
    });
  });

  test('TOGGLE_COLLAPSE_OVERLAY_GROUP dispatches correct action when expanding [layers-action-toggle-group-collapsed-false]', () => {
    store.dispatch(toggleGroupCollapsed('AOD', false));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.TOGGLE_COLLAPSE_OVERLAY_GROUP,
      groupName: 'AOD',
      activeString: 'active',
      collapsed: false,
    });
  });

  test('UPDATE_OPACITY dispatches correct action [layers-action-set-opacity]', () => {
    store.dispatch(setOpacity('aqua-aod', 0.5));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.UPDATE_OPACITY,
      id: 'aqua-aod',
      opacity: 0.5,
      activeString: 'active',
    });
  });

  test('setOpacity coerces opacity to number [layers-action-set-opacity-coerce]', () => {
    store.dispatch(setOpacity('aqua-aod', '0.3'));
    expect(store.getActions()[0].opacity).toBe(0.3);
  });

  test('setOpacity does nothing on non-existent id [layers-action-set-opacity-no-id]', () => {
    store.dispatch(setOpacity('INVALID LAYER ID', 0.5));
    expect(store.getActions()[0]).toBeUndefined();
  });

  test('hideLayers dispatches TOGGLE_LAYER_VISIBILITY false for each layer [layers-action-hide-layers]', () => {
    store.dispatch(hideLayers([layers[0], layers[1]]));
    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe(LAYER_CONSTANTS.TOGGLE_LAYER_VISIBILITY);
    expect(actions[0].visible).toBe(false);
    expect(actions[1].visible).toBe(false);
  });

  test('hideLayers sets the correct layer ids [layers-action-hide-layers-ids]', () => {
    store.dispatch(hideLayers([layers[0], layers[1]]));
    const actions = store.getActions();
    expect(actions[0].id).toBe(layers[0].id);
    expect(actions[1].id).toBe(layers[1].id);
  });

  test('showLayers dispatches TOGGLE_LAYER_VISIBILITY true for each layer [layers-action-show-layers]', () => {
    store.dispatch(showLayers([layers[0], layers[1]]));
    const actions = store.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe(LAYER_CONSTANTS.TOGGLE_LAYER_VISIBILITY);
    expect(actions[0].visible).toBe(true);
    expect(actions[1].visible).toBe(true);
  });

  test('showLayers sets the correct layer ids [layers-action-show-layers-ids]', () => {
    store.dispatch(showLayers([layers[0], layers[1]]));
    const actions = store.getActions();
    expect(actions[0].id).toBe(layers[0].id);
    expect(actions[1].id).toBe(layers[1].id);
  });

  test('ADD_LAYER dispatches correct action [layers-action-add-layer]', () => {
    store.dispatch(addLayerAction('terra-cr'));
    const actionResponse = store.getActions()[0];
    expect(actionResponse.type).toBe(LAYER_CONSTANTS.ADD_LAYER);
    expect(actionResponse.id).toBe('terra-cr');
    expect(actionResponse.activeString).toBe('active');
  });

  test('ADD_LAYER dispatches with a layers array [layers-action-add-layer-has-layers]', () => {
    store.dispatch(addLayerAction('terra-cr'));
    const actionResponse = store.getActions()[0];
    expect(Array.isArray(actionResponse.layers)).toBe(true);
  });

  test('TOGGLE_OVERLAY_GROUPS when grouped uses getLayersFromGroups when prevLayers is empty [layers-action-toggle-group]', () => {
    getLayersFromGroups.mockReturnValue(layers);
    store.dispatch(toggleOverlayGroups());
    const actionResponse = store.getActions()[0];
    expect(actionResponse).toEqual({
      type: LAYER_CONSTANTS.TOGGLE_OVERLAY_GROUPS,
      activeString: 'active',
      groupOverlays: false,
      layers,
      overlayGroups: [],
    });
  });

  test('TOGGLE_OVERLAY_GROUPS when grouped uses prevLayers when non-empty [layers-action-toggle-group-prev-layers]', () => {
    const prevLayerState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          groupOverlays: true,
          prevLayers: layers,
        },
      },
    };
    const prevLayerStore = mockStore(prevLayerState);
    prevLayerStore.dispatch(toggleOverlayGroups());
    const actionResponse = prevLayerStore.getActions()[0];
    expect(actionResponse.type).toBe(LAYER_CONSTANTS.TOGGLE_OVERLAY_GROUPS);
    expect(actionResponse.groupOverlays).toBe(false);
    expect(actionResponse.layers).toEqual(layers);
  });

  test('TOGGLE_OVERLAY_GROUPS when ungrouped re-groups layers [layers-action-toggle-group-enable]', () => {
    const regroupedLayers = [layers[0], layers[1]];
    const groups = [{ groupName: 'AOD', layers: ['aqua-aod', 'terra-aod'], collapsed: false }];
    getOverlayGroups.mockReturnValue(groups);
    getLayersFromGroups.mockReturnValue(regroupedLayers);
    const ungroupedState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          groupOverlays: false,
          prevLayers: [],
          overlayGroups: [],
        },
      },
    };
    const ungroupedStore = mockStore(ungroupedState);
    ungroupedStore.dispatch(toggleOverlayGroups());
    const actionResponse = ungroupedStore.getActions()[0];
    expect(actionResponse.type).toBe(LAYER_CONSTANTS.TOGGLE_OVERLAY_GROUPS);
    expect(actionResponse.groupOverlays).toBe(true);
    expect(actionResponse.layers).toEqual(regroupedLayers);
    expect(actionResponse.overlayGroups).toEqual(groups);
    expect(actionResponse.prevLayers).toEqual(layers);
  });

  test('activateLayersForEventCategory dispatches ADD_LAYERS_FOR_EVENT [layers-action-activate-layers-for-event-category]', () => {
    const originalLayer = { id: 'terra-cr', group: 'baselayers' };
    const eventLayer = { id: 'MODIS_Terra_Thermal_Anomalies_All', group: 'overlays', eventLayer: true };
    activateLayersForEventCategorySelector.mockReturnValue([originalLayer, eventLayer]);
    findEventLayers.mockReturnValue([eventLayer]);
    getOverlayGroups.mockReturnValue([]);
    store.dispatch(activateLayersForEventCategory('fires'));
    const [action] = store.getActions();
    expect(action.type).toBe(LAYER_CONSTANTS.ADD_LAYERS_FOR_EVENT);
    expect(action.activeString).toBe('active');
    expect(action.layers).toEqual([originalLayer, eventLayer]);
    expect(action.eventLayers).toEqual([eventLayer]);
  });

  test('activateLayersForEventCategory sets overlayGroups collapsed true [layers-action-activate-layers-for-event-category-collapsed]', () => {
    const eventLayer = { id: 'MODIS_Terra_Thermal_Anomalies_All', group: 'overlays', eventLayer: true };
    const group = { groupName: 'Fires', layers: [eventLayer.id], collapsed: false };
    activateLayersForEventCategorySelector.mockReturnValue([eventLayer]);
    findEventLayers.mockReturnValue([eventLayer]);
    getOverlayGroups.mockReturnValue([group]);
    store.dispatch(activateLayersForEventCategory('fires'));
    const [action] = store.getActions();
    expect(action.overlayGroups[0].collapsed).toBe(true);
  });

  test('ADD_TEMPO_DATE_RANGES dispatches correct action [layers-action-add-tempo-date-ranges]', () => {
    const layer = { id: 'TEMPO_NO2' };
    const ranges = [['2021-01-01', '2021-01-02']];
    store.dispatch(addTEMPODateRanges(layer, ranges, 'active'));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.ADD_TEMPO_DATE_RANGES,
      activeString: 'active',
      id: 'TEMPO_NO2',
      tempoDateRanges: ranges,
    });
  });

  test('ADD_TEMPO_DATE_RANGES dispatches with activeB string [layers-action-add-tempo-date-ranges-active-b]', () => {
    const layer = { id: 'TEMPO_NO2' };
    const ranges = [['2021-01-01', '2021-01-02']];
    store.dispatch(addTEMPODateRanges(layer, ranges, 'activeB'));
    expect(store.getActions()[0].activeString).toBe('activeB');
  });

  test('addGranuleDateRanges dispatches ADD_GRANULE_DATE_RANGES for active side [layers-action-add-granule-date-ranges]', () => {
    const layerWithGranule = { ...layers[0], granuleDateRanges: null };
    const stateWithGranule = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          layers: [layerWithGranule, ...layers.slice(1)],
        },
        activeB: {
          layers: [layerWithGranule, ...layers.slice(1)],
          granuleLayers: {},
        },
      },
    };
    const granuleStore = mockStore(stateWithGranule);
    const ranges = [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z']];
    granuleStore.dispatch(addGranuleDateRanges({ id: layerWithGranule.id }, ranges));
    const actions = granuleStore.getActions();
    expect(actions[0].type).toBe(LAYER_CONSTANTS.ADD_GRANULE_DATE_RANGES);
    expect(actions[0].id).toBe(layerWithGranule.id);
    expect(actions[0].activeString).toBe('active');
    expect(actions[0].granuleDateRanges).toEqual(ranges);
  });

  test('addGranuleDateRanges skips dispatch when layer not found [layers-action-add-granule-date-ranges-no-layer]', () => {
    store.dispatch(addGranuleDateRanges({ id: 'NONEXISTENT_LAYER' }, []));
    expect(store.getActions()).toHaveLength(0);
  });

  test('addGranuleDateRanges skips dispatch when ranges are equal [layers-action-add-granule-date-ranges-dedup]', () => {
    const ranges = [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z']];
    const layerWithRanges = { ...layers[0], granuleDateRanges: ranges };
    const stateWithRanges = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          layers: [layerWithRanges, ...layers.slice(1)],
        },
      },
    };
    const dedupStore = mockStore(stateWithRanges);
    dedupStore.dispatch(addGranuleDateRanges({ id: layerWithRanges.id }, ranges));
    expect(dedupStore.getActions()).toHaveLength(0);
  });

  test('addGranuleDateRanges syncs to activeB in compare mode [layers-action-add-granule-date-ranges-compare]', () => {
    const ranges = [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z']];
    const layerWithGranule = { ...layers[0], granuleDateRanges: null };
    const compareState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          layers: [layerWithGranule, ...layers.slice(1)],
        },
        activeB: {
          layers: [layerWithGranule, ...layers.slice(1)],
          granuleLayers: {},
        },
      },
      compare: { activeString: 'active', active: true },
    };
    const compareStore = mockStore(compareState);
    compareStore.dispatch(addGranuleDateRanges({ id: layerWithGranule.id }, ranges));
    const actions = compareStore.getActions();
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[0].activeString).toBe('active');
    expect(actions[1].activeString).toBe('activeB');
  });

  test('addGranuleDateRanges syncs from activeB to active in compare mode [layers-action-add-granule-date-ranges-compare-b-side]', () => {
    const ranges = [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z']];
    const layerWithGranule = { ...layers[0], granuleDateRanges: null };
    const compareState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          layers: [layerWithGranule, ...layers.slice(1)],
        },
        activeB: {
          layers: [layerWithGranule, ...layers.slice(1)],
          granuleLayers: {},
        },
      },
      compare: { activeString: 'activeB', active: true },
    };
    const compareStore = mockStore(compareState);
    compareStore.dispatch(addGranuleDateRanges({ id: layerWithGranule.id }, ranges));
    const actions = compareStore.getActions();
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[0].activeString).toBe('activeB');
    expect(actions[1].activeString).toBe('active');
  });

  test('addGranuleDateRanges skips other side when layer absent from it [layers-action-add-granule-date-ranges-missing-side]', () => {
    const ranges = [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z']];
    const layerWithGranule = { ...layers[0], granuleDateRanges: null };
    const compareState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          layers: [layerWithGranule, ...layers.slice(1)],
        },
        activeB: {
          layers: layers.slice(1),
          granuleLayers: {},
        },
      },
      compare: { activeString: 'active', active: true },
    };
    const compareStore = mockStore(compareState);
    compareStore.dispatch(addGranuleDateRanges({ id: layerWithGranule.id }, ranges));
    expect(compareStore.getActions()).toHaveLength(1);
    expect(compareStore.getActions()[0].activeString).toBe('active');
  });

  test('RESET_GRANULE_LAYER_OPTIONS dispatches correct action [layers-action-reset-granule-layer-dates]', () => {
    store.dispatch(resetGranuleLayerDates('aqua-aod'));
    expect(store.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.RESET_GRANULE_LAYER_OPTIONS,
      id: 'aqua-aod',
      activeKey: 'active',
    });
  });

  test('CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP dispatches correct action [layers-action-change-granule-satellite-group]', () => {
    const mockGeometry = { type: 'FeatureCollection', features: [] };
    const granuleState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          granuleLayers: { 'aqua-aod': { geometry: mockGeometry } },
        },
      },
    };
    getGranuleLayer.mockReturnValue({ geometry: mockGeometry });
    const granuleStore = mockStore(granuleState);
    granuleStore.dispatch(changeGranuleSatelliteInstrumentGroup('aqua-aod', 'Aqua / MODIS'));
    expect(granuleStore.getActions()[0]).toEqual({
      type: LAYER_CONSTANTS.CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP,
      granulePlatform: 'Aqua / MODIS',
      geometry: mockGeometry,
      activeKey: 'active',
    });
  });

  test('UPDATE_GRANULE_LAYER_OPTIONS dispatches for each matching platform layer [layers-action-update-granule-layer-options]', () => {
    const dates = ['2021-01-01', '2021-01-02'];
    const def = { subtitle: 'Aqua / MODIS' };
    const count = 20;
    const granuleState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          granuleLayers: { 'aqua-aod': { count, dates, granulePlatform: 'Aqua / MODIS' } },
          granulePlatform: 'Aqua / MODIS',
        },
      },
    };
    const granuleStore = mockStore(granuleState);
    granuleStore.dispatch(updateGranuleLayerOptions(dates, def, count));
    const actions = granuleStore.getActions();
    expect(actions.length).toBeGreaterThanOrEqual(1);
    actions.forEach((action) => {
      expect(action.type).toBe(LAYER_CONSTANTS.UPDATE_GRANULE_LAYER_OPTIONS);
      expect(action.dates).toEqual(dates);
      expect(action.count).toBe(count);
      expect(action.activeKey).toBe('active');
    });
  });

  test('UPDATE_GRANULE_LAYER_OPTIONS dispatches no actions when no matching platform layers [layers-action-update-granule-layer-options-no-match]', () => {
    const granuleState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: {
          ...getState(layers).layers.active,
          granuleLayers: {},
          granulePlatform: 'Aqua / MODIS',
        },
      },
    };
    const granuleStore = mockStore(granuleState);
    granuleStore.dispatch(updateGranuleLayerOptions(['2021-01-01'], { subtitle: 'Terra / MODIS' }, 10));
    expect(granuleStore.getActions()).toHaveLength(0);
  });

  test('updateGranuleLayerState dispatches only ADD_GRANULE_LAYER_DATES when no existing layer [layers-action-update-granule-layer-state-new]', () => {
    const granuleDates = ['2021-01-03T00:00:00Z', '2021-01-02T00:00:00Z'];
    const mockFootprints = { type: 'FeatureCollection', features: [] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 20,
        granuleDates,
        reorderedGranules: null,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    getGranuleFootprints.mockReturnValue(mockFootprints);
    getGranuleLayer.mockReturnValue(null);
    store.dispatch(updateGranuleLayerState(mockLayer));
    const actions = store.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({
      type: LAYER_CONSTANTS.ADD_GRANULE_LAYER_DATES,
      id: 'aqua-aod',
      activeKey: 'active',
      dates: granuleDates,
      granuleFootprints: mockFootprints,
      granulePlatform: 'Aqua / MODIS',
      count: 20,
    });
  });

  test('updateGranuleLayerState dispatches UPDATE_GRANULE_LAYER_GEOMETRY and ADD_GRANULE_LAYER_DATES when layer exists [layers-action-update-granule-layer-state-existing]', () => {
    const granuleDates = ['2021-01-03T00:00:00Z'];
    const mockFootprints = { type: 'FeatureCollection', features: [] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 20,
        granuleDates,
        reorderedGranules: null,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    const existingState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: { ...getState(layers).layers.active, granulePlatform: 'Aqua / MODIS' },
        granuleFootprints: mockFootprints,
      },
    };
    getGranuleFootprints.mockReturnValue(mockFootprints);
    getGranuleLayer.mockReturnValue({ id: 'aqua-aod' });
    const existingStore = mockStore(existingState);
    existingStore.dispatch(updateGranuleLayerState(mockLayer));
    const actions = existingStore.getActions();
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe(LAYER_CONSTANTS.UPDATE_GRANULE_LAYER_GEOMETRY);
    expect(actions[1].type).toBe(LAYER_CONSTANTS.ADD_GRANULE_LAYER_DATES);
  });

  test('updateGranuleLayerState uses reorderedGranules when provided [layers-action-update-granule-layer-state-reordered]', () => {
    const granuleDates = ['2021-01-03T00:00:00Z', '2021-01-01T00:00:00Z'];
    const reorderedGranules = ['2021-01-01T00:00:00Z', '2021-01-03T00:00:00Z'];
    const mockFootprints = { type: 'FeatureCollection', features: [] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 20,
        granuleDates,
        reorderedGranules,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    getGranuleFootprints.mockReturnValue(mockFootprints);
    getGranuleLayer.mockReturnValue({ id: 'aqua-aod' });
    const existingState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: { ...getState(layers).layers.active, granulePlatform: 'Aqua / MODIS' },
        granuleFootprints: mockFootprints,
      },
    };
    const existingStore = mockStore(existingState);
    existingStore.dispatch(updateGranuleLayerState(mockLayer));
    const geometryAction = existingStore.getActions().find(
      (a) => a.type === LAYER_CONSTANTS.UPDATE_GRANULE_LAYER_GEOMETRY,
    );
    expect(geometryAction.dates).toEqual(reorderedGranules);
  });

  test('updateGranuleLayerState sets dates to empty array when most recent date is out of range [layers-action-update-granule-layer-state-out-of-range]', () => {
    const granuleDates = ['2031-01-01T00:00:00Z', '2021-01-01T00:00:00Z'];
    const mockFootprints = { type: 'FeatureCollection', features: [] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 20,
        granuleDates,
        reorderedGranules: null,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    const existingState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: { ...getState(layers).layers.active, granulePlatform: 'Aqua / MODIS' },
        granuleFootprints: mockFootprints,
      },
    };
    getGranuleFootprints.mockReturnValue(mockFootprints);
    getGranuleLayer.mockReturnValue({ id: 'aqua-aod' });
    const outOfRangeStore = mockStore(existingState);
    outOfRangeStore.dispatch(updateGranuleLayerState(mockLayer));
    const geometryAction = outOfRangeStore.getActions().find(
      (a) => a.type === LAYER_CONSTANTS.UPDATE_GRANULE_LAYER_GEOMETRY,
    );
    expect(geometryAction.dates).toEqual([]);
  });

  test('updateGranuleLayerState UPDATE_GRANULE_LAYER_GEOMETRY uses incoming geometry when active platform matches [layers-action-update-granule-geometry-active-platform]', () => {
    const granuleDates = ['2021-01-01T00:00:00Z'];
    const newFootprints = { type: 'FeatureCollection', features: [{ id: 'old' }] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 10,
        granuleDates,
        reorderedGranules: null,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    const matchingState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: { ...getState(layers).layers.active, granulePlatform: 'Aqua / MODIS' },
        granuleFootprints: { type: 'FeatureCollection', features: [{ id: 'old' }] },
      },
    };
    getGranuleFootprints.mockReturnValue(newFootprints);
    getGranuleLayer.mockReturnValue({ id: 'aqua-aod' });
    const matchingStore = mockStore(matchingState);
    matchingStore.dispatch(updateGranuleLayerState(mockLayer));
    const geometryAction = matchingStore.getActions().find(
      (a) => a.type === LAYER_CONSTANTS.UPDATE_GRANULE_LAYER_GEOMETRY,
    );
    expect(geometryAction.granuleFootprints).toEqual(newFootprints);
  });

  test('updateGranuleLayerState UPDATE_GRANULE_LAYER_GEOMETRY uses existing global geometry when platform does not match [layers-action-update-granule-geometry-inactive-platform]', () => {
    const granuleDates = ['2021-01-01T00:00:00Z'];
    const newFootprints = { type: 'FeatureCollection', features: [{ id: 'new' }] };
    const existingGlobalFootprints = { type: 'FeatureCollection', features: [{ id: 'global' }] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 10,
        granuleDates,
        reorderedGranules: null,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    const nonMatchingState = {
      ...getState(layers),
      layers: {
        ...getState(layers).layers,
        active: { ...getState(layers).layers.active, granulePlatform: 'Terra / MODIS' },
        granuleFootprints: existingGlobalFootprints,
      },
    };
    getGranuleFootprints.mockReturnValue(newFootprints);
    getGranuleLayer.mockReturnValue({ id: 'aqua-aod' });
    const nonMatchingStore = mockStore(nonMatchingState);
    nonMatchingStore.dispatch(updateGranuleLayerState(mockLayer));
    const geometryAction = nonMatchingStore.getActions().find(
      (a) => a.type === LAYER_CONSTANTS.UPDATE_GRANULE_LAYER_GEOMETRY,
    );
    expect(geometryAction.granuleFootprints).toEqual(existingGlobalFootprints);
  });

  test('updateGranuleLayerState ADD_GRANULE_LAYER_DATES always uses layer.wv.granuleDates not reorderedGranules [layers-action-add-granule-layer-dates-uses-granule-dates]', () => {
    const granuleDates = ['2021-03-01T00:00:00Z', '2021-02-01T00:00:00Z'];
    const reorderedGranules = ['2021-02-01T00:00:00Z', '2021-03-01T00:00:00Z'];
    const mockFootprints = { type: 'FeatureCollection', features: [] };
    const mockLayer = {
      wv: {
        id: 'aqua-aod',
        count: 5,
        granuleDates,
        reorderedGranules,
        def: { endDate: '2030-01-01T00:00:00Z', subtitle: 'Aqua / MODIS' },
      },
    };
    getGranuleFootprints.mockReturnValue(mockFootprints);
    getGranuleLayer.mockReturnValue(null);
    store.dispatch(updateGranuleLayerState(mockLayer));
    const datesAction = store.getActions().find(
      (a) => a.type === LAYER_CONSTANTS.ADD_GRANULE_LAYER_DATES,
    );
    expect(datesAction.dates).toEqual(granuleDates);
    expect(datesAction.granuleFootprints).toEqual(mockFootprints);
    expect(datesAction.granulePlatform).toBe('Aqua / MODIS');
    expect(datesAction.id).toBe('aqua-aod');
    expect(datesAction.count).toBe(5);
    expect(datesAction.activeKey).toBe('active');
  });

  test('UPDATE_DDV_LAYER dispatches correct action with id, activeString, layers, and layerIndex [layers-action-update-band-combination]', () => {
    const bandCombo = { r: 'B04', g: 'B03', b: 'B02' };
    const selectedPreset = 'natural-color';
    const layerIndex = 2;
    store.dispatch(updateBandCombination('aqua-aod', bandCombo, layerIndex, selectedPreset));
    const actionResponse = store.getActions()[0];
    expect(actionResponse.type).toBe(LAYER_CONSTANTS.UPDATE_DDV_LAYER);
    expect(actionResponse.id).toBe('aqua-aod');
    expect(actionResponse.activeString).toBe('active');
    expect(actionResponse.layerIndex).toBe(layerIndex);
    expect(Array.isArray(actionResponse.layers)).toBe(true);
  });

  test('UPDATE_DDV_LAYER dispatches with correct layerIndex [layers-action-update-band-combination-layer-index]', () => {
    const bandCombo = { r: 'B04', g: 'B03', b: 'B02' };
    store.dispatch(updateBandCombination('aqua-aod', bandCombo, 0, null));
    expect(store.getActions()[0].layerIndex).toBe(0);
  });

  test('UPDATE_DDV_LAYER dispatches with null selectedPreset [layers-action-update-band-combination-null-preset]', () => {
    const bandCombo = { r: 'B04', g: 'B03', b: 'B02' };
    store.dispatch(updateBandCombination('aqua-aod', bandCombo, 1, null));
    const actionResponse = store.getActions()[0];
    expect(actionResponse.type).toBe(LAYER_CONSTANTS.UPDATE_DDV_LAYER);
    expect(actionResponse.id).toBe('aqua-aod');
  });

  test('UPDATE_DDV_LAYER uses activeString from compare state [layers-action-update-band-combination-active-string]', () => {
    const compareState = {
      ...getState(layers),
      compare: { activeString: 'activeB', active: true },
    };
    const compareStore = mockStore(compareState);
    compareStore.dispatch(updateBandCombination('aqua-aod', {}, 0, null));
    expect(compareStore.getActions()[0].activeString).toBe('activeB');
  });
});
