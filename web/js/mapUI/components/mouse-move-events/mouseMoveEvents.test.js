/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConnectedMouseMoveEvents from './mouseMoveEvents';
import { MAP_MOUSE_MOVE, MAP_MOUSE_OUT } from '../../../util/constants';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../util/util', () => ({
  __esModule: true,
  default: {
    events: {
      on: jest.fn(),
    },
  },
}));

import util from '../../../util/util';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockPixel = [100, 200];
const mockCoords = [-77, 38];

const mockRunningdata = {
  newPoint: jest.fn(),
  clearAll: jest.fn(),
};

const mockSelected = {
  getCoordinateFromPixel: jest.fn(() => mockCoords),
  proj: 'EPSG:4326',
};

function buildMockUi(overrides = {}) {
  return {
    selected: mockSelected,
    mapIsbeingZoomed: false,
    mapIsbeingDragged: false,
    runningdata: mockRunningdata,
    ...overrides,
  };
}

function buildMockMap(selectedOverride = {}) {
  return {
    ui: {
      selected: {
        proj: 'EPSG:4326',
        ...selectedOverride,
      },
    },
  };
}

function buildStore(overrides = {}) {
  return mockStore({
    events: { active: false },
    locationSearch: { isCoordinateSearchActive: false },
    sidebar: { activeTab: 'layers' },
    animation: { isPlaying: false },
    measure: { isActive: false },
    screenSize: { isMobileDevice: false },
    map: buildMockMap(),
    ...overrides,
  });
}

// Only pass props NOT overridden by mapStateToProps:
// ui, compareMapUi — all boolean flags come from the store
function buildProps(overrides = {}) {
  return {
    ui: buildMockUi(),
    compareMapUi: null,
    ...overrides,
  };
}

function renderComponent(props, store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <ConnectedMouseMoveEvents {...props} />
    </Provider>,
  );
  return { ...utils, store: s };
}

// Extract the registered handler for a given event from util.events.on mock calls
function getHandler(eventName) {
  const call = util.events.on.mock.calls.find(([event]) => event === eventName);
  return call ? call[1] : null;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MouseMoveEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    util.events.on = jest.fn();
    mockSelected.getCoordinateFromPixel.mockReturnValue(mockCoords);
    mockSelected.proj = 'EPSG:4326';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderComponent(buildProps());
      expect(container.firstChild).toBeNull();
    });
  });

  // ── events.on registration ─────────────────────────────────────────────────

  describe('events.on registration', () => {
    it('registers a MAP_MOUSE_MOVE handler', () => {
      renderComponent(buildProps());
      expect(util.events.on).toHaveBeenCalledWith(MAP_MOUSE_MOVE, expect.any(Function));
    });

    it('registers a MAP_MOUSE_OUT handler', () => {
      renderComponent(buildProps());
      expect(util.events.on).toHaveBeenCalledWith(MAP_MOUSE_OUT, expect.any(Function));
    });

    it('registers exactly two event handlers', () => {
      renderComponent(buildProps());
      expect(util.events.on).toHaveBeenCalledTimes(2);
    });
  });

  // ── throttledOnMouseMove: guard conditions ────────────────────────────────

  describe('throttledOnMouseMove: guard conditions', () => {
    async function triggerMouseMove(props, store, pixel = mockPixel) {
      renderComponent(props, store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
    }

    it('calls newPoint when all conditions are satisfied', async () => {
      await triggerMouseMove(buildProps(), buildStore());
      expect(mockRunningdata.newPoint).toHaveBeenCalledWith(mockPixel, mockSelected);
    });

    it('does NOT call newPoint when map.ui.selected is null', async () => {
      const store = buildStore({ map: { ui: { selected: null } } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when map.ui.selected.proj !== ui.selected.proj', async () => {
      const store = buildStore({ map: buildMockMap({ proj: 'EPSG:3413' }) });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when ui.mapIsbeingZoomed is true', async () => {
      const ui = buildMockUi({ mapIsbeingZoomed: true });
      await triggerMouseMove(buildProps({ ui }), buildStore());
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when ui.mapIsbeingDragged is true', async () => {
      const ui = buildMockUi({ mapIsbeingDragged: true });
      await triggerMouseMove(buildProps({ ui }), buildStore());
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when compareMapUi.dragging is true', async () => {
      const props = buildProps({ compareMapUi: { dragging: true } });
      await triggerMouseMove(props, buildStore());
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when isMobile is true', async () => {
      const store = buildStore({ screenSize: { isMobileDevice: true } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when isMeasureActive is true', async () => {
      const store = buildStore({ measure: { isActive: true } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when isCoordinateSearchActive is true', async () => {
      const store = buildStore({ locationSearch: { isCoordinateSearchActive: true } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when coords is null', async () => {
      mockSelected.getCoordinateFromPixel.mockReturnValue(null);
      await triggerMouseMove(buildProps(), buildStore());
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when isEventsTabActive is true', async () => {
      const store = buildStore({ events: { active: true } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when isMapAnimating is true', async () => {
      const store = buildStore({ animation: { isPlaying: true } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('does NOT call newPoint when sidebarActiveTab is "download"', async () => {
      const store = buildStore({ sidebar: { activeTab: 'download' } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('calls newPoint when compareMapUi is null', async () => {
      await triggerMouseMove(buildProps({ compareMapUi: null }), buildStore());
      expect(mockRunningdata.newPoint).toHaveBeenCalled();
    });

    it('calls newPoint when compareMapUi.dragging is false', async () => {
      await triggerMouseMove(buildProps({ compareMapUi: { dragging: false } }), buildStore());
      expect(mockRunningdata.newPoint).toHaveBeenCalled();
    });

    it('calls newPoint when sidebarActiveTab is "layers"', async () => {
      const store = buildStore({ sidebar: { activeTab: 'layers' } });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).toHaveBeenCalled();
    });

    it('calls newPoint when sidebarActiveTab is "events" but isEventsTabActive is false', async () => {
      const store = buildStore({
        sidebar: { activeTab: 'events' },
        events: { active: false },
      });
      await triggerMouseMove(buildProps(), store);
      expect(mockRunningdata.newPoint).toHaveBeenCalled();
    });
  });

  // ── MAP_MOUSE_OUT handler ─────────────────────────────────────────────────

  describe('MAP_MOUSE_OUT handler', () => {
    it('calls ui.runningdata.clearAll when MAP_MOUSE_OUT fires', () => {
      renderComponent(buildProps(), buildStore());
      const handler = getHandler(MAP_MOUSE_OUT);
      act(() => { handler({}); });
      expect(mockRunningdata.clearAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── useEffect: mouseMove state dependency ─────────────────────────────────

  describe('useEffect: mouseMove state dependency', () => {
    it('calls throttledOnMouseMove when setMouseMove is triggered via MAP_MOUSE_MOVE', async () => {
      renderComponent(buildProps(), buildStore());
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).toHaveBeenCalledWith(mockPixel, mockSelected);
    });

    it('calls newPoint with the correct pixel each time MAP_MOUSE_MOVE fires', async () => {
      const pixelA = [10, 20];
      const pixelB = [30, 40];
      renderComponent(buildProps(), buildStore());
      const handler = getHandler(MAP_MOUSE_MOVE);

      act(() => { handler({ pixel: pixelA }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});

      act(() => { handler({ pixel: pixelB }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});

      expect(mockRunningdata.newPoint).toHaveBeenCalledWith(pixelA, mockSelected);
      expect(mockRunningdata.newPoint).toHaveBeenCalledWith(pixelB, mockSelected);
    });
  });

  // ── mapStateToProps ────────────────────────────────────────────────────────

  describe('mapStateToProps', () => {
    it('sets isEventsTabActive to false when events state is undefined', async () => {
      const store = buildStore({ events: undefined });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).toHaveBeenCalled();
    });

    it('sets isEventsTabActive to true when events.active is true', async () => {
      const store = buildStore({ events: { active: true } });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('reads isMobileDevice from screenSize state', async () => {
      const store = buildStore({ screenSize: { isMobileDevice: true } });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('reads isActive from measure state', async () => {
      const store = buildStore({ measure: { isActive: true } });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('reads isPlaying from animation state', async () => {
      const store = buildStore({ animation: { isPlaying: true } });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('reads activeTab from sidebar state', async () => {
      const store = buildStore({ sidebar: { activeTab: 'download' } });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });

    it('reads isCoordinateSearchActive from locationSearch state', async () => {
      const store = buildStore({ locationSearch: { isCoordinateSearchActive: true } });
      renderComponent(buildProps(), store);
      const handler = getHandler(MAP_MOUSE_MOVE);
      act(() => { handler({ pixel: mockPixel }); });
      jest.advanceTimersByTime(300);
      await act(async () => {});
      expect(mockRunningdata.newPoint).not.toHaveBeenCalled();
    });
  });
});
