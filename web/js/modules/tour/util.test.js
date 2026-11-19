import { checkTourBuildTimestamp, mapLocationToTourState } from './util';
import googleTagManager from 'googleTagManager';
import safeLocalStorage from '../../util/local-storage';

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

jest.mock('../../util/local-storage', () => ({
  keys: { HIDE_TOUR: 'hideTour' },
  enabled: true,
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('checkTourBuildTimestamp', () => {
  const baseConfig = {
    parameters: {},
    buildDate: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { search: '' };
  });

  it('returns false when safeLocalStorage is not enabled', () => {
    safeLocalStorage.enabled = false;
    const result = checkTourBuildTimestamp(baseConfig);
    expect(result).toBe(false);
    safeLocalStorage.enabled = true;
  });

  it('does not return false for permalink when config.parameters.tour is set', () => {
    window.location = { search: '?tour=true' };
    safeLocalStorage.getItem.mockReturnValue(null);
    const result = checkTourBuildTimestamp({ parameters: { tour: true }, buildDate: null });
    expect(result).toBe(true);
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'tour_start' });
  });

  it('returns false when hideTour is set but no buildDate in config', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-01-01');
    const result = checkTourBuildTimestamp({ parameters: {}, buildDate: null });
    expect(result).toBe(false);
  });

  it('returns true and removes HIDE_TOUR when buildDate is newer than tourDate', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-01-01');
    const result = checkTourBuildTimestamp({ parameters: {}, buildDate: '2024-01-01' });
    expect(result).toBe(true);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('hideTour');
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'tour_start_hidden' }),
    );
  });

  it('returns false when buildDate is older than tourDate', () => {
    safeLocalStorage.getItem.mockReturnValue('2025-01-01');
    const result = checkTourBuildTimestamp({ parameters: {}, buildDate: '2024-01-01' });
    expect(result).toBe(false);
    expect(safeLocalStorage.removeItem).not.toHaveBeenCalled();
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'tour_start_hidden' }),
    );
  });

  it('returns false when buildDate equals tourDate', () => {
    safeLocalStorage.getItem.mockReturnValue('2024-06-01');
    const result = checkTourBuildTimestamp({ parameters: {}, buildDate: '2024-06-01' });
    expect(result).toBe(false);
  });

  it('returns true and fires tour_start event when no hideTour is set', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const result = checkTourBuildTimestamp({ parameters: {}, buildDate: null });
    expect(result).toBe(true);
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'tour_start' });
  });
});

describe('mapLocationToTourState', () => {
  const baseState = {};
  const baseConfig = {};
  const baseStateFromLocation = {
    tour: { active: false },
    embed: { isEmbedModeActive: false },
  };

  it('sets tour.active to true and embed.isEmbedModeActive to true when tr and em are set', () => {
    const parameters = { tr: 'true', em: 'true' };
    const result = mapLocationToTourState(parameters, baseStateFromLocation, baseState, baseConfig);
    expect(result.tour.active).toBe(true);
    expect(result.embed.isEmbedModeActive).toBe(true);
  });

  it('sets tour.active to true but does not change embed when tr is set and em is not true', () => {
    const parameters = { tr: 'true', em: 'false' };
    const result = mapLocationToTourState(parameters, baseStateFromLocation, baseState, baseConfig);
    expect(result.tour.active).toBe(true);
    expect(result.embed.isEmbedModeActive).toBe(false);
  });

  it('sets tour.active to true but does not change embed when tr is set and em is absent', () => {
    const parameters = { tr: 'true' };
    const result = mapLocationToTourState(parameters, baseStateFromLocation, baseState, baseConfig);
    expect(result.tour.active).toBe(true);
    expect(result.embed.isEmbedModeActive).toBe(false);
  });

  it('sets tour.active to false when tr is not set', () => {
    const parameters = {};
    const result = mapLocationToTourState(parameters, baseStateFromLocation, baseState, baseConfig);
    expect(result.tour.active).toBe(false);
  });

  it('sets tour.active to false when tr is not set even if em is true', () => {
    const parameters = { em: 'true' };
    const result = mapLocationToTourState(parameters, baseStateFromLocation, baseState, baseConfig);
    expect(result.tour.active).toBe(false);
  });

  it('does not mutate the original stateFromLocation object', () => {
    const parameters = { tr: 'true', em: 'true' };
    const original = { tour: { active: false }, embed: { isEmbedModeActive: false } };
    mapLocationToTourState(parameters, original, baseState, baseConfig);
    expect(original.tour.active).toBe(false);
    expect(original.embed.isEmbedModeActive).toBe(false);
  });
});
