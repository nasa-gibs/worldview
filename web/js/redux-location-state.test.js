import { createReduxLocationActions, listenForHistoryChange } from './redux-location-state';

const makeHistory = (locationOverrides = {}) => ({
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    ...locationOverrides,
  },
  push: jest.fn(),
  replace: jest.fn(),
  listen: jest.fn(() => jest.fn()),
});

const makeStore = (state = {}) => ({
  getState: jest.fn(() => state),
  dispatch: jest.fn(),
});

const makeParamSetup = (globalConfig = {}) => ({
  global: globalConfig,
});

describe('createReduxLocationActions', () => {
  let history;
  let store;
  let reducers;
  let mapLocationToState;
  let stateToParams;

  beforeEach(() => {
    history = makeHistory();
    store = makeStore({ proj: { id: 'geographic' } });
    reducers = jest.fn((state) => state || {});
    mapLocationToState = jest.fn((state) => state);
    stateToParams = jest.fn(() => ({
      location: { pathname: '/', search: '', hash: '' },
      shouldPush: false,
    }));
  });

  describe('return value', () => {
    it('returns locationMiddleware and reducersWithLocation', () => {
      const result = createReduxLocationActions(
        makeParamSetup(),
        mapLocationToState,
        history,
        reducers,
        stateToParams,
      );
      expect(result).toHaveProperty('locationMiddleware');
      expect(result).toHaveProperty('reducersWithLocation');
    });

    it('locationMiddleware is a function', () => {
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(typeof locationMiddleware).toBe('function');
    });

    it('reducersWithLocation is a function', () => {
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(typeof reducersWithLocation).toBe('function');
    });
  });

  describe('locationMiddleware', () => {
    it('calls next with the action', () => {
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      const next = jest.fn();
      locationMiddleware(store)(next)({ type: 'TEST' });
      expect(next).toHaveBeenCalledWith({ type: 'TEST' });
    });

    it('returns result of next', () => {
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      const next = jest.fn(() => 'next-result');
      const result = locationMiddleware(store)(next)({ type: 'TEST' });
      expect(result).toBe('next-result');
    });

    it('calls stateToParams when state changes', () => {
      const state1 = { proj: { id: 'geographic' } };
      const state2 = { proj: { id: 'arctic' } };
      const storeObj = {
        getState: jest.fn().mockReturnValueOnce(state1)
          .mockReturnValueOnce(state2),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      const next = jest.fn();
      locationMiddleware(storeObj)(next)({ type: 'TEST' });
      expect(stateToParams).toHaveBeenCalled();
    });

    it('does not call history.push or replace when location is unchanged', () => {
      stateToParams.mockReturnValue({
        location: { pathname: '/', search: '', hash: '' },
        shouldPush: false,
      });
      const storeObj = {
        getState: jest.fn().mockReturnValueOnce({})
          .mockReturnValueOnce({ changed: true }),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      locationMiddleware(storeObj)(jest.fn())({ type: 'TEST' });
      expect(history.push).not.toHaveBeenCalled();
      expect(history.replace).not.toHaveBeenCalled();
    });

    it('calls history.replace when location changes and shouldPush is false', () => {
      stateToParams.mockReturnValue({
        location: { pathname: '/', search: '?p=arctic', hash: '' },
        shouldPush: false,
      });
      const storeObj = {
        getState: jest.fn().mockReturnValueOnce({})
          .mockReturnValueOnce({ changed: true }),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      locationMiddleware(storeObj)(jest.fn())({ type: 'TEST' });
      expect(history.replace).toHaveBeenCalled();
      expect(history.push).not.toHaveBeenCalled();
    });

    it('calls history.push when shouldPush is true and pathname has not changed', () => {
      stateToParams.mockReturnValue({
        location: { pathname: '/', search: '?p=arctic', hash: '' },
        shouldPush: true,
      });
      const storeObj = {
        getState: jest.fn().mockReturnValueOnce({})
          .mockReturnValueOnce({ changed: true }),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      locationMiddleware(storeObj)(jest.fn())({ type: 'TEST' });
      expect(history.push).toHaveBeenCalled();
    });

    it('does not call stateToParams when state is unchanged and pathname is unchanged', () => {
      const state = { proj: { id: 'geographic' } };
      const storeObj = {
        getState: jest.fn().mockReturnValue(state),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      locationMiddleware(storeObj)(jest.fn())({ type: 'TEST' });
      expect(stateToParams).not.toHaveBeenCalled();
    });

    it('passes correct nextLocation to history.replace with fallback values', () => {
      history = makeHistory({ pathname: '/app', search: '', hash: '#section', state: { foo: 'bar' } });
      stateToParams.mockReturnValue({
        location: { search: '?p=arctic' },
        shouldPush: false,
      });
      const storeObj = {
        getState: jest.fn().mockReturnValueOnce({})
          .mockReturnValueOnce({ changed: true }),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      locationMiddleware(storeObj)(jest.fn())({ type: 'TEST' });
      expect(history.replace).toHaveBeenCalledWith(expect.objectContaining({
        search: '?p=arctic',
        pathname: '/app',
        hash: '#section',
        state: { foo: 'bar' },
      }));
    });

    it('handles stateToParams returning no location', () => {
      stateToParams.mockReturnValue({});
      const storeObj = {
        getState: jest.fn().mockReturnValueOnce({})
          .mockReturnValueOnce({ changed: true }),
      };
      const { locationMiddleware } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => locationMiddleware(storeObj)(jest.fn())({ type: 'TEST' })).not.toThrow();
      expect(history.replace).not.toHaveBeenCalled();
    });
  });

  describe('reducersWithLocation', () => {
    it('calls reducers with state and action', () => {
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      const state = { proj: { id: 'geographic' } };
      reducersWithLocation(state, { type: 'TEST' });
      expect(reducers).toHaveBeenCalledWith(state, { type: 'TEST' });
    });

    it('returns reduced state for non-POP actions', () => {
      const reducedState = { proj: { id: 'geographic' } };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      const result = reducersWithLocation({}, { type: 'TEST' });
      expect(result).toBe(reducedState);
    });

    it('returns reduced state when action type is POP but payload is missing', () => {
      const reducedState = { proj: { id: 'geographic' } };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      const result = reducersWithLocation({}, { type: 'REDUX-LOCATION-POP-ACTION' });
      expect(result).toBe(reducedState);
    });

    it('calls mapLocationToState on POP action with payload', () => {
      const reducedState = {
        date: {},
        proj: { id: 'geographic' },
        layers: { active: { layers: [] }, activeB: { layers: [] } },
        locationSearch: {},
        compare: {},
        charting: {},
        palettes: {},
        animation: {},
        sidebar: {},
        tour: {},
        embed: {},
        events: {},
        ui: {},
        smartHandoffs: {},
      };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      });
      expect(mapLocationToState).toHaveBeenCalled();
    });

    it('parses query parameters from location search on POP', () => {
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id', type: 'string' },
      });
      const reducedState = { proj: { id: 'geographic' }, layers: null };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arctic', hash: '' },
      });
      expect(mapLocationToState).toHaveBeenCalledWith(
        reducedState,
        expect.objectContaining({
          query: expect.objectContaining({ proj: { id: 'arctic' } }),
        }),
      );
    });

    it('omits overlayGroups from active layers when seeding baseQuery', () => {
      const reducedState = {
        layers: {
          active: { layers: [], overlayGroups: [{ groupName: 'g1' }] },
          activeB: { layers: [], overlayGroups: [] },
        },
      };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.layers.active).not.toHaveProperty('overlayGroups');
    });

    it('handles null layers gracefully', () => {
      const reducedState = { layers: null };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      })).not.toThrow();
    });

    it('uses options.parse when defined in paramSetup', () => {
      const customParse = jest.fn(() => 'custom-parsed');
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id', options: { parse: customParse } },
      });
      const reducedState = { proj: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arctic', hash: '' },
      });
      expect(customParse).toHaveBeenCalledWith('arctic');
    });

    it('handles bool type parsing', () => {
      const paramSetup = makeParamSetup({
        ab: { stateKey: 'animation.isActive', type: 'bool' },
      });
      const reducedState = { animation: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?ab=true', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.animation.isActive).toBe(true);
    });

    it('handles number type parsing', () => {
      const paramSetup = makeParamSetup({
        av: { stateKey: 'animation.speed', type: 'number' },
      });
      const reducedState = { animation: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?av=5', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.animation.speed).toBe(5);
    });

    it('handles array type parsing', () => {
      const paramSetup = makeParamSetup({
        s: { stateKey: 'locationSearch.coordinates', type: 'array' },
      });
      const reducedState = { locationSearch: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?s=10,20', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.locationSearch.coordinates).toEqual(['10', '20']);
    });

    it('handles object type parsing', () => {
      const paramSetup = makeParamSetup({
        e: { stateKey: 'events', type: 'object' },
      });
      const reducedState = { events: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: `?e=${encodeURIComponent('{"active":true}')}`, hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.events).toEqual({ active: true });
    });

    it('handles date type parsing', () => {
      const paramSetup = makeParamSetup({
        t: { stateKey: 'date.selected', type: 'date' },
      });
      const reducedState = { date: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?t=2020-01-01T00:00:00.000Z', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.date.selected).toBeInstanceOf(Date);
    });

    it('ignores unknown query params', () => {
      const paramSetup = makeParamSetup({});
      const reducedState = {};
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?unknown=value', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query).toEqual({});
    });

    it('handles param without stateKey', () => {
      const paramSetup = makeParamSetup({
        p: { options: {} },
      });
      const reducedState = {};
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arctic', hash: '' },
      })).not.toThrow();
    });

    it('handles empty search string', () => {
      const reducedState = {};
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      })).not.toThrow();
    });

    it('handles object type with invalid JSON gracefully', () => {
      const paramSetup = makeParamSetup({
        e: { stateKey: 'events', type: 'object' },
      });
      const reducedState = { events: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?e=invalidjson{', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.events).toEqual({});
    });

    it('handles array type with empty string', () => {
      const paramSetup = makeParamSetup({
        s: { stateKey: 'locationSearch.coordinates', type: 'array' },
      });
      const reducedState = { locationSearch: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?s=', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.locationSearch.coordinates).toEqual([]);
    });

    it('handles search with param that has no equals sign', () => {
      const paramSetup = makeParamSetup({
        flag: { stateKey: 'ui.flag' },
      });
      const reducedState = { ui: {} };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?flag', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.ui.flag).toBe('');
    });

    it('handles null paramSetup gracefully', () => {
      reducers.mockReturnValue({});
      const { reducersWithLocation } = createReduxLocationActions(
        null, mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arctic', hash: '' },
      })).not.toThrow();
    });

    it('merges deep nested state correctly', () => {
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id' },
      });
      const reducedState = { proj: { id: 'geographic', crs: 'EPSG:4326' } };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arctic', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.proj.crs).toBe('EPSG:4326');
      expect(locationArg.query.proj.id).toBe('arctic');
    });
  });
});

describe('listenForHistoryChange', () => {
  let history;
  let store;
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = jest.fn();
    history = {
      location: { pathname: '/', search: '', hash: '' },
      listen: jest.fn(() => unsubscribe),
    };
    store = { dispatch: jest.fn() };
  });

  it('dispatches POP action on startup with current location', () => {
    listenForHistoryChange(store, history);
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'REDUX-LOCATION-POP-ACTION',
      payload: history.location,
    });
  });

  it('calls history.listen', () => {
    listenForHistoryChange(store, history);
    expect(history.listen).toHaveBeenCalled();
  });

  it('returns the unsubscribe function from history.listen', () => {
    const result = listenForHistoryChange(store, history);
    expect(result).toBe(unsubscribe);
  });

  it('dispatches POP action when history action is POP', () => {
    listenForHistoryChange(store, history);
    const listener = history.listen.mock.calls[0][0];
    const newLocation = { pathname: '/new', search: '?p=arctic', hash: '' };
    listener({ location: newLocation, action: 'POP' });
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'REDUX-LOCATION-POP-ACTION',
      payload: newLocation,
    });
  });

  it('does not dispatch on PUSH action', () => {
    listenForHistoryChange(store, history);
    store.dispatch.mockClear();
    const listener = history.listen.mock.calls[0][0];
    listener({ location: { pathname: '/new', search: '', hash: '' }, action: 'PUSH' });
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch on REPLACE action', () => {
    listenForHistoryChange(store, history);
    store.dispatch.mockClear();
    const listener = history.listen.mock.calls[0][0];
    listener({ location: { pathname: '/new', search: '', hash: '' }, action: 'REPLACE' });
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('dispatches multiple POP actions for multiple POP events', () => {
    listenForHistoryChange(store, history);
    store.dispatch.mockClear();
    const listener = history.listen.mock.calls[0][0];
    listener({ location: { pathname: '/a', search: '', hash: '' }, action: 'POP' });
    listener({ location: { pathname: '/b', search: '', hash: '' }, action: 'POP' });
    expect(store.dispatch).toHaveBeenCalledTimes(2);
  });
});

describe('internal helpers via integration', () => {
  let history;
  let reducers;
  let mapLocationToState;
  let stateToParams;

  beforeEach(() => {
    history = makeHistory();
    reducers = jest.fn((state) => state || {});
    mapLocationToState = jest.fn((state) => state);
    stateToParams = jest.fn(() => ({
      location: { pathname: '/', search: '', hash: '' },
      shouldPush: false,
    }));
  });

  describe('parseSearch', () => {
    it('handles search without leading ?', () => {
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id' },
      });
      reducers.mockReturnValue({});
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: 'p=arctic', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.proj.id).toBe('arctic');
    });

    it('handles null search', () => {
      reducers.mockReturnValue({});
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: null, hash: '' },
      })).not.toThrow();
    });

    it('handles encoded URI components in search', () => {
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id' },
      });
      reducers.mockReturnValue({});
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arct%69c', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.proj.id).toBe('arctic');
    });

    it('handles malformed percent encoding gracefully', () => {
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id' },
      });
      reducers.mockReturnValue({});
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=%ZZ', hash: '' },
      })).not.toThrow();
    });
  });

  describe('omitOverlayGroups', () => {
    it('returns value as-is when not an object', () => {
      const reducedState = { layers: { active: null, activeB: null } };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      expect(() => reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      })).not.toThrow();
    });

    it('returns value as-is when no overlayGroups property', () => {
      const reducedState = {
        layers: {
          active: { layers: [], groupOverlays: true },
          activeB: { layers: [] },
        },
      };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.layers.active).toHaveProperty('groupOverlays', true);
    });

    it('omits overlayGroups from activeB as well', () => {
      const reducedState = {
        layers: {
          active: { layers: [] },
          activeB: { layers: [], overlayGroups: [{ groupName: 'g1' }] },
        },
      };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        makeParamSetup(), mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.layers.activeB).not.toHaveProperty('overlayGroups');
    });
  });

  describe('mergeDeep', () => {
    it('deep merges patch into base for plain objects', () => {
      const paramSetup = makeParamSetup({
        p: { stateKey: 'proj.id' },
      });
      const reducedState = { proj: { id: 'geographic', crs: 'EPSG:4326', maxExtent: [-180, -90, 180, 90] } };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?p=arctic', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.proj.crs).toBe('EPSG:4326');
      expect(locationArg.query.proj.maxExtent).toEqual([-180, -90, 180, 90]);
      expect(locationArg.query.proj.id).toBe('arctic');
    });

    it('replaces arrays rather than merging', () => {
      const paramSetup = makeParamSetup({
        s: { stateKey: 'locationSearch.coordinates', type: 'array' },
      });
      const reducedState = { locationSearch: { coordinates: [0, 0] } };
      reducers.mockReturnValue(reducedState);
      const { reducersWithLocation } = createReduxLocationActions(
        paramSetup, mapLocationToState, history, reducers, stateToParams,
      );
      reducersWithLocation({}, {
        type: 'REDUX-LOCATION-POP-ACTION',
        payload: { pathname: '/', search: '?s=10,20', hash: '' },
      });
      const locationArg = mapLocationToState.mock.calls[0][1];
      expect(locationArg.query.locationSearch.coordinates).toEqual(['10', '20']);
    });
  });
});
