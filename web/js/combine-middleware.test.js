import getMiddleware from './combine-middleware';

jest.mock('redux-logger', () => ({
  createLogger: jest.fn(() => 'loggerMiddleware'),
}));

jest.mock('redux-thunk', () => ({
  thunk: 'thunk',
}));

describe('getMiddleware', () => {
  const locationMiddleware = 'locationMiddleware';

  it('includes thunk when enableDebugLogger is false', () => {
    const middleware = getMiddleware(false, locationMiddleware);
    expect(middleware).toContain('thunk');
  });

  it('includes locationMiddleware when enableDebugLogger is false', () => {
    const middleware = getMiddleware(false, locationMiddleware);
    expect(middleware).toContain(locationMiddleware);
  });

  it('does not include loggerMiddleware when enableDebugLogger is false', () => {
    const middleware = getMiddleware(false, locationMiddleware);
    expect(middleware).not.toContain('loggerMiddleware');
  });

  it('includes thunk when enableDebugLogger is true', () => {
    const middleware = getMiddleware(true, locationMiddleware);
    expect(middleware).toContain('thunk');
  });

  it('includes locationMiddleware when enableDebugLogger is true', () => {
    const middleware = getMiddleware(true, locationMiddleware);
    expect(middleware).toContain(locationMiddleware);
  });

  it('includes loggerMiddleware when enableDebugLogger is true', () => {
    const middleware = getMiddleware(true, locationMiddleware);
    expect(middleware).toContain('loggerMiddleware');
  });

  it('returns array of length 2 when enableDebugLogger is false', () => {
    const middleware = getMiddleware(false, locationMiddleware);
    expect(middleware).toHaveLength(2);
  });

  it('returns array of length 3 when enableDebugLogger is true', () => {
    const middleware = getMiddleware(true, locationMiddleware);
    expect(middleware).toHaveLength(3);
  });

  it('compacts out falsy locationMiddleware when enableDebugLogger is false', () => {
    const middleware = getMiddleware(false, null);
    expect(middleware).toHaveLength(1);
    expect(middleware).toContain('thunk');
  });

  it('compacts out falsy locationMiddleware when enableDebugLogger is true', () => {
    const middleware = getMiddleware(true, null);
    expect(middleware).toHaveLength(2);
    expect(middleware).toContain('thunk');
    expect(middleware).toContain('loggerMiddleware');
  });

  it('returns an array', () => {
    expect(Array.isArray(getMiddleware(false, locationMiddleware))).toBe(true);
  });

  it('order is thunk, locationMiddleware when enableDebugLogger is false', () => {
    const middleware = getMiddleware(false, locationMiddleware);
    expect(middleware[0]).toBe('thunk');
    expect(middleware[1]).toBe(locationMiddleware);
  });

  it('order is thunk, locationMiddleware, loggerMiddleware when enableDebugLogger is true', () => {
    const middleware = getMiddleware(true, locationMiddleware);
    expect(middleware[0]).toBe('thunk');
    expect(middleware[1]).toBe(locationMiddleware);
    expect(middleware[2]).toBe('loggerMiddleware');
  });
import { thunk } from 'redux-thunk'; // For ASYNC actions
import { compact } from 'lodash';
import { createLogger } from 'redux-logger';
import getMiddleware from './combine-middleware';

jest.mock('redux-thunk', () => ({
  thunk: jest.fn(),
}));

jest.mock('lodash', () => ({
  compact: jest.fn((arr) => arr),
}));

jest.mock('redux-logger', () => ({
  createLogger: jest.fn(),
}));

test('combine-middleware - debugger enabled', () => {
  const loggerMiddleware = createLogger();
  const result = getMiddleware(true, {});
  console.log(result);
  expect(compact).toHaveBeenCalledWith([thunk, {}, loggerMiddleware]);
});

test('combine-middleware - debugger disabled', () => {
  const result = getMiddleware(false, {});
  console.log(result);
  expect(compact).toHaveBeenCalledWith([thunk, {}]);
});
