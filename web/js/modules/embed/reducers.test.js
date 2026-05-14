import embedReducers, { embedState } from './reducers';

describe('embedState', () => {
  test('has isEmbedModeActive set to false by default [embed-state-default]', () => {
    expect(embedState.isEmbedModeActive).toBe(false);
  });

  test('has exactly one key [embed-state-shape]', () => {
    expect(Object.keys(embedState)).toEqual(['isEmbedModeActive']);
  });
});

describe('embedReducers', () => {
  test('returns the initial embedState when called with no state [embed-reducer-initial]', () => {
    const result = embedReducers(undefined, {});
    expect(result).toEqual(embedState);
  });

  test('returns the initial embedState when called with an empty action [embed-reducer-empty-action]', () => {
    const result = embedReducers(embedState, {});
    expect(result).toEqual(embedState);
  });

  test('returns existing state unchanged for unknown action type [embed-reducer-unknown-action]', () => {
    const result = embedReducers(embedState, { type: 'UNKNOWN_ACTION' });
    expect(result).toEqual(embedState);
  });

  test('returns existing state unchanged for any action [embed-reducer-any-action]', () => {
    const result = embedReducers(embedState, { type: 'SOME_OTHER_ACTION', payload: 123 });
    expect(result).toBe(embedState);
  });

  test('preserves a custom state passed in [embed-reducer-custom-state]', () => {
    const customState = { isEmbedModeActive: true };
    const result = embedReducers(customState, { type: 'UNKNOWN' });
    expect(result).toEqual(customState);
    expect(result.isEmbedModeActive).toBe(true);
  });

  test('does not mutate the state object [embed-reducer-no-mutation]', () => {
    const customState = { isEmbedModeActive: true };
    const result = embedReducers(customState, { type: 'UNKNOWN' });
    expect(result).toBe(customState);
  });

  test('isEmbedModeActive is false in initial state [embed-reducer-initial-false]', () => {
    const result = embedReducers(undefined, {});
    expect(result.isEmbedModeActive).toBe(false);
  });
});
