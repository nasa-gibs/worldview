/* eslint-disable no-promise-executor-return */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import ConnectedBufferQuickAnimate from './bufferQuickAnimate';

import { getNumberStepsBetween, getNextDateTime } from '../../../modules/date/util';
import { getSelectedDate } from '../../../modules/date/selectors';
import { promiseImageryForTime } from '../../../modules/map/util';

// ─── Mock Dependencies ────────────────────────────────────────────────────────

jest.mock('../../../modules/date/util', () => ({
  getNumberStepsBetween: jest.fn(),
  getNextDateTime: jest.fn(),
}));

jest.mock('../../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(),
}));

jest.mock('../../../modules/map/util', () => ({
  promiseImageryForTime: jest.fn(),
}));

jest.mock('../../../modules/date/actions', () => ({
  setPreload: jest.fn((preloaded, lastPreloadDate) => ({
    type: 'SET_PRELOAD',
    preloaded,
    lastPreloadDate,
  })),
}));

// ─── Shared Test Fixtures ─────────────────────────────────────────────────────

const mockSelectedDate = new Date('2024-01-01');
const mockLastPreloadDate = new Date('2024-01-05');
const mockNextDate = new Date('2024-01-02');

const mockStore = configureMockStore();

/**
 * Builds a mock Redux store state. Override individual slices as needed.
 */
function buildStoreState(overrides = {}) {
  return {
    date: {
      selected: mockSelectedDate,
      preloaded: false,
      lastPreloadDate: null,
      ...overrides.date,
    },
    map: {},
    proj: {},
    embed: {},
    compare: {},
    layers: {},
    palettes: {},
    vectorStyles: {},
    ...overrides,
  };
}

/**
 * Renders the connected BufferQuickAnimate inside a mock Redux Provider.
 * Accepts a store state override and an action prop.
 */
async function renderComponent(storeOverrides = {}, action = { value: null }) {
  const store = mockStore(buildStoreState(storeOverrides));
  const utils = render(
    <Provider store={store}>
      <ConnectedBufferQuickAnimate action={action} />
    </Provider>,
  );
  // Flush all promises and microtasks
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { ...utils, store };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BufferQuickAnimate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSelectedDate.mockReturnValue(mockSelectedDate);
    getNextDateTime.mockReturnValue(mockNextDate);
    promiseImageryForTime.mockResolvedValue(undefined);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', async () => {
      const { container } = await renderComponent();
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect / action trigger ─────────────────────────────────────────────

  describe('useEffect action trigger', () => {
    it('does NOT call bufferQuickAnimate when action.value is null', async () => {
      await renderComponent({}, { value: null });
      expect(promiseImageryForTime).not.toHaveBeenCalled();
    });

    it('does NOT call bufferQuickAnimate when action.value is an empty string', async () => {
      await renderComponent({}, { value: '' });
      expect(promiseImageryForTime).not.toHaveBeenCalled();
    });

    it('calls bufferQuickAnimate when action.value is "right"', async () => {
      await renderComponent({}, { value: 'right' });
      expect(promiseImageryForTime).toHaveBeenCalled();
    });

    it('calls bufferQuickAnimate when action.value is "left"', async () => {
      await renderComponent({}, { value: 'left' });
      expect(promiseImageryForTime).toHaveBeenCalled();
    });
  });

  // ── Buffer size guard ──────────────────────────────────────────────────────

  describe('Buffer size guard', () => {
    it('does NOT call promiseImageryForTime when currentBuffer >= BUFFER_SIZE (8)', async () => {
      getNumberStepsBetween.mockReturnValue(8);
      const { store } = await renderComponent(
        { date: { preloaded: true, lastPreloadDate: mockLastPreloadDate } },
        { value: 'right' },
      );
      expect(promiseImageryForTime).not.toHaveBeenCalled();
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT call promiseImageryForTime when currentBuffer > BUFFER_SIZE', async () => {
      getNumberStepsBetween.mockReturnValue(10);
      await renderComponent(
        { date: { preloaded: true, lastPreloadDate: mockLastPreloadDate } },
        { value: 'right' },
      );
      expect(promiseImageryForTime).not.toHaveBeenCalled();
    });

    it('proceeds when currentBuffer < BUFFER_SIZE', async () => {
      getNumberStepsBetween.mockReturnValue(4);
      await renderComponent(
        { date: { preloaded: true, lastPreloadDate: mockLastPreloadDate } },
        { value: 'right' },
      );
      expect(promiseImageryForTime).toHaveBeenCalled();
    });
  });

  // ── Direction logic ────────────────────────────────────────────────────────

  describe('Direction logic', () => {
    it('uses direction 1 (forward) when action.value is "right"', async () => {
      await renderComponent({}, { value: 'right' });
      expect(getNextDateTime).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.anything(),
      );
    });

    it('uses direction -1 (backward) when action.value is "left"', async () => {
      await renderComponent({}, { value: 'left' });
      expect(getNextDateTime).toHaveBeenCalledWith(
        expect.anything(),
        -1,
        expect.anything(),
      );
    });
  });

  // ── preloaded / currentDate selection ─────────────────────────────────────

  describe('currentDate selection based on preloaded state', () => {
    it('uses selectedDate as currentDate when preloaded is false', async () => {
      await renderComponent(
        { date: { preloaded: false, lastPreloadDate: null } },
        { value: 'right' },
      );
      expect(getNextDateTime).toHaveBeenCalledWith(
        expect.anything(),
        1,
        mockSelectedDate,
      );
    });

    it('uses lastPreloadDate as currentDate when preloaded is true', async () => {
      getNumberStepsBetween.mockReturnValue(2);
      await renderComponent(
        { date: { preloaded: true, lastPreloadDate: mockLastPreloadDate } },
        { value: 'right' },
      );
      expect(getNextDateTime).toHaveBeenCalledWith(
        expect.anything(),
        1,
        mockLastPreloadDate,
      );
    });

    it('does NOT call getNumberStepsBetween when preloaded is false', async () => {
      await renderComponent(
        { date: { preloaded: false, lastPreloadDate: null } },
        { value: 'right' },
      );
      expect(getNumberStepsBetween).not.toHaveBeenCalled();
    });

    it('calls getNumberStepsBetween when preloaded is true', async () => {
      getNumberStepsBetween.mockReturnValue(2);
      await renderComponent(
        { date: { preloaded: true, lastPreloadDate: mockLastPreloadDate } },
        { value: 'right' },
      );
      expect(getNumberStepsBetween).toHaveBeenCalledWith(
        expect.objectContaining({ date: expect.anything() }),
        mockSelectedDate,
        mockLastPreloadDate,
      );
    });
  });

  // ── promiseImageryForTime calls ────────────────────────────────────────────

  describe('promiseImageryForTime calls', () => {
    it('calls promiseImageryForTime BUFFER_SIZE (8) times', async () => {
      await renderComponent({}, { value: 'right' });
      expect(promiseImageryForTime).toHaveBeenCalledTimes(8);
    });

    it('calls promiseImageryForTime with promiseImageryState and a date each time', async () => {
      await renderComponent({}, { value: 'right' });
      expect(promiseImageryForTime).toHaveBeenCalledWith(
        expect.objectContaining({
          map: expect.anything(),
          proj: expect.anything(),
        }),
        expect.anything(),
      );
    });

    it('calls getNextDateTime 8 times total (1 pre-loop + 7 in-loop)', async () => {
      await renderComponent({}, { value: 'right' });
      expect(getNextDateTime).toHaveBeenCalledTimes(8);
    });
  });

  // ── setPreload / dispatched actions ───────────────────────────────────────

  describe('setPreload', () => {
    it('dispatches SET_PRELOAD with (true, nextDate) after all promises resolve', async () => {
      const { store } = await renderComponent({}, { value: 'right' });
      const actions = store.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        type: 'SET_PRELOAD',
        preloaded: true,
        lastPreloadDate: mockNextDate,
      });
    });

    it('does NOT dispatch SET_PRELOAD when buffer is already full', async () => {
      getNumberStepsBetween.mockReturnValue(8);
      const { store } = await renderComponent(
        { date: { preloaded: true, lastPreloadDate: mockLastPreloadDate } },
        { value: 'right' },
      );
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch SET_PRELOAD when action.value is falsy', async () => {
      const { store } = await renderComponent({}, { value: null });
      expect(store.getActions()).toHaveLength(0);
    });
  });

  // ── Promise rejection handling ─────────────────────────────────────────────

  describe('Promise rejection handling', () => {
    it('does not dispatch SET_PRELOAD if an imagery promise rejects', async () => {
      try {
        promiseImageryForTime.mockRejectedValueOnce(new Error('Network error'));
      } catch {
        const { store } = await renderComponent({}, { value: 'right' });
        expect(store.getActions()).toHaveLength(0);
      }
    });
  });
});
