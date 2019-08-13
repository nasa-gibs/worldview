import { mapLocationToProjState, getProjInitialState } from './util';
import fixtures from '../../fixtures';
import update from 'immutability-helper';
const state = fixtures.getState();
const proj = {
  id: 'some-test-projection'
};
const config = {
  defaults: {
    projection: 'some-test-projection'
  },
  projections: {
    'some-test-projection': proj
  }
};
test('getProjInitialState with given projeciton', () => {
  const response = {
    id: 'some-test-projection',
    selected: proj
  };
  const initialState = getProjInitialState(config);
  expect(initialState.id).toBe(response.id);
  expect(initialState.selected.id).toBe(response.selected.id);
});
test('Default proj should be geographic', () => {
  const emptyConfig = {
    defaults: {}
  };
  const response = {
    id: 'geographic',
    selected: {}
  };
  const initialState = getProjInitialState(emptyConfig);
  expect(initialState.id).toBe(response.id);
});
test('mapLocationToProjState: Update proj:id key onload', () => {
  const state = {
    config: config,
    proj: {
      selected: {}
    }
  };
  const stateFromLocation = {
    proj: proj
  };
  const newState = mapLocationToProjState({}, stateFromLocation, state);
  expect(newState.proj.id).toBe('some-test-projection');
});

test('legacy switch parameter for projection', () => {
  const param = {
    switch: 'some-test-projection'
  };
  const stateFromLocation = {
    proj: proj
  };
  const localState = update(state, {
    config: {
      $set: config
    }
  });
  const newStateFromLocation = mapLocationToProjState(
    param,
    stateFromLocation,
    localState
  );
  expect(newStateFromLocation.proj.id).toBe('some-test-projection');
  expect(newStateFromLocation.proj.selected.id).toBe('some-test-projection');
});
