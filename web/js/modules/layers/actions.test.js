import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fixtures from '../../fixtures';
import { addLayer, getLayers } from './selectors';
import * as LAYER_ACTIONS from './actions';
import * as LAYER_CONSTANTS from './constants';

const mockStore = configureMockStore([thunk]);
const config = fixtures.config();
function getState(layers) {
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
      },
    },
    compare: {
      activeString: 'active',
    },
  };
}
function addMockLayer(layerId, layerArray) {
  return addLayer(
    layerId,
    {},
    layerArray,
    config.layers,
    getLayers(getState(layerArray), { group: 'all' }, layerArray).overlays.length,
  );
}

describe('Layer actions', () => {
  let layers;
  let store;

  beforeEach(() => {
    layers = [];
    layers = addLayer('terra-cr', {}, [], config.layers, 0);
    layers = addMockLayer('aqua-cr', layers);
    layers = addMockLayer('terra-aod', layers);
    layers = addMockLayer('aqua-aod', layers);
    store = mockStore(getState(layers));
  });

  test('REMOVE_LAYER action removes layer by id', () => {
    const def = layers[0];
    store.dispatch(LAYER_ACTIONS.removeLayer('aqua-aod'));
    const actionResponse = store.getActions()[0];
    const responseLayers = [layers[1], layers[2], layers[3]];

    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_LAYER,
      activeString: 'active',
      layersToRemove: [def],
      layers: responseLayers,
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('REMOVE_LAYER does nothing on non-existent id', () => {
    store.dispatch(LAYER_ACTIONS.removeLayer('INVALID TEST LAYER ID'));
    const actionResponse = store.getActions()[0];
    const expectedPayload = undefined;
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('REMOVE_GROUP removes each layer in group', () => {
    store.dispatch(LAYER_ACTIONS.removeGroup(['terra-aod', 'aqua-aod']));
    const actionResponse = store.getActions()[0];
    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_GROUP,
      activeString: 'active',
      layersToRemove: [layers[0], layers[1]],
      layers: [layers[2], layers[3]],
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('TOGGLE_OVERLAY_GROUPS when grouped, toggling ungroups layers', () => {
    store.dispatch(LAYER_ACTIONS.toggleOverlayGroups());
    const actionResponse = store.getActions()[0];
    const expectedPayload = {
      type: LAYER_CONSTANTS.TOGGLE_OVERLAY_GROUPS,
      activeString: 'active',
      groupOverlays: false,
      layers,
      overlayGroups: [],
    };
    expect(actionResponse).toEqual(expectedPayload);
  });
});
