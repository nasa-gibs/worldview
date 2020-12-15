import { mapLocationToDataState } from './util';
import fixtures from '../../fixtures';

const globalState = fixtures.getState();
const config = {
  products: {
    product1: true,
  },
};

let defaultStateFromLocation = {};
beforeEach(() => {
  defaultStateFromLocation = {
    data: {},
    layers: { active: [{ product: 'product1' }] },
  };
});
test('parses state, 1.1', () => {
  const parameters = { dataDownload: 'product1' };

  const stateFromLocation = mapLocationToDataState(
    parameters,
    defaultStateFromLocation,
    globalState,
    config,
  );
  const selected = stateFromLocation.data.selectedProduct;
  expect(selected).toBe('product1');
});
