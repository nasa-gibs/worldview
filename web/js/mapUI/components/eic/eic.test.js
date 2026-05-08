/* eslint-disable react/jsx-pascal-case */
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import EIC from './eic';

jest.mock('../../../modules/date/actions', () => ({
  selectDate: jest.fn((date) => ({ type: 'SELECT_DATE', date })),
}));

jest.mock('../../../modules/ui/actions', () => ({
  setEICLegacy: jest.fn((isLegacy) => ({ type: 'SET_EIC_LEGACY', isLegacy })),
}));

const mockStore = configureMockStore();

function buildStore(overrides = {}) {
  return mockStore({
    ui: {
      eic: 'si',
      eicLegacy: false,
      scenario: 'test-scenario-id',
      ...overrides,
    },
  });
}

function renderComponent(store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <EIC />
    </Provider>,
  );
  return { ...utils, store: s };
}

// The json override must be wrapped in jest.fn().mockResolvedValue() separately
// so that passing { json: { resolution_date: '...' } } does not replace the
// function with a plain object, which would cause "response.json is not a function"
function buildFetchResponse({ ok = true, jsonData = { resolution_date: '2024-06-15' }, fetchOverrides = {} } = {}) {
  return {
    ok,
    json: jest.fn().mockResolvedValue(jsonData),
    ...fetchOverrides,
  };
}

describe('EIC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    console.warn.mockRestore();
    delete global.fetch;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse());
      let container;
      await act(async () => {
        ({ container } = renderComponent());
      });
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect guard conditions ─────────────────────────────────────────────

  describe('useEffect guard conditions', () => {
    it('calls fetch when scenario is set, eicLegacy is false, and eic is "si"', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse());
      await act(() => {
        renderComponent(buildStore({ eic: 'si', eicLegacy: false, scenario: 'my-scenario' }));
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('does NOT call fetch when scenario is an empty string', async () => {
      await act(() => {
        renderComponent(buildStore({ scenario: '' }));
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does NOT call fetch when eicLegacy is true', async () => {
      await act(() => {
        renderComponent(buildStore({ eicLegacy: true }));
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does NOT call fetch when eic is not "si"', async () => {
      await act(() => {
        renderComponent(buildStore({ eic: 'other' }));
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does NOT call fetch when eic is an empty string', async () => {
      await act(() => {
        renderComponent(buildStore({ eic: '' }));
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does NOT call fetch when all three conditions fail', async () => {
      await act(() => {
        renderComponent(buildStore({ eic: 'other', eicLegacy: true, scenario: '' }));
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ── requestBestDate: fetch URL ─────────────────────────────────────────────

  describe('requestBestDate: fetch URL', () => {
    it('calls fetch with the correct URL including scenario id', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse());
      await act(() => {
        renderComponent(buildStore({ scenario: 'test-scenario-id' }));
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://worldview.earthdata.nasa.gov/eic/scenarios?item_type=scenario&item_id=test-scenario-id',
        { timeout: 10000 },
      );
    });

    it('builds the URL with a different scenario id', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse());
      await act(() => {
        renderComponent(buildStore({ scenario: 'another-scenario' }));
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('item_id=another-scenario'),
        expect.anything(),
      );
    });

    it('calls fetch with timeout 10000', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse());
      await act(async () => {
        renderComponent();
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 10000 }),
      );
    });
  });

  // ── requestBestDate: successful response ───────────────────────────────────

  describe('requestBestDate: successful response', () => {
    it('dispatches SELECT_DATE with a Date object on a valid resolution_date', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: '2024-06-15' } }));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('dispatches SELECT_DATE with the correct Date value', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: '2024-06-15' } }));
      const { store } = renderComponent();
      await act(async () => {});
      const dispatched = store.getActions().find((a) => a.type === 'SELECT_DATE');
      expect(dispatched.date).toEqual(new Date('2024-06-15'));
    });

    it('does NOT dispatch SET_EIC_LEGACY on a valid resolution_date', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: '2024-06-15' } }));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_LEGACY' }),
      );
    });

    it('does NOT call console.warn on a valid resolution_date', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: '2024-06-15' } }));
      renderComponent();
      await act(async () => {});
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  // ── requestBestDate: "No valid date found" ─────────────────────────────────

  describe('requestBestDate: "No valid date found" resolution_date', () => {
    it('dispatches SET_EIC_LEGACY(true) when resolution_date is "No valid date found"', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: 'No valid date found' } }));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_LEGACY', isLegacy: true }),
      );
    });

    it('does NOT dispatch SELECT_DATE when resolution_date is "No valid date found"', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: 'No valid date found' } }));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('logs a warning when resolution_date is "No valid date found"', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ jsonData: { resolution_date: 'No valid date found' } }));
      renderComponent();
      await act(async () => {});
      expect(console.warn).toHaveBeenCalledWith(
        'No valid date found, using EIC Legacy mode',
      );
    });
  });

  // ── requestBestDate: response.ok is false ──────────────────────────────────

  describe('requestBestDate: response.ok is false', () => {
    it('dispatches SET_EIC_LEGACY(true) when response.ok is false', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ ok: false }));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_LEGACY', isLegacy: true }),
      );
    });

    it('does NOT dispatch SELECT_DATE when response.ok is false', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ ok: false }));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('logs a warning when response.ok is false', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ ok: false }));
      renderComponent();
      await act(async () => {});
      expect(console.warn).toHaveBeenCalledWith(
        'Error fetching the best date, using EIC Legacy mode:',
        expect.any(Error),
      );
    });

    it('throws an error with message "Network response was not ok." when response.ok is false', async () => {
      global.fetch.mockResolvedValue(buildFetchResponse({ ok: false }));
      renderComponent();
      await act(async () => {});
      const warnArg = console.warn.mock.calls[0][1];
      expect(warnArg.message).toBe('Network response was not ok.');
    });
  });

  // ── requestBestDate: fetch throws ─────────────────────────────────────────

  describe('requestBestDate: fetch throws', () => {
    it('dispatches SET_EIC_LEGACY(true) when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_LEGACY', isLegacy: true }),
      );
    });

    it('does NOT dispatch SELECT_DATE when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('logs a warning with the error when fetch rejects', async () => {
      const mockError = new Error('Network error');
      global.fetch.mockRejectedValue(mockError);
      renderComponent();
      await act(async () => {});
      expect(console.warn).toHaveBeenCalledWith(
        'Error fetching the best date, using EIC Legacy mode:',
        mockError,
      );
    });

    it('dispatches SET_EIC_LEGACY(true) when response.json() rejects', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('JSON parse error')),
      });
      const { store } = renderComponent();
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SET_EIC_LEGACY', isLegacy: true }),
      );
    });

    it('logs a warning when response.json() rejects', async () => {
      const jsonError = new Error('JSON parse error');
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(jsonError),
      });
      renderComponent();
      await act(async () => {});
      expect(console.warn).toHaveBeenCalledWith(
        'Error fetching the best date, using EIC Legacy mode:',
        jsonError,
      );
    });
  });
});
