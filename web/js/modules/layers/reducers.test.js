import update from 'immutability-helper';
import { layerReducer, getInitialState } from './reducers';
import fixtures from '../../fixtures';
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
  REORDER_OVERLAY_GROUPS,
  REMOVE_GROUP,
  SYNC_SECOND_LAYER_GROUP,
  SET_FILTER_RANGE,
  CLEAR_VECTORSTYLE,
  ADD_GRANULE_LAYER_DATES,
  UPDATE_GRANULE_LAYER_OPTIONS,
  UPDATE_GRANULE_LAYER_GEOMETRY,
  CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP,
  UPDATE_DDV_LAYER,
  UPDATE_COLLECTION,
  ADD_GRANULE_DATE_RANGES,
  ADD_TEMPO_DATE_RANGES,
} from './constants';
import {
  SET_VECTORSTYLE,
} from '../vector-styles/constants';
import {
  SET_CUSTOM as SET_CUSTOM_PALETTE,
  CLEAR_CUSTOM as CLEAR_CUSTOM_PALETTE,
  SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
  SET_DISABLED_CLASSIFICATION,
} from '../palettes/constants';

const config = fixtures.config();
const newLayer = {
  id: 'modis-fires',
  layergroup: 'Fires',
  group: 'overlays',
};
const newGroup = {
  collapsed: false,
  groupName: 'Fires',
  layers: ['modis-fires'],
};
const getTestLayer = (layers) => layers.find((l) => l.id === 'terra-cr');
const getTestGroup = (groups) => groups.find((g) => g.groupName === 'AOD');

describe('layer Reducer tests', () => {
  let initialState;
  let initialLayers;
  let initialGroups;
  let initialEventLayers;

  beforeEach(() => {
    initialState = getInitialState(config);
    initialLayers = initialState.active.layers;
    initialGroups = initialState.active.overlayGroups;
    initialEventLayers = [];
  });

  test('initial state has layers and overlayGroups as expected [layers-reducer-initial-state]', () => {
    expect(initialLayers.length).toEqual(3);
    expect(initialLayers[0].id).toEqual('terra-aod');
    expect(initialLayers[1].id).toEqual('aqua-cr');
    expect(initialLayers[2].id).toEqual('terra-cr');
    expect(initialState.active.groupOverlays).toEqual(true);
    expect(initialState.active.overlayGroups).toEqual([
      {
        collapsed: false,
        groupName: 'AOD',
        layers: [
          'terra-aod',
        ],
      },
    ]);
    expect(initialState.active.prevLayers.length).toEqual(0);
  });

  test('Common actions update active layer array and groups [layers-reducer-common-actions]', () => {
    const actions = [
      ADD_LAYER,
      REORDER_LAYERS,
      TOGGLE_OVERLAY_GROUP_VISIBILITY,
    ];
    actions.forEach((ACTION) => {
      const expectedState = update(initialState, {
        active: {
          layers: { $push: [newLayer] },
          overlayGroups: { $push: [newGroup] },
        },
      });
      const resultState = layerReducer(initialState, {
        type: ACTION,
        activeString: 'active',
        layers: [...initialLayers, newLayer],
      });
      expect(resultState).toEqual(expectedState);
    });
  });

  test('Remove layer and group [layers-reducer-remove-layer]', () => {
    const actions = [
      REMOVE_LAYER,
      REMOVE_GROUP,
    ];
    actions.forEach((ACTION) => {
      const expectedState = update(initialState, {
        active: {
          layers: { $push: [newLayer] },
          overlayGroups: { $push: [newGroup] },
        },
      });
      const resultState = layerReducer(initialState, {
        type: ACTION,
        activeString: 'active',
        layers: [...initialLayers, newLayer],
        granuleLayers: {},
      });
      expect(resultState).toEqual(expectedState);
    });
  });

  test('ADD_LAYERS_FOR_EVENT sets new groups, layers, and clears prevLayeers [layers-reducer-add-layer-for-event]', () => {
    const response = layerReducer(initialState, {
      type: ADD_LAYERS_FOR_EVENT,
      activeString: 'active',
      layers: initialLayers,
      overlayGroups: initialGroups,
      eventLayers: initialEventLayers,
    });
    expect(response.active.layers).toEqual(initialLayers);
    expect(response.active.overlayGroups).toEqual(initialGroups);
    expect(response.active.prevLayers).toEqual([]);
  });

  test('REORDER_OVERLAY_GROUPS sets new groups, layers, and clears prevLayers [layers-reducer-reorder-overlay-groups]', () => {
    const response = layerReducer(initialState, {
      type: REORDER_OVERLAY_GROUPS,
      activeString: 'active',
      layers: initialLayers,
      overlayGroups: initialGroups,
      eventLayers: initialEventLayers,
    });
    expect(response.active.layers).toEqual(initialLayers);
    expect(response.active.overlayGroups).toEqual(initialGroups);
    expect(response.active.prevLayers).toEqual([]);
  });

  test('INIT_SECOND_LAYER_GROUP copies current layer state [layers-reducer-second-layer-group]', () => {
    const response = layerReducer(initialState, {
      type: INIT_SECOND_LAYER_GROUP,
    });
    expect(initialState.activeB.layers).toEqual([]);
    expect(initialState.active).toEqual(response.activeB);
  });

  test('SYNC_SECOND_LAYER_GROUP copies current layer state [layers-reducer-sync-second-layer-group]', () => {
    const response = layerReducer(initialState, {
      type: SYNC_SECOND_LAYER_GROUP,
    });
    expect(initialState.activeB.layers).toEqual([]);
    expect(initialState.active).toEqual(response.active);
  });

  test('SET_FILTER_RANGE updates filter range [layers-reducer-set-filter-range]', () => {
    const response = layerReducer(initialState, {
      type: SET_FILTER_RANGE,
    });
    expect(initialState.activeB.layers).toEqual([]);
    expect(initialState.active).toEqual(response.active);
  });

  test('CLEAR_VECTORSTYLE clears vector style [layers-reducer-clear-vectorstyle]', () => {
    const response = layerReducer(initialState, {
      type: CLEAR_VECTORSTYLE,
    });
    expect(initialState.activeB.layers).toEqual([]);
    expect(initialState.active).toEqual(response.active);
  });

  test('TOGGLE_LAYER_VISIBILITY action toggles layer state visibility [layers-reducer-toggle-visibility]', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_LAYER_VISIBILITY,
      id: 'terra-cr',
      visible: false,
      activeString: 'active',
    });
    expect(getTestLayer(initialLayers).visible).toBeTruthy();
    expect(getTestLayer(response.active.layers).visible).toBeFalsy();
  });

  test('TOGGLE_COLLAPSE_OVERLAY_GROUP toggles collapsed state of group [layers-reducer-collapse-overlay-group]', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_COLLAPSE_OVERLAY_GROUP,
      groupName: 'AOD',
      activeString: 'active',
      collapsed: true,
    });
    expect(getTestGroup(initialGroups).collapsed).toBeFalsy();
    expect(getTestGroup(response.active.overlayGroups)).toBeTruthy();
  });

  test('TOGGLE_OVERLAY_GROUPS ungroups layers when grouped [layers-reducer-ungroup-layers]', () => {
    const mockLayers = ['layer1', 'layer2', 'layer3'];
    const response = layerReducer(initialState, {
      type: TOGGLE_OVERLAY_GROUPS,
      activeString: 'active',
      groupOverlays: false,
      layers: mockLayers,
      overlayGroups: [],
    });
    expect(response.active.groupOverlays).toBeFalsy();
    expect(response.active.overlayGroups).toEqual([]);
    expect(response.active.layers).toEqual(mockLayers);
    expect(response.active.prevLayers).toEqual(undefined);
  });

  test('TOGGLE_OVERLAY_GROUPS groups layers when ungrouped [layers-reducer-group-layers]', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_OVERLAY_GROUPS,
      activeString: 'active',
      groupOverlays: true,
      layers: initialLayers,
      overlayGroups: initialGroups,
      prevLayers: initialLayers,
    });
    expect(response.active.groupOverlays).toBeTruthy();
    expect(response.active.layers).toEqual(initialLayers);
    expect(response.active.overlayGroups).toEqual(initialGroups);
    expect(response.active.prevLayers).toEqual(initialLayers);
  });

  test('SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP action updates palette-related props [layers-reducer-update-palettes]', () => {
    const response = layerReducer(initialState, {
      type: SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
      props: { squash: true, noclip: true, min: 0.3 },
      id: 'terra-cr',
      activeString: 'active',
    });
    const responseLayer = getTestLayer(response.active.layers);
    expect(getTestLayer(initialLayers).squash).toEqual(undefined);
    expect(getTestLayer(initialLayers).noclip).toEqual(undefined);
    expect(responseLayer.squash).toBeTruthy();
    expect(responseLayer.noclip).toBeTruthy();
    expect(responseLayer.min).toEqual(0.3);
  });

  test('CLEAR_CUSTOM_PALETTE action removed custom value [layers-reducer-clear-custom-palette]', () => {
    const customInitial = update(initialState, {
      active: {
        layers: {
          2: { custom: { $set: 'custom-id' } },
        },
      },
    });
    const response = layerReducer(customInitial, {
      type: CLEAR_CUSTOM_PALETTE,
      id: 'terra-cr',
      activeString: 'active',
    });
    expect(getTestLayer(customInitial.active.layers).custom).toEqual('custom-id');
    expect(getTestLayer(response.active.layers).custom).toEqual(undefined);
  });

  test('SET_CUSTOM_PALETTE action removed custom value [layers-reducer-set-custom-palette]', () => {
    const response = layerReducer(initialState, {
      type: SET_CUSTOM_PALETTE,
      id: 'terra-cr',
      activeString: 'active',
      paletteId: 'custom-id',
    });

    expect(getTestLayer(initialLayers).custom).toEqual(undefined);
    expect(getTestLayer(response.active.layers).custom).toEqual(['custom-id']);
  });

  test('UPDATE_OPACITY action updates opacity for given layer [layers-reducer-update-opacity]', () => {
    const response = layerReducer(initialState, {
      type: UPDATE_OPACITY,
      activeString: 'active',
      opacity: 0.4,
      id: 'terra-cr',
    });
    expect(getTestLayer(response.active.layers).opacity).toEqual(0.4);
  });

  test('TOGGLE_LAYER_VISIBILITY returns unchanged state when layer id not found [layers-reducer-toggle-visibility-not-found]', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_LAYER_VISIBILITY,
      id: 'non-existent-layer',
      visible: false,
      activeString: 'active',
    });
    expect(response).toEqual(initialState);
  });

  test('TOGGLE_COLLAPSE_OVERLAY_GROUP returns unchanged state when group not found [layers-reducer-collapse-group-not-found]', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_COLLAPSE_OVERLAY_GROUP,
      groupName: 'NonExistentGroup',
      activeString: 'active',
      collapsed: true,
    });
    expect(response).toEqual(initialState);
  });

  test('SYNC_SECOND_LAYER_GROUP adds new A layers not present in B [layers-reducer-sync-second-layer-group-adds-layers]', () => {
    const stateWithB = {
      ...initialState,
      activeB: {
        ...initialState.activeB,
        layers: [initialLayers[0]],
      },
    };
    const response = layerReducer(stateWithB, {
      type: SYNC_SECOND_LAYER_GROUP,
      lastExitALayerIds: [],
    });
    expect(response.activeB.layers.length).toEqual(3);
    expect(response.activeB.layers.map((l) => l.id)).toContain('aqua-cr');
    expect(response.activeB.layers.map((l) => l.id)).toContain('terra-cr');
  });

  test('SYNC_SECOND_LAYER_GROUP does not re-add layers that were in lastExitALayerIds [layers-reducer-sync-second-layer-group-respects-last-exit]', () => {
    const stateWithB = {
      ...initialState,
      activeB: {
        ...initialState.activeB,
        layers: [initialLayers[0]],
      },
    };
    const response = layerReducer(stateWithB, {
      type: SYNC_SECOND_LAYER_GROUP,
      lastExitALayerIds: ['aqua-cr'],
    });
    const bIds = response.activeB.layers.map((l) => l.id);
    expect(bIds).not.toContain('aqua-cr');
    expect(bIds).toContain('terra-cr');
  });

  test('ADD_LAYERS_FOR_EVENT sets eventLayers when provided [layers-reducer-add-layer-for-event-with-event-layers]', () => {
    const mockEventLayers = ['layer-event-1'];
    const response = layerReducer(initialState, {
      type: ADD_LAYERS_FOR_EVENT,
      activeString: 'active',
      layers: initialLayers,
      overlayGroups: initialGroups,
      eventLayers: mockEventLayers,
    });
    expect(response.eventLayers).toEqual(mockEventLayers);
  });

  test('REORDER_OVERLAY_GROUPS with undefined eventLayers pushes nothing to eventLayers [layers-reducer-reorder-overlay-groups-no-event-layers]', () => {
    const response = layerReducer(initialState, {
      type: REORDER_OVERLAY_GROUPS,
      activeString: 'active',
      layers: initialLayers,
      overlayGroups: initialGroups,
    });
    expect(response.eventLayers).toEqual([]);
  });

  test('SET_VECTORSTYLE sets custom vectorStyleId on the layer [layers-reducer-set-vectorstyle]', () => {
    const response = layerReducer(initialState, {
      type: SET_VECTORSTYLE,
      id: 'terra-cr',
      activeString: 'active',
      vectorStyleId: 'my-vector-style',
    });
    expect(getTestLayer(response.active.layers).custom).toEqual('my-vector-style');
  });

  test('CLEAR_VECTORSTYLE clears custom on a layer [layers-reducer-clear-vectorstyle-layer]', () => {
    const stateWithCustom = update(initialState, {
      active: {
        layers: {
          2: { custom: { $set: 'some-style' } },
        },
      },
    });
    const response = layerReducer(stateWithCustom, {
      type: CLEAR_VECTORSTYLE,
      id: 'terra-cr',
      activeString: 'active',
    });
    expect(getTestLayer(response.active.layers).custom).toEqual('some-style');
  });

  test('SET_DISABLED_CLASSIFICATION merges props onto the target layer [layers-reducer-set-disabled-classification]', () => {
    const response = layerReducer(initialState, {
      type: SET_DISABLED_CLASSIFICATION,
      id: 'terra-cr',
      activeString: 'active',
      props: { disabledClassification: [0, 1] },
    });
    expect(getTestLayer(response.active.layers).disabledClassification).toEqual([0, 1]);
  });

  test('SET_DISABLED_CLASSIFICATION returns unchanged state when layer not found [layers-reducer-set-disabled-classification-not-found]', () => {
    const response = layerReducer(initialState, {
      type: SET_DISABLED_CLASSIFICATION,
      id: 'non-existent-layer',
      activeString: 'active',
      props: { disabledClassification: [0] },
    });
    expect(response).toEqual(initialState);
  });

  test('CLEAR_CUSTOM_PALETTE returns unchanged state when layer not found [layers-reducer-clear-custom-palette-not-found]', () => {
    const response = layerReducer(initialState, {
      type: 'CLEAR_CUSTOM',
      id: 'non-existent-layer',
      activeString: 'active',
    });
    expect(response).toEqual(initialState);
  });

  test('SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP returns unchanged state when layer not found [layers-reducer-update-palettes-not-found]', () => {
    const response = layerReducer(initialState, {
      type: SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
      id: 'non-existent-layer',
      activeString: 'active',
      props: { squash: true },
    });
    expect(response).toEqual(initialState);
  });

  test('ADD_GRANULE_LAYER_DATES adds granule layer entry to active state [layers-reducer-add-granule-layer-dates]', () => {
    const granuleDates = ['2021-01-01', '2021-01-02'];
    const granuleFootprints = { type: 'FeatureCollection', features: [] };
    const response = layerReducer(initialState, {
      type: ADD_GRANULE_LAYER_DATES,
      id: 'terra-cr',
      activeKey: 'active',
      dates: granuleDates,
      granuleFootprints,
      granulePlatform: 'Terra',
      count: 2,
    });
    expect(response.active.granuleLayers['terra-cr']).toBeDefined();
    expect(response.active.granuleLayers['terra-cr'].dates).toEqual(granuleDates);
    expect(response.active.granuleLayers['terra-cr'].granulePlatform).toEqual('Terra');
    expect(response.active.granuleLayers['terra-cr'].count).toEqual(2);
    expect(response.active.granuleFootprints).toEqual(granuleFootprints);
    expect(response.active.granulePlatform).toEqual('Terra');
  });

  test('UPDATE_GRANULE_LAYER_OPTIONS merges count and dates into existing granule layer [layers-reducer-update-granule-layer-options]', () => {
    const initialWithGranule = update(initialState, {
      active: {
        granuleLayers: {
          $merge: {
            'terra-cr': { dates: [], count: 0, granuleFootprints: {}, granulePlatform: 'Terra' },
          },
        },
      },
    });
    const newDates = ['2022-05-01'];
    const response = layerReducer(initialWithGranule, {
      type: UPDATE_GRANULE_LAYER_OPTIONS,
      id: 'terra-cr',
      activeKey: 'active',
      count: 5,
      dates: newDates,
    });
    expect(response.active.granuleLayers['terra-cr'].count).toEqual(5);
    expect(response.active.granuleLayers['terra-cr'].dates).toEqual(newDates);
  });

  test('UPDATE_GRANULE_LAYER_GEOMETRY updates geometry and footprints for granule layer [layers-reducer-update-granule-layer-geometry]', () => {
    const initialWithGranule = update(initialState, {
      active: {
        granuleLayers: {
          $merge: {
            'terra-cr': { dates: [], count: 0, granuleFootprints: {}, granulePlatform: 'Terra' },
          },
        },
      },
    });
    const newFootprints = { type: 'FeatureCollection', features: [{ id: 1 }] };
    const newDates = ['2022-06-01'];
    const response = layerReducer(initialWithGranule, {
      type: UPDATE_GRANULE_LAYER_GEOMETRY,
      id: 'terra-cr',
      activeKey: 'active',
      dates: newDates,
      granuleFootprints: newFootprints,
      count: 3,
    });
    expect(response.active.granuleLayers['terra-cr'].granuleFootprints).toEqual(newFootprints);
    expect(response.active.granuleLayers['terra-cr'].count).toEqual(3);
    expect(response.active.granuleFootprints).toEqual(newFootprints);
  });

  test('CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP sets granulePlatform and geometry [layers-reducer-change-granule-satellite]', () => {
    const geometry = { type: 'FeatureCollection', features: [] };
    const response = layerReducer(initialState, {
      type: CHANGE_GRANULE_SATELLITE_INSTRUMENT_GROUP,
      activeKey: 'active',
      granulePlatform: 'Aqua',
      geometry,
    });
    expect(response.active.granulePlatform).toEqual('Aqua');
    expect(response.active.granuleFootprints).toEqual(geometry);
  });

  test('ADD_GRANULE_DATE_RANGES sets granuleDateRanges on the target layer [layers-reducer-add-granule-date-ranges]', () => {
    const dateRanges = [{ startDate: '2020-01-01', endDate: '2020-12-31' }];
    const response = layerReducer(initialState, {
      type: ADD_GRANULE_DATE_RANGES,
      id: 'terra-cr',
      activeString: 'active',
      granuleDateRanges: dateRanges,
    });
    expect(getTestLayer(response.active.layers).granuleDateRanges).toEqual(dateRanges);
  });

  test('ADD_GRANULE_DATE_RANGES returns unchanged state when layer not found [layers-reducer-add-granule-date-ranges-not-found]', () => {
    const response = layerReducer(initialState, {
      type: ADD_GRANULE_DATE_RANGES,
      id: 'non-existent-layer',
      activeString: 'active',
      granuleDateRanges: [],
    });
    expect(response).toEqual(initialState);
  });

  test('ADD_TEMPO_DATE_RANGES sets tempoDateRanges on the target layer [layers-reducer-add-tempo-date-ranges]', () => {
    const tempoRanges = [{ startDate: '2023-01-01', endDate: '2023-06-30' }];
    const response = layerReducer(initialState, {
      type: ADD_TEMPO_DATE_RANGES,
      id: 'terra-cr',
      activeString: 'active',
      tempoDateRanges: tempoRanges,
    });
    expect(getTestLayer(response.active.layers).tempoDateRanges).toEqual(tempoRanges);
  });

  test('ADD_TEMPO_DATE_RANGES returns unchanged state when layer not found [layers-reducer-add-tempo-date-ranges-not-found]', () => {
    const response = layerReducer(initialState, {
      type: ADD_TEMPO_DATE_RANGES,
      id: 'non-existent-layer',
      activeString: 'active',
      tempoDateRanges: [],
    });
    expect(response).toEqual(initialState);
  });

  test('UPDATE_COLLECTION initializes a new collection entry when id does not exist [layers-reducer-update-collection-new]', () => {
    const payload = [{
      id: 'new-collection-layer',
      date: '2021-01-01',
      type: 'cmr',
      version: '006',
      projection: 'geographic',
    }];
    const response = layerReducer(initialState, {
      type: UPDATE_COLLECTION,
      payload,
    });
    expect(response.collections['new-collection-layer']).toBeDefined();
    expect(response.collections['new-collection-layer'].dates).toHaveLength(1);
    expect(response.collections['new-collection-layer'].dates[0].version).toEqual('006');
  });

  test('UPDATE_COLLECTION pushes a new date entry when collection id already exists [layers-reducer-update-collection-existing]', () => {
    const stateWithCollection = update(initialState, {
      collections: {
        $merge: {
          'existing-collection': {
            dates: [{ date: '2020-01-01', type: 'cmr', version: '005', projection: 'geographic' }],
          },
        },
      },
    });
    const payload = [{
      id: 'existing-collection',
      date: '2021-06-01',
      type: 'cmr',
      version: '006',
      projection: 'geographic',
    }];
    const response = layerReducer(stateWithCollection, {
      type: UPDATE_COLLECTION,
      payload,
    });
    expect(response.collections['existing-collection'].dates).toHaveLength(2);
    expect(response.collections['existing-collection'].dates[1].date).toEqual('2021-06-01');
  });

  test('UPDATE_DDV_LAYER moves the target layer to the specified index [layers-reducer-update-ddv-layer]', () => {
    const layersCopy = initialLayers.map((l) => ({ ...l }));
    const response = layerReducer(initialState, {
      type: UPDATE_DDV_LAYER,
      activeString: 'active',
      id: 'terra-cr',
      layerIndex: 0,
      layers: layersCopy,
    });
    expect(response.active.layers[0].id).toEqual('terra-cr');
  });

  test('unknown action type returns unchanged state [layers-reducer-default]', () => {
    const response = layerReducer(initialState, {
      type: 'UNKNOWN_ACTION_TYPE',
    });
    expect(response).toEqual(initialState);
  });
});
