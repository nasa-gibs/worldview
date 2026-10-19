import {
  startRequest,
  fetchSuccess,
  fetchFailure,
  requestAction,
} from './actions';

beforeEach(() => {
  jest.resetAllMocks();
});

test('startRequest returns correct type without id [actions-start-no-id]', () => {
  const result = startRequest('FETCH_DATA');
  expect(result).toEqual({ type: 'FETCH_DATA_START' });
  expect(result.id).toBeUndefined();
});

test('startRequest returns correct type with id [actions-start-with-id]', () => {
  const result = startRequest('FETCH_DATA', 'abc123');
  expect(result).toEqual({ type: 'FETCH_DATA_START', id: 'abc123' });
});

test('startRequest does not include id when id is falsy [actions-start-falsy-id]', () => {
  const result = startRequest('FETCH_DATA', 0);
  expect(result.id).toBeUndefined();
});

test('fetchSuccess returns correct type and response without id [actions-success-no-id]', () => {
  const result = fetchSuccess('FETCH_DATA', { key: 'value' });
  expect(result).toEqual({ type: 'FETCH_DATA_SUCCESS', response: { key: 'value' } });
  expect(result.id).toBeUndefined();
});

test('fetchSuccess returns correct type, response, and id [actions-success-with-id]', () => {
  const result = fetchSuccess('FETCH_DATA', { key: 'value' }, 'abc123');
  expect(result).toEqual({ type: 'FETCH_DATA_SUCCESS', response: { key: 'value' }, id: 'abc123' });
});

test('fetchFailure returns correct type and error without id [actions-failure-no-id]', () => {
  const error = new Error('something went wrong');
  const result = fetchFailure('FETCH_DATA', error);
  expect(result).toEqual({ type: 'FETCH_DATA_FAILURE', error });
  expect(result.id).toBeUndefined();
});

test('fetchFailure returns correct type, error, and id [actions-failure-with-id]', () => {
  const error = new Error('something went wrong');
  const result = fetchFailure('FETCH_DATA', error, 'abc123');
  expect(result).toEqual({ type: 'FETCH_DATA_FAILURE', error, id: 'abc123' });
});

test('requestAction dispatches start and success, returns json data [actions-request-json]', async () => {
  const mockData = { result: 'ok' };
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue(mockData),
    text: jest.fn(),
  });
  const dispatch = jest.fn();

  const result = await requestAction(dispatch, 'FETCH_DATA', '/api/data', 'application/json', undefined, {});

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'FETCH_DATA_START' });
  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'FETCH_DATA_SUCCESS', response: mockData });
  expect(result).toEqual(mockData);
});

test('requestAction dispatches start and success, returns text data [actions-request-text]', async () => {
  const mockText = '<xml>data</xml>';
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn(),
    text: jest.fn().mockResolvedValue(mockText),
  });
  const dispatch = jest.fn();

  const result = await requestAction(dispatch, 'FETCH_DATA', '/api/data', 'text/xml', undefined, {});

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'FETCH_DATA_START' });
  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'FETCH_DATA_SUCCESS', response: mockText });
  expect(result).toEqual(mockText);
});

test('requestAction includes id in dispatched actions when provided [actions-request-with-id]', async () => {
  const mockData = { result: 'ok' };
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue(mockData),
    text: jest.fn(),
  });
  const dispatch = jest.fn();

  await requestAction(dispatch, 'FETCH_DATA', '/api/data', 'application/json', 'myId', {});

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'FETCH_DATA_START', id: 'myId' });
  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'FETCH_DATA_SUCCESS', response: mockData, id: 'myId' });
});

test('requestAction dispatches failure and calls console.error on fetch error [actions-request-failure]', async () => {
  const mockError = new Error('network failure');
  global.fetch = jest.fn().mockRejectedValue(mockError);
  const dispatch = jest.fn();
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await requestAction(dispatch, 'FETCH_DATA', '/api/data', 'application/json', undefined, {});

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'FETCH_DATA_START' });
  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'FETCH_DATA_FAILURE', error: mockError });
  expect(consoleSpy).toHaveBeenCalledWith(mockError);

  consoleSpy.mockRestore();
});

test('requestAction dispatches failure with id on fetch error [actions-request-failure-with-id]', async () => {
  const mockError = new Error('network failure');
  global.fetch = jest.fn().mockRejectedValue(mockError);
  const dispatch = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});

  await requestAction(dispatch, 'FETCH_DATA', '/api/data', 'application/json', 'errId', {});

  expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'FETCH_DATA_START', id: 'errId' });
  expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'FETCH_DATA_FAILURE', error: mockError, id: 'errId' });
});
