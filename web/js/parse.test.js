import parse from './parse';

jest.mock('lodash', () => ({
  each: jest.fn((arr, fn) => arr.forEach(fn)),
}));

jest.mock('./map/map', () => ({
  mapParser: jest.fn(),
}));

import { mapParser } from './map/map';

describe('parse', () => {
  const parameters = { t: '2020-01-01' };
  const config = { layers: {} };
  const errors = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the parameters state object', () => {
    const result = parse(parameters, config, errors);
    expect(result).toBe(parameters);
  });

  it('calls mapParser with state, errors, and config', () => {
    parse(parameters, config, errors);
    expect(mapParser).toHaveBeenCalledWith(parameters, errors, config);
  });

  it('calls mapParser exactly once', () => {
    parse(parameters, config, errors);
    expect(mapParser).toHaveBeenCalledTimes(1);
  });

  it('passes errors array to mapParser', () => {
    const customErrors = [{ message: 'test error' }];
    parse(parameters, config, customErrors);
    expect(mapParser).toHaveBeenCalledWith(parameters, customErrors, config);
  });

  it('passes config to mapParser', () => {
    const customConfig = { layers: { 'terra-aod': {} } };
    parse(parameters, customConfig, errors);
    expect(mapParser).toHaveBeenCalledWith(parameters, errors, customConfig);
  });

  it('returns state even when parameters is empty object', () => {
    const emptyParams = {};
    const result = parse(emptyParams, config, errors);
    expect(result).toBe(emptyParams);
  });
});
