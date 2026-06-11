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
} from './constants';
import {
  SET_CUSTOM as SET_CUSTOM_PALETTE,
  CLEAR_CUSTOM as CLEAR_CUSTOM_PALETTE,
  SET_THRESHOLD_RANGE_AND_SQUASH,
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

  test('SET_THRESHOLD_RANGE_AND_SQUASH action updates palette-related props [layers-reducer-update-palettes]', () => {
    const response = layerReducer(initialState, {
      type: SET_THRESHOLD_RANGE_AND_SQUASH,
      props: { squash: true, min: 0.3 },
      id: 'terra-cr',
      activeString: 'active',
    });
    const responseLayer = getTestLayer(response.active.layers);
    expect(getTestLayer(initialLayers).squash).toEqual(undefined);
    expect(responseLayer.squash).toBeTruthy();
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
});
