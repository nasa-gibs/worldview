/* eslint-disable import/extensions */
import { dataModel } from './model';
import { projectionModel } from '../projection/model';
import { layersModel } from '../layers/model';
import { dateModel } from '../date/model';

function fixture() {
  const config = {
    products: {
      product1: {},
    },
    layers: {
      layer1: {
        id: 'layer1',
        product: 'product1',
        group: 'overlays',
        projections: {
          geographic: {},
        },
      },
    },
  };

  const models = {};
  models.proj = projectionModel(config);
  models.proj.selected = { id: 'geographic' };
  models.layers = layersModel(models, config);
  models.layers.add('layer1');
  models.date = dateModel(models, config);
  models.data = dataModel(models, config);

  return models;
}

test('does not save state when not active', () => {
  const models = fixture();
  models.data.selectProduct('product1');
  const state = {};
  models.data.save(state);
  expect(state.download).toBeFalsy();
});

test('saves state', () => {
  const models = fixture();
  models.data.active = true;
  models.data.selectedProduct = 'product1';
  const state = {};
  models.data.save(state);
  expect(state.download).toBe('product1');
});

test('subscribed for startup event when data download in load state', () => {
  const models = fixture();
  const eventsOn = jest.fn();
  models.wv = {
    events: {
      on: eventsOn,
    },
  };
  const state = {
    download: 'product1',
  };
  const errors = [];
  models.data.load(state, errors);
  expect(errors).toHaveLength(0);
  expect(eventsOn.mock.calls[0][0]).toBe('startup');
});

test('error product is in state when no active layer is found', () => {
  const models = fixture();
  const eventsOn = jest.fn();
  models.wv = {
    events: {
      on: eventsOn,
    },
  };
  models.layers.remove('layer1');
  const state = {
    download: 'product1',
  };
  const errors = [];
  models.data.load(state, errors);
  expect(errors).toHaveLength(1);
  expect(eventsOn).toHaveBeenCalledTimes(0);
});
