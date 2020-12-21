import update from 'immutability-helper';
import { layerReducer, getInitialState } from './reducers';
import fixtures from '../../fixtures';
import {
  RESET_LAYERS,
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

  beforeEach(() => {
    initialState = getInitialState(config);
    initialLayers = initialState.active.layers;
    initialGroups = initialState.active.overlayGroups;
  });

  test('initial state has layers and overlayGroups as expected', () => {
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

  test('Common actions update active layer array and groups', () => {
    const actions = [
      RESET_LAYERS,
      ADD_LAYER,
      ADD_LAYERS_FOR_EVENT,
      REMOVE_LAYER,
      REMOVE_GROUP,
      REORDER_LAYERS,
      TOGGLE_OVERLAY_GROUP_VISIBILITY,
    ];
    actions.forEach((ACTION) => {
      const layers = [...initialLayers, newLayer];
      const expectedState = update(initialState, {
        active: {
          layers: { $push: [newLayer] },
          overlayGroups: { $push: [newGroup] },
        },
      });
      const resultState = layerReducer(initialState, {
        type: ACTION,
        activeString: 'active',
        layers,
      });
      expect(resultState).toEqual(expectedState);
    });
  });

  test('INIT_SECOND_LAYER_GROUP copies current layer state', () => {
    const response = layerReducer(initialState, {
      type: INIT_SECOND_LAYER_GROUP,
    });
    expect(initialState.activeB.layers).toEqual([]);
    expect(initialState.active).toEqual(response.activeB);
  });

  test('TOGGLE_LAYER_VISIBILITY action toggles layer state visibility', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_LAYER_VISIBILITY,
      id: 'terra-cr',
      visible: false,
      activeString: 'active',
    });
    expect(getTestLayer(initialLayers).visible).toBeTruthy();
    expect(getTestLayer(response.active.layers).visible).toBeFalsy();
  });

  test('TOGGLE_COLLAPSE_OVERLAY_GROUP toggles collapsed state of group', () => {
    const response = layerReducer(initialState, {
      type: TOGGLE_COLLAPSE_OVERLAY_GROUP,
      groupName: 'AOD',
      activeString: 'active',
      collapsed: true,
    });
    expect(getTestGroup(initialGroups).collapsed).toBeFalsy();
    expect(getTestGroup(response.active.overlayGroups)).toBeTruthy();
  });

  test('TOGGLE_OVERLAY_GROUPS ungroups layers when grouped', () => {
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

  test('TOGGLE_OVERLAY_GROUPS groups layers when ungrouped', () => {
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

  test('REORDER_OVERLAY_GROUPS sets new groups, layers, and clears prevLayeers', () => {
    const response = layerReducer(initialState, {
      type: REORDER_OVERLAY_GROUPS,
      activeString: 'active',
      layers: initialLayers,
      overlayGroups: initialGroups,
    });
    expect(response.active.layers).toEqual(initialLayers);
    expect(response.active.overlayGroups).toEqual(initialGroups);
    expect(response.active.prevLayers).toEqual([]);
  });

  test('SET_THRESHOLD_RANGE_AND_SQUASH action updates palette-related props', () => {
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

  test('CLEAR_CUSTOM_PALETTE action removed custom value', () => {
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

  test('SET_CUSTOM_PALETTE action removed custom value', () => {
    const response = layerReducer(initialState, {
      type: SET_CUSTOM_PALETTE,
      id: 'terra-cr',
      activeString: 'active',
      paletteId: 'custom-id',
    });

    expect(getTestLayer(initialLayers).custom).toEqual(undefined);
    expect(getTestLayer(response.active.layers).custom).toEqual(['custom-id']);
  });

  test('UPDATE_OPACITY action updates opacity for given layer', () => {
    const response = layerReducer(initialState, {
      type: UPDATE_OPACITY,
      activeString: 'active',
      opacity: 0.4,
      id: 'terra-cr',
    });
    expect(getTestLayer(response.active.layers).opacity).toEqual(0.4);
  });
});
