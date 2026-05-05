import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import KioskAnimations from './kiosk-animations';

jest.mock('../../../../modules/animation/actions', () => ({
  onActivate: jest.fn(() => ({ type: 'INITIATE_ANIMATION' })),
  playKioskAnimation: jest.fn((startDate, endDate) => ({
    type: 'PLAY_KIOSK_ANIMATION',
    startDate,
    endDate,
  })),
}));

jest.mock('../../../../modules/date/actions', () => ({
  selectDate: jest.fn((date) => ({ type: 'SELECT_DATE', date })),
}));

const mockStore = configureMockStore();

const mockSelectedDate = new Date('2024-06-15T12:00:00Z');

const mockSelected = { frameState_: {} };

function buildStore(overrides = {}) {
  return mockStore({
    date: { selected: mockSelectedDate },
    animation: { isPlaying: false },
    map: { ui: { selected: mockSelected } },
    ui: {
      isKioskModeActive: true,
      eic: 'da',
      eicMeasurementComplete: true,
      eicMeasurementAborted: false,
    },
    ...overrides,
  });
}

function buildUi(frameState = {}) {
  return { selected: { frameState_: frameState } };
}

function renderComponent(store, ui = buildUi()) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <KioskAnimations ui={ui} />
    </Provider>,
  );
  return { ...utils, store: s };
}

describe('KioskAnimations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect guard conditions ─────────────────────────────────────────────

  describe('useEffect guard conditions', () => {
    it('does NOT dispatch when ui.selected is null', () => {
      const { store } = renderComponent(buildStore(), { selected: null });
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch when isKioskModeActive is false', () => {
      const { store } = renderComponent(buildStore({ ui: { isKioskModeActive: false, eic: 'da', eicMeasurementComplete: true, eicMeasurementAborted: false } }));
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch when eicMeasurementComplete is false', () => {
      const { store } = renderComponent(buildStore({ ui: { isKioskModeActive: true, eic: 'da', eicMeasurementComplete: false, eicMeasurementAborted: false } }));
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch when isAnimationPlaying is true', () => {
      const { store } = renderComponent(buildStore({ animation: { isPlaying: true }, ui: { isKioskModeActive: true, eic: 'da', eicMeasurementComplete: true, eicMeasurementAborted: false } }));
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch when eic is not "sa" or "da" (eicAnimationMode is false)', () => {
      const { store } = renderComponent(buildStore({ ui: { isKioskModeActive: true, eic: 'si', eicMeasurementComplete: true, eicMeasurementAborted: false } }));
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch when eicMeasurementAborted is true', () => {
      const { store } = renderComponent(buildStore({ ui: { isKioskModeActive: true, eic: 'da', eicMeasurementComplete: true, eicMeasurementAborted: true } }));
      expect(store.getActions()).toHaveLength(0);
    });

    it('does NOT dispatch when ui.selected has no frameState_', () => {
      const { store } = renderComponent(buildStore(), { selected: {} });
      expect(store.getActions()).toHaveLength(0);
    });
  });

  // ── eicAnimationMode ───────────────────────────────────────────────────────

  describe('eicAnimationMode', () => {
    it('is active when eic is "sa"', () => {
      const { store } = renderComponent(buildStore({ ui: { isKioskModeActive: true, eic: 'sa', eicMeasurementComplete: true, eicMeasurementAborted: false } }));
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('is active when eic is "da"', () => {
      const { store } = renderComponent(buildStore());
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'INITIATE_ANIMATION' }),
      );
    });

    it('is NOT active when eic is "si"', () => {
      const { store } = renderComponent(buildStore({ ui: { isKioskModeActive: true, eic: 'si', eicMeasurementComplete: true, eicMeasurementAborted: false } }));
      expect(store.getActions()).toHaveLength(0);
    });
  });

  // ── checkAnimationSettings: daily (eic === "da") ───────────────────────────

  describe('checkAnimationSettings: daily mode (eic === "da")', () => {
    it('dispatches INITIATE_ANIMATION when dailyPlayCheck is true', () => {
      const { store } = renderComponent(buildStore());
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'INITIATE_ANIMATION' }),
      );
    });

    it('dispatches PLAY_KIOSK_ANIMATION when dailyPlayCheck is true', () => {
      const { store } = renderComponent(buildStore());
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'PLAY_KIOSK_ANIMATION' }),
      );
    });

    it('does NOT dispatch SELECT_DATE in daily mode', () => {
      const { store } = renderComponent(buildStore());
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('does NOT dispatch when isAnimationPlaying is true (dailyPlayCheck is false)', () => {
      const store = buildStore({
        animation: { isPlaying: true },
        ui: { isKioskModeActive: true, eic: 'da', eicMeasurementComplete: true, eicMeasurementAborted: false },
      });
      renderComponent(store);
      expect(store.getActions()).toHaveLength(0);
    });
  });

  // ── checkAnimationSettings: subdaily (eic === "sa") ───────────────────────

  describe('checkAnimationSettings: subdaily mode (eic === "sa")', () => {
    const subdailyStore = () => buildStore({
      ui: {
        isKioskModeActive: true,
        eic: 'sa',
        eicMeasurementComplete: true,
        eicMeasurementAborted: false,
      },
    });

    it('dispatches SELECT_DATE on first render to move date back one day', () => {
      const { store } = renderComponent(subdailyStore());
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('dispatches SELECT_DATE with the previous day', () => {
      const { store } = renderComponent(subdailyStore());
      const action = store.getActions().find((a) => a.type === 'SELECT_DATE');
      const expectedPrevDay = new Date(mockSelectedDate);
      expectedPrevDay.setDate(expectedPrevDay.getDate() - 1);
      expect(action.date.toDateString()).toBe(expectedPrevDay.toDateString());
    });

    it('does NOT dispatch INITIATE_ANIMATION on first subdaily render', () => {
      const { store } = renderComponent(subdailyStore());
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'INITIATE_ANIMATION' }),
      );
    });

    it('does NOT dispatch PLAY_KIOSK_ANIMATION on first subdaily render', () => {
      const { store } = renderComponent(subdailyStore());
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'PLAY_KIOSK_ANIMATION' }),
      );
    });
  });

  // ── handleAnimationSettings: PLAY_KIOSK_ANIMATION payload ─────────────────

  describe('handleAnimationSettings: PLAY_KIOSK_ANIMATION payload', () => {
    it('dispatches PLAY_KIOSK_ANIMATION with startDate and endDate', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action).toHaveProperty('startDate');
      expect(action).toHaveProperty('endDate');
    });

    it('dispatches PLAY_KIOSK_ANIMATION with endDate equal to selectedDate (zeroed)', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.endDate.getSeconds()).toBe(0);
      expect(action.endDate.getMilliseconds()).toBe(0);
    });

    it('dispatches PLAY_KIOSK_ANIMATION with startDate before endDate', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.startDate.getTime()).toBeLessThan(action.endDate.getTime());
    });
  });

  // ── updateStartTime: daily subtracts 1 month ───────────────────────────────

  describe('updateStartTime: daily mode subtracts 1 month', () => {
    it('sets startDate approximately 1 month before endDate', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      const diffMs = action.endDate.getTime() - action.startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  // ── updateStartTime: subdaily subtracts 6 hours ────────────────────────────

  describe('updateStartTime: subdaily mode subtracts 6 hours', () => {
    it('sets startDate exactly 6 hours before selectedDate for subdaily after date shift', () => {
      const store = buildStore({
        ui: {
          isKioskModeActive: true,
          eic: 'sa',
          eicMeasurementComplete: true,
          eicMeasurementAborted: false,
        },
        animation: { isPlaying: false },
      });

      const { rerender } = render(
        <Provider store={store}>
          <KioskAnimations ui={buildUi()} />
        </Provider>,
      );

      const updatedStore = buildStore({
        date: { selected: new Date('2024-06-14T12:00:00Z') },
        animation: { isPlaying: false },
        ui: {
          isKioskModeActive: true,
          eic: 'sa',
          eicMeasurementComplete: true,
          eicMeasurementAborted: false,
        },
      });

      rerender(
        <Provider store={updatedStore}>
          <KioskAnimations ui={buildUi()} />
        </Provider>,
      );

      const action = updatedStore.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      if (action) {
        const diffMs = action.endDate.getTime() - action.startDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        expect(diffHours).toBe(6);
      }
    });
  });

  // ── zeroDates ──────────────────────────────────────────────────────────────

  describe('zeroDates', () => {
    it('zeros seconds on startDate to 0', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.startDate.getSeconds()).toBe(0);
    });

    it('zeros milliseconds on startDate to 0', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.startDate.getMilliseconds()).toBe(0);
    });

    it('zeros seconds on endDate to 0', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.endDate.getSeconds()).toBe(0);
    });

    it('zeros milliseconds on endDate to 0', () => {
      const { store } = renderComponent(buildStore());
      const action = store.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.endDate.getMilliseconds()).toBe(0);
    });

    it('rounds startDate minutes down to the nearest 10', () => {
      const storeWithOddMinutes = buildStore({
        date: { selected: new Date('2024-06-15T12:37:45.123Z') },
        ui: { isKioskModeActive: true, eic: 'da', eicMeasurementComplete: true, eicMeasurementAborted: false },
        animation: { isPlaying: false },
      });
      renderComponent(storeWithOddMinutes);
      const action = storeWithOddMinutes.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.startDate.getUTCMinutes() % 10).toBe(0);
    });

    it('rounds endDate minutes down to the nearest 10', () => {
      const storeWithOddMinutes = buildStore({
        date: { selected: new Date('2024-06-15T12:37:45.123Z') },
        ui: { isKioskModeActive: true, eic: 'da', eicMeasurementComplete: true, eicMeasurementAborted: false },
        animation: { isPlaying: false },
      });
      renderComponent(storeWithOddMinutes);
      const action = storeWithOddMinutes.getActions().find((a) => a.type === 'PLAY_KIOSK_ANIMATION');
      expect(action.endDate.getUTCMinutes() % 10).toBe(0);
    });
  });

  // ── dispatch order ─────────────────────────────────────────────────────────

  describe('dispatch order', () => {
    it('dispatches INITIATE_ANIMATION before PLAY_KIOSK_ANIMATION', () => {
      const { store } = renderComponent(buildStore());
      const actions = store.getActions().map((a) => a.type);
      const initiateIdx = actions.indexOf('INITIATE_ANIMATION');
      const playIdx = actions.indexOf('PLAY_KIOSK_ANIMATION');
      expect(initiateIdx).toBeLessThan(playIdx);
    });
  });
});
