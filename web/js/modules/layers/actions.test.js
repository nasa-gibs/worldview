import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fixtures from '../../fixtures';
import { addLayer, getLayers } from './selectors';
import {
  removeLayer, removeGroup, toggleOverlayGroups,
} from './actions';
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
        granuleFootprints: {},
        granuleLayers: {},
        granulePlatform: '',
      },
      activeB: {
        layers,
      },
      granuleFootprints: {},
    },
    compare: {
      activeString: 'active',
    },
  };
}
function addMockLayer(layerId, layerArray, proj) {
  return addLayer(
    layerId,
    {},
    layerArray,
    config.layers,
    getLayers(getState(layerArray), { group: 'all' }, layerArray).overlays.length,
    proj,
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

  test('REMOVE_LAYER action removes layer by id [layers-action-remove-layer-by-id]', () => {
    const def = layers[0];
    store.dispatch(removeLayer('aqua-aod'));
    const actionResponse = store.getActions()[0];
    const responseLayers = [layers[1], layers[2], layers[3]];

    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_LAYER,
      activeString: 'active',
      layersToRemove: [def],
      layers: responseLayers,
      granuleLayers: {},
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('REMOVE_LAYER does nothing on non-existent id [layers-action-remove-layer-no-id]', () => {
    store.dispatch(removeLayer('INVALID TEST LAYER ID'));
    const actionResponse = store.getActions()[0];
    const expectedPayload = undefined;
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('REMOVE_GROUP removes each layer in group [layers-action-remove-group]', () => {
    store.dispatch(removeGroup(['terra-aod', 'aqua-aod']));
    const actionResponse = store.getActions()[0];
    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_GROUP,
      activeString: 'active',
      layersToRemove: [layers[0], layers[1]],
      layers: [layers[2], layers[3]],
      granuleLayers: {},
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('TOGGLE_OVERLAY_GROUPS when grouped, toggling ungroups layers [layers-action-toggle-group]', () => {
    store.dispatch(toggleOverlayGroups());
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
