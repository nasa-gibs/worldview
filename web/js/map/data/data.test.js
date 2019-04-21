import { dataParser } from './data';

function testConfig() {
  return {
    products: {
      'product1': {}
    }
  };
};

test('parses state, 1.1', () => {
  let state = { dataDownload: 'product1' };
  let errors = [];
  dataParser(state, errors, testConfig());
  expect(state.download).toBe('product1');
  expect(errors).toHaveLength(0);
});

test('parses state, 1.2', () => {
  let state = { download: 'product1' };
  let errors = [];
  dataParser(state, errors, testConfig());
  expect(state.download).toBe('product1');
  expect(errors).toHaveLength(0);
});

test('error on invalid product', () => {
  let state = { download: 'productX' };
  let errors = [];
  dataParser(state, errors, testConfig());
  expect(state.download).not.toBe('productX');
  expect(errors).toHaveLength(1);
});
