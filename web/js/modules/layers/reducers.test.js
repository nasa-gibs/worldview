import update from 'immutability-helper';
import { layerReducer, getInitialState } from './reducers';
import fixtures from '../../fixtures';
import * as CONSTANTS from './constants';
import {
  SET_CUSTOM as SET_CUSTOM_PALETTE,
  CLEAR_CUSTOM as CLEAR_CUSTOM_PALETTE,
  SET_THRESHOLD_RANGE_AND_SQUASH,
} from '../palettes/constants';

const config = fixtures.config();
const initalState = getInitialState(config);

describe('Initial layer state test', () => {
  test('initial state loads aqua-cr and terra-cr layers', () => {
    expect(initalState.active.layers.length).toEqual(2);
    expect(initalState.active.layers[0].id).toEqual('aqua-cr');
    expect(initalState.active.layers[1].id).toEqual('terra-cr');
  });
});

describe('layer Reducer tests', () => {
  test('ADD_LAYER action updates active layer array with new layer array', () => {
    const newState = update(initalState, {
      active: {
        layers: { $set: ['updated-layer-array'] },
      },
    });
    expect(
      layerReducer(initalState, {
        type: CONSTANTS.ADD_LAYER,
        activeString: 'active',
        layers: ['updated-layer-array'],
      }),
    ).toEqual(newState);
  });

  test('RESET_LAYERS action updates active layer array with new layer array', () => {
    const newState = update(initalState, {
      active: {
        layers: { $set: ['updated-layer-array'] },
      },
    });
    expect(
      layerReducer(initalState, {
        type: CONSTANTS.RESET_LAYERS,
        activeString: 'active',
        layers: ['updated-layer-array'],
      }),
    ).toEqual(newState);
  });

  test('REORDER_LAYERS action updates active layer array with new layer array', () => {
    const newState = update(initalState, {
      active: {
        layers: { $set: ['updated-layer-array'] },
      },
    });
    expect(
      layerReducer(initalState, {
        type: CONSTANTS.REORDER_LAYERS,
        activeString: 'active',
        layers: ['updated-layer-array'],
      }),
    ).toEqual(newState);
  });

  test('REMOVE_LAYER action removes terra-cr from layer array', () => {
    const response = layerReducer(initalState, {
      type: CONSTANTS.REMOVE_LAYER,
      activeString: 'active',
      id: 'terra-cr',
      layers: initalState.active.layers,
    });
    expect(response.active.layers).toEqual(initalState.active.layers);
  });

  test('INIT_SECOND_LAYER_GROUP copies current layer state', () => {
    const response = layerReducer(initalState, {
      type: CONSTANTS.INIT_SECOND_LAYER_GROUP,
    });
    expect(initalState.activeB.layers).toEqual([]);
    expect(initalState.active).toEqual(response.activeB);
  });

  test('TOGGLE_LAYER_VISIBILITY action toggles layer state visibility', () => {
    const response = layerReducer(initalState, {
      type: CONSTANTS.TOGGLE_LAYER_VISIBILITY,
      id: 'terra-cr',
      visible: false,
      activeString: 'active',
    });
    expect(initalState.active.layers[1].visible).toBeTruthy();
    expect(response.active.layers[1].visible).toBeFalsy();
  });

  test('SET_THRESHOLD_RANGE_AND_SQUASH action updates palette-related props', () => {
    const response = layerReducer(initalState, {
      type: SET_THRESHOLD_RANGE_AND_SQUASH,
      props: { squash: true, min: 0.3 },
      id: 'terra-cr',
      activeString: 'active',
    });
    expect(initalState.active.layers[1].squash).toEqual(undefined);
    expect(response.active.layers[1].squash).toBeTruthy();
    expect(response.active.layers[1].min).toEqual(0.3);
  });

  test('CLEAR_CUSTOM_PALETTE action removed custom value', () => {
    const customInitial = update(initalState, {
      active: {
        layers: { 1: { custom: { $set: 'custom-id' } } },
      },
    });
    const response = layerReducer(customInitial, {
      type: CLEAR_CUSTOM_PALETTE,
      id: 'terra-cr',
      activeString: 'active',
    });
    expect(customInitial.active.layers[1].custom).toEqual('custom-id');
    expect(response.active.layers[1].custom).toEqual(undefined);
  });

  test('SET_CUSTOM_PALETTE action removed custom value', () => {
    const response = layerReducer(initalState, {
      type: SET_CUSTOM_PALETTE,
      id: 'terra-cr',
      activeString: 'active',
      paletteId: 'custom-id',
    });

    expect(initalState.active.layers[1].custom).toEqual(undefined);
    expect(response.active.layers[1].custom).toEqual(['custom-id']);
  });

  test('REMOVE_LAYER action removes terra-cr from layer array', () => {
    const response = layerReducer(initalState, {
      type: CONSTANTS.UPDATE_OPACITY,
      activeString: 'active',
      opacity: 0.4,
      id: 'terra-cr',
    });
    expect(response.active.layers[1].opacity).toEqual(0.4);
  });
});
