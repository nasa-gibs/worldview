import update from 'immutability-helper';
import { mapLocationToProjState, getProjInitialState, parseProjection } from './util';
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
    geographic: { id: 'geographic' },
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

test('getProjInitialState returns empty object for selected when projection not found', () => {
  const emptyConfig = {
    defaults: {},
  };
  const initialState = getProjInitialState(emptyConfig);
  expect(initialState.selected).toEqual({});
});

test('getProjInitialState returns correct selected object when projection exists', () => {
  const initialState = getProjInitialState(config);
  expect(initialState.selected).toEqual(proj);
});

test('parseProjection returns the projection string when it exists in config', () => {
  const result = parseProjection('some-test-projection', config);
  expect(result).toBe('some-test-projection');
});

test('parseProjection returns geographic when projection does not exist in config', () => {
  const result = parseProjection('non-existent-projection', config);
  expect(result).toBe('geographic');
});

test('parseProjection returns geographic when config has no projections', () => {
  const emptyConfig = { projections: {} };
  const result = parseProjection('arctic', emptyConfig);
  expect(result).toBe('geographic');
});

test('parseProjection returns geographic for undefined projection string', () => {
  const result = parseProjection(undefined, config);
  expect(result).toBe('geographic');
});

test('mapLocationToProjState: Update proj:id key onload [projection-update-id]', () => {
  const stateMock = {
    config,
    proj: {
      selected: {},
    },
  };
  const stateFromLocation = {
    proj,
  };
  const newState = mapLocationToProjState({}, stateFromLocation, stateMock);
  expect(newState.proj.id).toBe('some-test-projection');
});

test('mapLocationToProjState: sets geographic selected when no p or switch param', () => {
  const localState = update(state, {
    config: { $set: config },
  });
  const stateFromLocation = {
    proj: { id: 'geographic' },
  };
  const newState = mapLocationToProjState({}, stateFromLocation, localState);
  expect(newState.proj.selected).toEqual({ id: 'geographic' });
});

test('mapLocationToProjState: sets selected to undefined when geographic not in config', () => {
  const configWithoutGeographic = {
    defaults: { projection: 'some-test-projection' },
    projections: {
      'some-test-projection': proj,
    },
  };
  const localState = update(state, {
    config: { $set: configWithoutGeographic },
  });
  const stateFromLocation = {
    proj: { id: 'some-test-projection' },
  };
  const newState = mapLocationToProjState({}, stateFromLocation, localState);
  expect(newState.proj.selected).toBeUndefined();
});

test('mapLocationToProjState: p parameter updates selected based on proj.id', () => {
  const localState = update(state, {
    config: { $set: config },
  });
  const stateFromLocation = {
    proj: { id: 'some-test-projection' },
  };
  const newState = mapLocationToProjState({ p: 'some-test-projection' }, stateFromLocation, localState);
  expect(newState.proj.selected).toEqual(proj);
});

test('mapLocationToProjState: p parameter does not update when proj.id not found in config', () => {
  const localState = update(state, {
    config: { $set: config },
  });
  const stateFromLocation = {
    proj: { id: 'non-existent' },
  };
  const newState = mapLocationToProjState({ p: 'non-existent' }, stateFromLocation, localState);
  expect(newState.proj.selected).toBeUndefined();
});

test('mapLocationToProjState: p parameter preserves existing proj properties', () => {
  const localState = update(state, {
    config: { $set: config },
  });
  const stateFromLocation = {
    proj: { id: 'some-test-projection', extraProp: 'preserved' },
  };
  const newState = mapLocationToProjState({ p: 'some-test-projection' }, stateFromLocation, localState);
  expect(newState.proj.extraProp).toBe('preserved');
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

test('mapLocationToProjState: switch parameter does not update when id not found in config', () => {
  const param = {
    switch: 'non-existent-projection',
  };
  const stateFromLocation = {
    proj,
  };
  const localState = update(state, {
    config: { $set: config },
  });
  const newStateFromLocation = mapLocationToProjState(param, stateFromLocation, localState);
  expect(newStateFromLocation.proj).toEqual(proj);
});

test('mapLocationToProjState: returns stateFromLocation unchanged when switch projection not in config', () => {
  const param = { switch: 'invalid-proj' };
  const stateFromLocation = { proj: { id: 'geographic', selected: { id: 'geographic' } } };
  const localState = update(state, {
    config: { $set: config },
  });
  const newState = mapLocationToProjState(param, stateFromLocation, localState);
  expect(newState.proj.id).toBe('geographic');
});
