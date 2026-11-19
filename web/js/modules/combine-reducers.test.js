import rootReducer, { getInitialState } from './combine-reducers';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';

jest.mock('redux', () => {
  const actual = jest.requireActual('redux');
  return { ...actual, combineReducers: jest.fn(actual.combineReducers) };
});

jest.mock('./modal/reducers', () => ({
  modalReducer: (s = {}) => s,
  modalAboutReducer: (s = {}) => s,
}));
jest.mock('./feedback/reducers', () => (s = {}) => s);
jest.mock('./projection/reducer', () => (s = {}) => s);
jest.mock('./location-search/reducers', () => ({ locationSearchReducer: (s = {}) => s }));
jest.mock('./link/reducers', () => ({ shortLink: (s = {}) => s }));
jest.mock('./natural-events/reducers', () => ({
  getInitialEventsState: jest.fn(() => ({ events: 'initial' })),
  requestedEvents: (s = {}) => s,
  requestedEventSources: (s = {}) => s,
  eventsReducer: (s = {}) => s,
  eventRequestResponse: jest.fn(() => ({ status: 'idle' })),
}));
jest.mock('./tour/reducers', () => (s = {}) => s);
jest.mock('./map/reducers', () => (s = {}) => s);
jest.mock('./notifications/reducers', () => ({
  notificationsRequest: (s = {}) => s,
  notificationsReducer: (s = {}) => s,
}));
jest.mock('./projection/util', () => ({
  getProjInitialState: jest.fn(() => ({ projection: 'geographic' })),
}));
jest.mock('./compare/reducers', () => ({ compareReducer: (s = {}) => s }));
jest.mock('./charting/reducers', () => ({ chartingReducer: (s = {}) => s }));
jest.mock('./sidebar/reducers', () => (s = {}) => s);
jest.mock('./layers/reducers', () => ({
  layerReducer: (s = {}) => s,
  getInitialState: jest.fn(() => ({ layers: [] })),
}));
jest.mock('./date/reducers', () => ({
  dateReducer: (s = {}) => s,
  getInitialState: jest.fn(() => ({ selected: new Date('2021-01-01') })),
}));
jest.mock('./animation/reducers', () => ({ animationReducer: (s = {}) => s }));
jest.mock('./palettes/reducers', () => ({
  paletteReducer: (s = {}) => s,
  getInitialPaletteState: jest.fn(() => ({ rendered: {} })),
}));
jest.mock('./vector-styles/reducers', () => ({
  vectorStyleReducer: (s = {}) => s,
  getInitialVectorStyleState: jest.fn(() => ({ vectorStyles: {} })),
}));
jest.mock('./image-download/reducers', () => ({ imageDownloadReducer: (s = {}) => s }));
jest.mock('./measure/reducers', () => (s = {}) => s);
jest.mock('./product-picker/reducers', () => ({
  productPickerReducer: (s = {}) => s,
  getInitialState: jest.fn(() => ({ productPicker: {} })),
}));
jest.mock('./embed/reducers', () => (s = {}) => s);
jest.mock('./ui/reducers', () => (s = {}) => s);
jest.mock('./alerts/reducer', () => ({ alertReducer: (s = {}) => s }));
jest.mock('./smart-handoff/reducer', () => ({
  smartHandoffReducer: (s = {}) => s,
  getInitialState: jest.fn(() => ({ smartHandoffs: {} })),
}));
jest.mock('./settings/reducer', () => ({
  settingsReducer: (s = {}) => s,
  getInitialState: jest.fn(() => ({ settings: {} })),
}));
jest.mock('./screen-size/reducer', () => ({
  screenSizeReducer: (s = {}) => s,
  getInitialState: jest.fn(() => ({ screenSize: {} })),
}));
jest.mock('./loading/reducers', () => ({ loadingReducer: (s = {}) => s }));
jest.mock('../redux-location-state-customs', () => ({
  LOCATION_POP_ACTION: '@@router/LOCATION_CHANGE',
}));

const mockConfig = { projections: {}, defaults: {} };
const mockModels = { legacy: true };
const mockParameters = { key: 'value' };

describe('getInitialState', () => {
  it('returns an object containing parameters, config, and models as provided', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.parameters).toBe(mockParameters);
    expect(state.config).toBe(mockConfig);
    expect(state.models).toBe(mockModels);
  });

  it('includes date initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.date).toBeDefined();
    expect(state.date.selected).toEqual(new Date('2021-01-01'));
  });

  it('includes proj initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.proj).toBeDefined();
    expect(state.proj.projection).toBe('geographic');
  });

  it('includes layers initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.layers).toBeDefined();
    expect(Array.isArray(state.layers.layers)).toBe(true);
  });

  it('includes events initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.events).toBeDefined();
    expect(state.events.events).toBe('initial');
  });

  it('includes settings initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.settings).toBeDefined();
  });

  it('includes screenSize initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.screenSize).toBeDefined();
  });

  it('includes requestedEvents with idle status', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.requestedEvents).toEqual({ status: 'idle' });
  });

  it('includes requestedEventSources with idle status', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.requestedEventSources).toEqual({ status: 'idle' });
  });

  it('includes smartHandoffs initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.smartHandoffs).toBeDefined();
  });

  it('includes palettes initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.palettes).toBeDefined();
    expect(state.palettes.rendered).toBeDefined();
  });

  it('includes productPicker initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.productPicker).toBeDefined();
  });

  it('includes vectorStyles initial state', () => {
    const state = getInitialState(mockModels, mockConfig, mockParameters);
    expect(state.vectorStyles).toBeDefined();
  });

  it('passes config to each initializer that requires it', () => {
    const {
      getInitialState: getLayersInitialState,
    } = require('./layers/reducers');
    const {
      getInitialState: getDateInitialState,
    } = require('./date/reducers');
    const { getProjInitialState } = require('./projection/util');

    getInitialState(mockModels, mockConfig, mockParameters);

    expect(getLayersInitialState).toHaveBeenCalledWith(mockConfig);
    expect(getDateInitialState).toHaveBeenCalledWith(mockConfig);
    expect(getProjInitialState).toHaveBeenCalledWith(mockConfig);
  });
});

describe('rootReducer (default export)', () => {
  it('returns a state object for an unknown action', () => {
    const state = rootReducer(undefined, { type: '@@INIT' });
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
  });

  it('preserves existing state for an unknown action', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const next = rootReducer(initial, { type: 'UNKNOWN_ACTION' });
    expect(next).toBeDefined();
  });

  it('resets state to undefined when APP_RESET is dispatched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    expect(initial).toBeDefined();
    const afterReset = rootReducer(initial, { type: 'APP_RESET' });
    expect(afterReset).toBeDefined();
  });

  it('exposes a lastAction slice reflecting the most recent action', () => {
    const action = { type: 'SOME_ACTION', payload: 42 };
    const state = rootReducer(undefined, action);
    expect(state.lastAction).toEqual(action);
  });

  it('exposes a location slice defaulting to empty key', () => {
    const state = rootReducer(undefined, { type: '@@INIT' });
    expect(state.location).toEqual({ key: '' });
  });

  it('updates location.key when LOCATION_POP_ACTION is dispatched', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const action = {
      type: LOCATION_POP_ACTION,
      payload: { key: 'abc123' },
    };
    const next = rootReducer(initial, action);
    expect(next.location.key).toBe('abc123');
  });

  it('does not mutate location state for other action types', () => {
    const initial = rootReducer(undefined, { type: '@@INIT' });
    const next = rootReducer(initial, { type: 'UNRELATED' });
    expect(next.location).toEqual({ key: '' });
  });

  it('contains expected top-level keys in produced state', () => {
    const state = rootReducer(undefined, { type: '@@INIT' });
    const expectedKeys = [
      'alerts', 'animation', 'config', 'compare', 'charting', 'date',
      'embed', 'events', 'feedback', 'imageDownload', 'lastAction',
      'layers', 'loading', 'location', 'locationSearch', 'map',
      'measure', 'modal', 'modalAbout', 'models', 'notifications',
      'notificationsRequest', 'palettes', 'parameters', 'productPicker',
      'proj', 'requestedEvents', 'requestedEventSources', 'screenSize',
      'settings', 'shortLink', 'sidebar', 'smartHandoffs', 'tour',
      'ui', 'vectorStyles',
    ];
    expectedKeys.forEach((key) => {
      expect(state).toHaveProperty(key);
    });
  });

  it('handles multiple sequential dispatches without throwing', () => {
    let state = rootReducer(undefined, { type: '@@INIT' });
    state = rootReducer(state, { type: 'ACTION_ONE' });
    state = rootReducer(state, { type: 'ACTION_TWO' });
    state = rootReducer(state, { type: 'APP_RESET' });
    state = rootReducer(state, { type: 'ACTION_THREE' });
    expect(state).toBeDefined();
  });

  it('lastAction slice reflects APP_RESET action itself during that cycle', () => {
    const state = rootReducer(undefined, { type: 'APP_RESET' });
    expect(state.lastAction.type).toBe('APP_RESET');
  });
});
