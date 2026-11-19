/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import {
  MAP_MOUSE_OUT,
  MAP_MOVE_END,
  MAP_MOUSE_MOVE,
  MAP_SINGLE_CLICK,
  MAP_CONTEXT_MENU,
  REDUX_ACTION_DISPATCHED,
} from '../util/constants';
import util from '../util/util';

let mockMapProps;

jest.mock('cachai', () => jest.fn().mockImplementation(() => ({ clear: jest.fn() })));
jest.mock('p-queue', () => jest.fn().mockImplementation(() => ({ add: jest.fn() })));
jest.mock('../map/runningdata', () => jest.fn().mockImplementation(() => ({})));
jest.mock('../map/compare/compare', () => jest.fn(() => ({ compare: true })));
jest.mock('../map/layerbuilder', () => jest.fn(() => ({
  createLayer: jest.fn(),
  layerKey: jest.fn(),
})));

jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    events: { trigger: jest.fn(), on: jest.fn(), off: jest.fn() },
    warn: jest.fn(),
  },
}));

jest.mock('./mapUI', () => (props) => { mockMapProps = props; return null; });

const CombineUI = require('./combineUI').default;

const mockStore = configureMockStore();

const buildStore = (state = { lastAction: { type: 'SOME_ACTION' } }) => mockStore(state);

const buildProps = (overrides = {}) => ({
  models: { map: {} },
  config: { projections: {} },
  store: buildStore(),
  ...overrides,
});

const renderComponent = (props) => render(<CombineUI {...props} />);

beforeEach(() => {
  jest.clearAllMocks();
  mockMapProps = undefined;
});

describe('CombineUI', () => {
  it('renders MapUI with the expected props', () => {
    const props = buildProps();
    renderComponent(props);
    expect(mockMapProps).toBeDefined();
    expect(mockMapProps.models).toBe(props.models);
    expect(mockMapProps.config).toBe(props.config);
    expect(mockMapProps.ui).toBeDefined();
    expect(typeof mockMapProps.setUI).toBe('function');
    expect(mockMapProps.layerQueue).toBeDefined();
    expect(mockMapProps.layerCreationQueue).toBeDefined();
    expect(mockMapProps.compareMapUi).toBeDefined();
  });

  it('seeds the ui state with the expected default shape', () => {
    renderComponent(buildProps());
    const { ui } = mockMapProps;
    expect(ui.mapIsbeingDragged).toBe(false);
    expect(ui.mapIsbeingZoomed).toBe(false);
    expect(ui.proj).toEqual({});
    expect(ui.selected).toBeNull();
    expect(ui.markers).toEqual([]);
    expect(ui.processingPromise).toBeNull();
    expect(typeof ui.createLayer).toBe('function');
    expect(typeof ui.layerKey).toBe('function');
  });

  it('subscribes to the store and triggers REDUX_ACTION_DISPATCHED when notified', () => {
    const props = buildProps();
    renderComponent(props);

    act(() => { props.store.dispatch({ type: 'ANY' }); });
    expect(util.events.trigger).toHaveBeenCalledWith(
      REDUX_ACTION_DISPATCHED,
      { type: 'SOME_ACTION' },
    );
  });

  it('blurs focused inputs when a non-input element is clicked', () => {
    renderComponent(buildProps());

    const input = document.createElement('input');
    document.body.appendChild(input);
    const blurSpy = jest.spyOn(input, 'blur');

    const div = document.createElement('div');
    document.body.appendChild(div);
    div.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(blurSpy).toHaveBeenCalled();

    document.body.removeChild(input);
    document.body.removeChild(div);
  });

  it('registers OL map mouse handlers once maps exist in ui.proj', () => {
    jest.useFakeTimers();
    try {
      renderComponent(buildProps());
      const { setUI } = mockMapProps;

      const element = document.createElement('div');
      const elementAddSpy = jest.spyOn(element, 'addEventListener');
      const map = {
        getTargetElement: () => element,
        getView: () => ({
          getProjection: () => ({ getCode: () => 'EPSG:4326' }),
        }),
        on: jest.fn(),
      };

      act(() => {
        setUI((prev) => ({ ...prev, proj: { geographic: map } }));
      });

      act(() => { jest.runOnlyPendingTimers(); });

      expect(elementAddSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      const onEvents = map.on.mock.calls.map((c) => c[0]);
      expect(onEvents).toEqual(
        expect.arrayContaining(['moveend', 'pointermove', 'singleclick', 'contextmenu']),
      );

      const mouseleaveHandler = elementAddSpy.mock.calls.find((c) => c[0] === 'mouseleave')[1];
      mouseleaveHandler({ type: 'mouseleave' });
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_MOUSE_OUT, { type: 'mouseleave' });

      const handlerFor = (name) => map.on.mock.calls.find((c) => c[0] === name)[1];
      handlerFor('moveend')({ e: 1 });
      handlerFor('pointermove')({ e: 2 });
      handlerFor('singleclick')({ e: 3 });
      handlerFor('contextmenu')({ e: 4 });

      expect(util.events.trigger).toHaveBeenCalledWith(MAP_MOVE_END, { e: 1 }, map, 'EPSG:4326');
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_MOUSE_MOVE, { e: 2 }, map, 'EPSG:4326');
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_SINGLE_CLICK, { e: 3 }, map, 'EPSG:4326');
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_CONTEXT_MENU, { e: 4 }, map, 'EPSG:4326');
    } finally {
      jest.useRealTimers();
    }
  });
});
