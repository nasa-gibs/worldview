import {
  defaultRequestState,
  requestResponse,
  requestReducer,
} from './reducers';

test('defaultRequestState has correct initial shape [reducers-default-state]', () => {
  expect(defaultRequestState).toEqual({
    isLoading: false,
    error: null,
    response: null,
    type: null,
  });
});

test('requestResponse returns defaultRequestState when called with no args [reducers-response-no-args]', () => {
  const result = requestResponse();
  expect(result).toEqual(defaultRequestState);
});

test('requestResponse merges provided props over defaultRequestState [reducers-response-with-props]', () => {
  const result = requestResponse({ isLoading: true, response: { data: 1 } });
  expect(result.isLoading).toBe(true);
  expect(result.response).toEqual({ data: 1 });
  expect(result.error).toBeNull();
  expect(result.type).toBeNull();
});

test('requestResponse does not mutate defaultRequestState [reducers-response-no-mutation]', () => {
  requestResponse({ isLoading: true });
  expect(defaultRequestState.isLoading).toBe(false);
});

test('requestReducer handles START action [reducers-reducer-start]', () => {
  const result = requestReducer('FETCH_DATA', {}, { type: 'FETCH_DATA_START' });
  expect(result.isLoading).toBe(true);
  expect(result.response).toBeNull();
  expect(result.error).toBeNull();
});

test('requestReducer handles SUCCESS action with response [reducers-reducer-success]', () => {
  const mockResponse = { items: [1, 2, 3] };
  const result = requestReducer('FETCH_DATA', {}, { type: 'FETCH_DATA_SUCCESS', response: mockResponse });
  expect(result.isLoading).toBe(false);
  expect(result.response).toEqual(mockResponse);
  expect(result.error).toBeNull();
});

test('requestReducer handles FAILURE action with error [reducers-reducer-failure]', () => {
  const mockError = new Error('failed');
  const result = requestReducer('FETCH_DATA', {}, { type: 'FETCH_DATA_FAILURE', error: mockError });
  expect(result.isLoading).toBe(false);
  expect(result.response).toBeNull();
  expect(result.error).toEqual(mockError);
});

test('requestReducer returns current state on unknown action type [reducers-reducer-default]', () => {
  const currentState = { isLoading: false, error: null, response: { data: 'cached' }, type: null };
  const result = requestReducer('FETCH_DATA', currentState, { type: 'UNRELATED_ACTION' });
  expect(result.response).toEqual({ data: 'cached' });
  expect(result.isLoading).toBe(false);
});

test('requestReducer does not match START of a different actionName [reducers-reducer-no-cross-match]', () => {
  const currentState = { isLoading: false, error: null, response: { data: 'cached' }, type: null };
  const result = requestReducer('FETCH_DATA', currentState, { type: 'OTHER_ACTION_START' });
  expect(result.isLoading).toBe(false);
  expect(result.response).toEqual({ data: 'cached' });
});

test('requestReducer SUCCESS sets isLoading to false [reducers-reducer-success-not-loading]', () => {
  const loadingState = { isLoading: true, error: null, response: null, type: null };
  const result = requestReducer('MY_ACTION', loadingState, { type: 'MY_ACTION_SUCCESS', response: 'ok' });
  expect(result.isLoading).toBe(false);
  expect(result.response).toBe('ok');
});

test('requestReducer FAILURE sets isLoading to false [reducers-reducer-failure-not-loading]', () => {
  const loadingState = { isLoading: true, error: null, response: null, type: null };
  const mockError = new Error('oops');
  const result = requestReducer('MY_ACTION', loadingState, { type: 'MY_ACTION_FAILURE', error: mockError });
  expect(result.isLoading).toBe(false);
  expect(result.error).toEqual(mockError);
  expect(result.response).toBeNull();
});
