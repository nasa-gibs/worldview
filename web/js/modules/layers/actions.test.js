import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fixtures from '../../fixtures';
import { addLayer, getLayers } from './selectors';
import {
  removeLayer, removeGroup, toggleOverlayGroups, updateDatesOnProjChange,
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

  test('REMOVE_LAYER action removes layer by id', () => {
    const def = layers[1];
    store.dispatch(removeLayer('aqua-aod'));
    const actionResponse = store.getActions()[0];
    const responseLayers = [layers[0], layers[2], layers[3]];

    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_LAYER,
      activeString: 'active',
      layersToRemove: [def],
      layers: responseLayers,
      granuleLayers: {},
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('REMOVE_LAYER does nothing on non-existent id', () => {
    store.dispatch(removeLayer('INVALID TEST LAYER ID'));
    const actionResponse = store.getActions()[0];
    const expectedPayload = undefined;
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('REMOVE_GROUP removes each layer in group', () => {
    store.dispatch(removeGroup(['terra-aod', 'aqua-aod']));
    const actionResponse = store.getActions()[0];
    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_GROUP,
      activeString: 'active',
      layersToRemove: [layers[1], layers[2]],
      layers: [layers[0], layers[3]],
      granuleLayers: {},
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('TOGGLE_OVERLAY_GROUPS when grouped, toggling ungroups layers', () => {
    store.dispatch(toggleOverlayGroups());
    const actionResponse = store.getActions()[0];
    const expectedPayload = {
      type: LAYER_CONSTANTS.TOGGLE_OVERLAY_GROUPS,
      activeString: 'active',
      groupOverlays: false,
      layers: [layers[1], layers[2], layers[0], layers[3] ],
      overlayGroups: [],
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('UPDATE_ON_PROJ_CHANGE updates layer dates based on projection', () => {
    layers = addMockLayer('granule-cr', layers, 'geographic');
    store = mockStore(getState(layers));
    store.dispatch(updateDatesOnProjChange('arctic'));
    const actionResponse = store.getActions()[0];
    console.log(actionResponse)
    const { startDate, endDate, dateRanges: [firstRange, secondRange] } = actionResponse.layersA[1];

    expect(startDate).toEqual('2019-07-21T00:36:00Z');
    expect(endDate).toEqual('2019-09-24T22:30:00Z');
    expect(firstRange.startDate).toEqual('2019-07-21T00:36:00Z');
    expect(firstRange.endDate).toEqual('2019-07-21T00:54:00Z');
    expect(secondRange.startDate).toEqual('2019-07-21T02:18:00Z');
    expect(secondRange.endDate).toEqual('2019-07-21T02:36:00Z');
  });
});
