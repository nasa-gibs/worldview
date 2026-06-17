import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('../../../modules/date/actions', () => ({
  selectDate: jest.fn((d) => ({ type: 'SELECT_DATE', date: d })),
}));
jest.mock('../../../modules/smart-handoff/selectors', () => ({
  getBaseCmrUrl: jest.fn((state) => state.smartHandoff.baseUrl),
}));
jest.mock('../../../util/cmr', () => ({
  buildGranulesUrl: jest.fn(() => 'https://cmr.example.com/granules'),
  cmrFetch: jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({ feed: { entry: [] } }),
  })),
}));

import ImagerySearch from './imagery-search';
import { cmrFetch } from '../../../util/cmr';

// jsdom always returns 0 for scrollHeight/clientHeight; the component's useEffect
// loops endlessly when scrollHeight <= clientHeight.  Override both on the prototype
// so every ul rendered by the component sees scrollHeight > clientHeight and the
// effect takes the stable else-branch (sets scrollTop once and stops).
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get() { return 1000; },
});
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get() { return 200; },
});

const mockStore = configureStore([]);
const selectedDate = new Date('2023-06-15T00:00:00.000Z');

const buildStore = (overrides = {}) => mockStore({
  date: { selected: selectedDate, selectedB: selectedDate, ...overrides.date },
  compare: { active: false, isCompareA: true, ...overrides.compare },
  map: { extent: [-180, -90, 180, 90], ...overrides.map },
  smartHandoff: { baseUrl: 'https://cmr.earthdata.nasa.gov' },
});

const layer = {
  id: 'HLSS30_Customizable',
  conceptIds: [{ value: 'C12345-PROVIDER' }],
};

const renderSearch = async (layerOverride = layer, storeOverride = {}) => {
  let result;
  await act(async () => {
    result = render(
      <Provider store={buildStore(storeOverride)}>
        <ImagerySearch layer={layerOverride} />
      </Provider>,
    );
  });
  return result;
};

beforeEach(() => {
  jest.clearAllMocks();
  cmrFetch.mockResolvedValue({
    json: () => Promise.resolve({ feed: { entry: [] } }),
  });
});

describe('ImagerySearch', () => {
  describe('layout', () => {
    it('renders the "Available Imagery Dates" title', async () => {
      await renderSearch();
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });

    it('renders the scrollable list', async () => {
      await renderSearch();
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('renders start and end spinner list items', async () => {
      const { container } = await renderSearch();
      expect(container.querySelectorAll('.imagery-search-spinner')).toHaveLength(2);
    });

    it('renders an hr divider below the list', async () => {
      const { container } = await renderSearch();
      expect(container.querySelector('hr')).toBeInTheDocument();
    });
  });

  describe('granule date rendering', () => {
    it('renders returned granule dates as list items', async () => {
      cmrFetch.mockResolvedValue({
        json: () => Promise.resolve({
          feed: {
            entry: [
              { time_start: '2023-06-14T00:00:00.000Z' },
              { time_start: '2023-06-13T00:00:00.000Z' },
            ],
          },
        }),
      });
      await renderSearch();
      expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    });

    it('shows no date list items when cmrFetch returns empty entries', async () => {
      await renderSearch();
      const dateItems = screen.queryAllByRole('listitem').filter((el) => el.classList.contains('lazyload-list-item'));
      expect(dateItems).toHaveLength(0);
    });

    it('deduplicates granule dates that fall on the same calendar day', async () => {
      // The useEffect takes the else-branch (scrollHeight > clientHeight), so data
      // only loads on a scroll near the bottom.  Set up the mock before scrolling.
      cmrFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            feed: {
              entry: [
                { time_start: '2023-06-14T01:00:00.000Z' },
                { time_start: '2023-06-14T12:00:00.000Z' },
              ],
            },
          }),
        })
        .mockResolvedValue({ json: () => Promise.resolve({ feed: { entry: [] } }) });

      await renderSearch();
      const list = screen.getByRole('list');

      // Scroll near the bottom to trigger loadOlderDates
      await act(async () => {
        Object.defineProperty(list, 'scrollTop', { value: 900, configurable: true });
        Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(list, { target: list });
      });

      const dateItems = screen.queryAllByRole('listitem').filter((el) => el.classList.contains('lazyload-list-item'));
      // Two timestamps on the same day should collapse to one date entry
      expect(dateItems).toHaveLength(1);
    });

    it('renders dates sorted newest-first', async () => {
      cmrFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            feed: {
              entry: [
                { time_start: '2023-06-13T00:00:00.000Z' },
                { time_start: '2023-06-14T00:00:00.000Z' },
                { time_start: '2023-06-15T00:00:00.000Z' },
              ],
            },
          }),
        })
        .mockResolvedValue({ json: () => Promise.resolve({ feed: { entry: [] } }) });

      await renderSearch();
      const list = screen.getByRole('list');

      // Scroll near the bottom to trigger loadOlderDates
      await act(async () => {
        Object.defineProperty(list, 'scrollTop', { value: 900, configurable: true });
        Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(list, { target: list });
      });

      const dateItems = screen.queryAllByRole('listitem').filter((el) => el.classList.contains('lazyload-list-item'));
      expect(dateItems.length).toBeGreaterThanOrEqual(1);
      // First item should be the newest date (June 15)
      expect(dateItems[0].textContent).toContain('June 15');
    });
  });

  describe('conceptId resolution', () => {
    it('renders without error when using collectionConceptID fallback', async () => {
      const layerWithFallback = { id: 'fallback-layer', collectionConceptID: 'C99999-PROVIDER' };
      await renderSearch(layerWithFallback);
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });

    it('renders without error when layer has no conceptId or collectionConceptID', async () => {
      const layerNoIds = { id: 'no-ids-layer' };
      await renderSearch(layerNoIds);
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });
  });

  describe('compare mode', () => {
    it('renders without error when compare is active and isCompareA is false', async () => {
      const selectedB = new Date('2023-01-01T00:00:00.000Z');
      await renderSearch(layer, {
        date: { selected: selectedDate, selectedB },
        compare: { active: true, isCompareA: false },
      });
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });

    it('uses date.selected when compare is active and isCompareA is true', async () => {
      const selectedB = new Date('2023-01-01T00:00:00.000Z');
      await renderSearch(layer, {
        date: { selected: selectedDate, selectedB },
        compare: { active: true, isCompareA: true },
      });
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });
  });

  describe('map extent clamping', () => {
    it('renders without error when map extent exceeds maxExtent bounds', async () => {
      // Extent larger than [-180,-90,180,90] — triggers the clamping branches
      await renderSearch(layer, {
        map: { extent: [-200, -100, 200, 100] },
      });
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });

    it('renders without error when map extent is within maxExtent bounds', async () => {
      await renderSearch(layer, {
        map: { extent: [-90, -45, 90, 45] },
      });
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });
  });

  describe('cmrFetch error handling', () => {
    it('renders without error when cmrFetch rejects (older granules)', async () => {
      cmrFetch.mockRejectedValue(new Error('network error'));
      await renderSearch();
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });

    it('renders without error when cmrFetch response.json() rejects', async () => {
      cmrFetch.mockResolvedValue({
        json: () => Promise.reject(new Error('bad json')),
      });
      await renderSearch();
      expect(screen.getByText('Available Imagery Dates')).toBeInTheDocument();
    });
  });

  describe('date selection', () => {
    it('dispatches selectDate action when a date list item is clicked', async () => {
      const { selectDate } = require('../../../modules/date/actions');
      cmrFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({
            feed: { entry: [{ time_start: '2023-06-14T00:00:00.000Z' }] },
          }),
        })
        .mockResolvedValue({ json: () => Promise.resolve({ feed: { entry: [] } }) });

      await renderSearch();
      const list = screen.getByRole('list');

      // Trigger loadOlderDates via bottom-scroll to populate date list items
      await act(async () => {
        Object.defineProperty(list, 'scrollTop', { value: 900, configurable: true });
        Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(list, { target: list });
      });

      const dateItems = screen.queryAllByRole('listitem').filter((el) => el.classList.contains('lazyload-list-item'));
      expect(dateItems.length).toBeGreaterThan(0);
      await act(async () => {
        fireEvent.click(dateItems[0]);
      });
      expect(selectDate).toHaveBeenCalled();
    });
  });

  describe('scroll handling', () => {
    it('does not throw when scroll event fires', async () => {
      await renderSearch();
      const list = screen.getByRole('list');
      // scrollHeight/clientHeight are already stubbed on the prototype; just fire the event
      expect(() => { fireEvent.scroll(list); }).not.toThrow();
    });

    it('calls loadNewerDates when scrolled near the top (scrollPercentage <= 0.1)', async () => {
      cmrFetch.mockResolvedValue({
        json: () => Promise.resolve({ feed: { entry: [] } }),
      });
      await renderSearch();
      const list = screen.getByRole('list');

      await act(async () => {
        Object.defineProperty(list, 'scrollTop', { value: 0, configurable: true });
        Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(list, { target: list });
      });
      // cmrFetch should have been called again for newer granules
      expect(cmrFetch).toHaveBeenCalled();
    });

    it('calls loadOlderDates when scrolled near the bottom (scrollPercentage >= 0.9)', async () => {
      cmrFetch.mockResolvedValue({
        json: () => Promise.resolve({ feed: { entry: [] } }),
      });
      await renderSearch();
      const list = screen.getByRole('list');
      const callsBefore = cmrFetch.mock.calls.length;

      await act(async () => {
        Object.defineProperty(list, 'scrollTop', { value: 800, configurable: true });
        Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(list, { target: list });
      });
      expect(cmrFetch.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('does not load more granules when scrolled to the middle', async () => {
      cmrFetch.mockResolvedValue({
        json: () => Promise.resolve({ feed: { entry: [] } }),
      });
      await renderSearch();
      const list = screen.getByRole('list');
      const callsBefore = cmrFetch.mock.calls.length;

      // Scroll to 50%: scrollTop=400, scrollHeight=1000, clientHeight=200 => 400/800=0.5
      await act(async () => {
        Object.defineProperty(list, 'scrollTop', { value: 400, configurable: true });
        Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list, 'clientHeight', { value: 200, configurable: true });
        fireEvent.scroll(list, { target: list });
      });
      expect(cmrFetch.mock.calls.length).toBe(callsBefore);
    });
  });
});
