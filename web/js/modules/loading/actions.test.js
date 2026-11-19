import {
  LOADING_GRANULES,
  MAP_LOADING,
  startLoading,
  stopLoading,
} from './actions';
import { LOADING_START, LOADING_STOP } from './constants';

jest.mock('./constants', () => ({
  LOADING_START: 'LOADING_START',
  LOADING_STOP: 'LOADING_STOP',
}));

describe('action constants', () => {
  it('exports LOADING_GRANULES', () => {
    expect(LOADING_GRANULES).toBe('LOADING/GRANULES');
  });

  it('exports MAP_LOADING', () => {
    expect(MAP_LOADING).toBe('LOADING/MAP_LOADING');
  });
});

describe('startLoading', () => {
  it('dispatches LOADING_START when animation is not playing', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ animation: { isPlaying: false } });

    startLoading('testKey', 'testMsg')(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: LOADING_START,
      key: 'testKey',
      msg: 'testMsg',
    });
  });

  it('does not dispatch when animation is playing', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ animation: { isPlaying: true } });

    startLoading('testKey', 'testMsg')(dispatch, getState);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('calls getState to retrieve animation state', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ animation: { isPlaying: false } });

    startLoading('anyKey', 'anyMsg')(dispatch, getState);

    expect(getState).toHaveBeenCalledTimes(1);
  });
});

describe('stopLoading', () => {
  it('dispatches LOADING_STOP when animation is not playing', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ animation: { isPlaying: false } });

    stopLoading('testKey')(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: LOADING_STOP,
      key: 'testKey',
    });
  });

  it('does not dispatch when animation is playing', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ animation: { isPlaying: true } });

    stopLoading('testKey')(dispatch, getState);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('calls getState to retrieve animation state', () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue({ animation: { isPlaying: false } });

    stopLoading('anyKey')(dispatch, getState);

    expect(getState).toHaveBeenCalledTimes(1);
  });
});
