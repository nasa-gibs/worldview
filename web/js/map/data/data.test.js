import dataParser from './data';

function testConfig() {
  return {
    products: {
      product1: {},
    },
  };
}

test('parses state, 1.1', () => {
  const state = { dataDownload: 'product1' };
  const errors = [];
  dataParser(state, errors, testConfig());
  expect(state.download).toBe('product1');
  expect(errors).toHaveLength(0);
});

test('parses state, 1.2', () => {
  const state = { download: 'product1' };
  const errors = [];
  dataParser(state, errors, testConfig());
  expect(state.download).toBe('product1');
  expect(errors).toHaveLength(0);
});

test('error on invalid product', () => {
  const state = { download: 'productX' };
  const errors = [];
  dataParser(state, errors, testConfig());
  expect(state.download).not.toBe('productX');
  expect(errors).toHaveLength(1);
});
