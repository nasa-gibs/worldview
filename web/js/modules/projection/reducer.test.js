import projectionReducer, { projectionState } from './reducer';
import { CHANGE_PROJECTION } from './constants';

jest.mock('./constants', () => ({
  CHANGE_PROJECTION: 'CHANGE_PROJECTION',
}));

describe('projectionState', () => {
  it('has a default id of geographic', () => {
    expect(projectionState.id).toBe('geographic');
  });

  it('has a default selected of empty object', () => {
    expect(projectionState.selected).toEqual({});
  });
});

describe('projectionReducer', () => {
  it('returns the default state when called with no arguments', () => {
    const state = projectionReducer(undefined, {});
    expect(state).toEqual(projectionState);
  });

  it('returns the existing state for an unknown action type', () => {
    const existingState = { id: 'arctic', selected: { crs: 'EPSG:3413' } };
    const state = projectionReducer(existingState, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(existingState);
  });

  it('returns the default state for an unknown action type when state is undefined', () => {
    const state = projectionReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(projectionState);
  });

  it('handles CHANGE_PROJECTION and updates id', () => {
    const action = {
      type: CHANGE_PROJECTION,
      id: 'arctic',
      selected: { crs: 'EPSG:3413' },
    };
    const state = projectionReducer(undefined, action);
    expect(state.id).toBe('arctic');
  });

  it('handles CHANGE_PROJECTION and updates selected', () => {
    const action = {
      type: CHANGE_PROJECTION,
      id: 'arctic',
      selected: { crs: 'EPSG:3413' },
    };
    const state = projectionReducer(undefined, action);
    expect(state.selected).toEqual({ crs: 'EPSG:3413' });
  });

  it('handles CHANGE_PROJECTION and preserves other state properties', () => {
    const existingState = { id: 'geographic', selected: {}, extraProp: 'value' };
    const action = {
      type: CHANGE_PROJECTION,
      id: 'antarctic',
      selected: { crs: 'EPSG:3031' },
    };
    const state = projectionReducer(existingState, action);
    expect(state.extraProp).toBe('value');
  });

  it('handles CHANGE_PROJECTION from a non-default initial state', () => {
    const existingState = { id: 'arctic', selected: { crs: 'EPSG:3413' } };
    const action = {
      type: CHANGE_PROJECTION,
      id: 'antarctic',
      selected: { crs: 'EPSG:3031' },
    };
    const state = projectionReducer(existingState, action);
    expect(state).toEqual({ id: 'antarctic', selected: { crs: 'EPSG:3031' } });
  });

  it('does not mutate the existing state on CHANGE_PROJECTION', () => {
    const existingState = { id: 'geographic', selected: {} };
    const action = {
      type: CHANGE_PROJECTION,
      id: 'arctic',
      selected: { crs: 'EPSG:3413' },
    };
    projectionReducer(existingState, action);
    expect(existingState).toEqual({ id: 'geographic', selected: {} });
  });

  it('handles CHANGE_PROJECTION with an empty selected object', () => {
    const action = {
      type: CHANGE_PROJECTION,
      id: 'geographic',
      selected: {},
    };
    const state = projectionReducer(undefined, action);
    expect(state).toEqual({ id: 'geographic', selected: {} });
  });
});
