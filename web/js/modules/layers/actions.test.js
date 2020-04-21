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
      active: layers,
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
    getLayers(layerArray, { group: 'all' }, getState(layerArray)).overlays
      .length,
  );
}
describe('remove Layer action', () => {
  test('removeLayer action removed terra-cr base layer', () => {
    let layers = addLayer('terra-cr', {}, [], config.layers, 0);
    const def = layers[0];
    layers = addMockLayer('aqua-cr', layers);
    layers = addMockLayer('terra-aod', layers);
    layers = addMockLayer('aqua-aod', layers);
    const store = mockStore(getState(layers));
    store.dispatch(LAYER_ACTIONS.removeLayer('terra-cr'));
    const actionResponse = store.getActions()[0];
    const expectedPayload = {
      type: LAYER_CONSTANTS.REMOVE_LAYER,
      id: 'terra-cr',
      index: 3,
      activeString: 'active',
      def,
    };
    expect(actionResponse).toEqual(expectedPayload);
  });

  test('Do nothing on removing a non-existant layer', () => {
    let layers = addLayer('terra-cr', {}, [], config.layers, 0);
    layers = addMockLayer('terra-aod', layers);
    layers = addMockLayer('aqua-aod', layers);
    const store = mockStore(getState(layers));
    store.dispatch(LAYER_ACTIONS.removeLayer('INVALID TEST LAYER ID'));
    const actionResponse = store.getActions()[0];
    const expectedPayload = undefined;
    expect(actionResponse).toEqual(expectedPayload);
  });
});
