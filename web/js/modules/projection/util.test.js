import update from 'immutability-helper';
import { mapLocationToProjState, getProjInitialState } from './util';
import fixtures from '../../fixtures';

const state = fixtures.getState();
const proj = {
  id: 'some-test-projection',
};
const config = {
  defaults: {
    projection: 'some-test-projection',
  },
  projections: {
    'some-test-projection': proj,
  },
};
test('getProjInitialState with given projeciton [projection-initial-state]', () => {
  const response = {
    id: 'some-test-projection',
    selected: proj,
  };
  const initialState = getProjInitialState(config);
  expect(initialState.id).toBe(response.id);
  expect(initialState.selected.id).toBe(response.selected.id);
});
test('Default proj should be geographic [projection-default-geographic]', () => {
  const emptyConfig = {
    defaults: {},
  };
  const response = {
    id: 'geographic',
    selected: {},
  };
  const initialState = getProjInitialState(emptyConfig);
  expect(initialState.id).toBe(response.id);
});
test('mapLocationToProjState: Update proj:id key onload [projection-update-id]', () => {
  const state = {
    config,
    proj: {
      selected: {},
    },
  };
  const stateFromLocation = {
    proj,
  };
  const newState = mapLocationToProjState({}, stateFromLocation, state);
  expect(newState.proj.id).toBe('some-test-projection');
});

test('legacy switch parameter for projection [projection-legacy-switch]', () => {
  const param = {
    switch: 'some-test-projection',
  };
  const stateFromLocation = {
    proj,
  };
  const localState = update(state, {
    config: {
      $set: config,
    },
  });
  const newStateFromLocation = mapLocationToProjState(
    param,
    stateFromLocation,
    localState,
  );
  expect(newStateFromLocation.proj.id).toBe('some-test-projection');
  expect(newStateFromLocation.proj.selected.id).toBe('some-test-projection');
});
