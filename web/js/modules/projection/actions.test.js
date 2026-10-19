import changeProjection from './actions';
import { CHANGE_PROJECTION } from './constants';
import { onProjectionSwitch } from '../product-picker/actions';
import { stop } from '../animation/actions';

jest.mock('./constants', () => ({
  CHANGE_PROJECTION: 'CHANGE_PROJECTION',
}));

jest.mock('../product-picker/actions', () => ({
  onProjectionSwitch: jest.fn((id) => ({ type: 'ON_PROJECTION_SWITCH', id })),
}));

jest.mock('../animation/actions', () => ({
  stop: jest.fn(() => ({ type: 'STOP' })),
}));

describe('changeProjection', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jest.fn();
    jest.clearAllMocks();
  });

  const buildGetState = (overrides = {}) => () => ({
    config: {
      projections: {
        arctic: { crs: 'EPSG:3413' },
      },
      ...overrides.config,
    },
    animation: {
      isPlaying: false,
      ...(overrides.animation || {}),
    },
  });

  it('returns a thunk function', () => {
    const thunk = changeProjection('arctic');
    expect(typeof thunk).toBe('function');
  });

  it('dispatches onProjectionSwitch with the given id', () => {
    const getState = buildGetState();
    changeProjection('arctic')(dispatch, getState);
    expect(onProjectionSwitch).toHaveBeenCalledWith('arctic');
    expect(dispatch).toHaveBeenCalledWith({ type: 'ON_PROJECTION_SWITCH', id: 'arctic' });
  });

  it('dispatches CHANGE_PROJECTION with id and selected projection', () => {
    const getState = buildGetState();
    changeProjection('arctic')(dispatch, getState);
    expect(dispatch).toHaveBeenCalledWith({
      type: CHANGE_PROJECTION,
      id: 'arctic',
      selected: { crs: 'EPSG:3413' },
    });
  });

  it('does not dispatch stop when animation is not playing', () => {
    const getState = buildGetState({ animation: { isPlaying: false } });
    changeProjection('arctic')(dispatch, getState);
    expect(stop).not.toHaveBeenCalled();
  });

  it('dispatches stop when animation is playing', () => {
    const getState = buildGetState({ animation: { isPlaying: true } });
    changeProjection('arctic')(dispatch, getState);
    expect(stop).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'STOP' });
  });

  it('dispatches in correct order when animation is playing', () => {
    const getState = buildGetState({ animation: { isPlaying: true } });
    changeProjection('arctic')(dispatch, getState);
    const calls = dispatch.mock.calls.map((c) => c[0]);
    expect(calls[0]).toEqual({ type: 'ON_PROJECTION_SWITCH', id: 'arctic' });
    expect(calls[1]).toEqual({ type: 'STOP' });
    expect(calls[2]).toEqual({ type: CHANGE_PROJECTION, id: 'arctic', selected: { crs: 'EPSG:3413' } });
  });

  it('dispatches in correct order when animation is not playing', () => {
    const getState = buildGetState({ animation: { isPlaying: false } });
    changeProjection('arctic')(dispatch, getState);
    const calls = dispatch.mock.calls.map((c) => c[0]);
    expect(calls[0]).toEqual({ type: 'ON_PROJECTION_SWITCH', id: 'arctic' });
    expect(calls[1]).toEqual({ type: CHANGE_PROJECTION, id: 'arctic', selected: { crs: 'EPSG:3413' } });
    expect(calls.length).toBe(2);
  });

  it('throws an error when projection id is invalid', () => {
    const getState = buildGetState();
    expect(() => changeProjection('invalid')(dispatch, getState)).toThrow(
      'Invalid projection: invalid',
    );
  });

  it('throws an error when projections config is empty', () => {
    const getState = () => ({
      config: { projections: {} },
      animation: { isPlaying: false },
    });
    expect(() => changeProjection('arctic')(dispatch, getState)).toThrow(
      'Invalid projection: arctic',
    );
  });

  it('does not dispatch anything when projection is invalid', () => {
    const getState = buildGetState();
    try {
      changeProjection('invalid')(dispatch, getState);
    } catch {
    }
    expect(dispatch).not.toHaveBeenCalled();
  });
});
