import { mapLocationToProjState, getProjInitialState } from './util';

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
  let response = {
    id: 'some-test-projection',
    selected: proj
  };
  const initialState = getProjInitialState(config);
  expect(initialState.id).toBe(response.id);
  expect(initialState.selected.id).toBe(response.selected.id);
});
test('Default proj should be geographic', () => {
  let emptyConfig = {
    defaults: {}
  };
  let response = {
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
  const newState = mapLocationToProjState(null, stateFromLocation, state);
  expect(newState.proj.id).toBe('some-test-projection');
});
