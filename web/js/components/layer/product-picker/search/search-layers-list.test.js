/* eslint-disable react/prop-types */
import { render, act, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SearchLayerList from './search-layers-list';
import {
  selectLayer as selectLayerAction,
  clearSingleRecentLayer as clearSingleRecentLayerAction,
} from '../../../../modules/product-picker/actions';

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: () => (Component) => Component,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

jest.mock('./search-layer-row', () => ({ layer }) => (
  <div data-testid={`row-${layer.id}`} />
));

jest.mock('../browse/recent-layers-info', () => () => (
  <div data-testid="recent-layers-info" />
));

jest.mock('../../../util/swipe-to-delete', () => ({ children, onDelete }) => (
  <div data-testid="swipe-delete" onClick={onDelete}>{children}</div>
));

jest.mock('../../../../modules/product-picker/actions', () => ({
  selectLayer: jest.fn(() => ({ type: 'SELECT_LAYER' })),
  clearSingleRecentLayer: jest.fn(() => ({ type: 'CLEAR_RECENT' })),
}));

jest.mock('react-infinite-scroller', () => ({ children }) => (
  <div data-testid="infinite-scroll">{children}</div>
));

const mockConfigureStore = configureStore([]);

const baseState = {
  productPicker: { selectedLayer: null, categoryType: 'search' },
  screenSize: { isMobileDevice: false },
};

/**
 * Build a store + render helper.
 * Pass `results` as a direct prop since withSearch is a passthrough mock.
 * The component only populates visibleItems after componentDidUpdate fires
 * (when prevProps.results !== results), so we render with [] first then
 * rerender with the real results to trigger the update cycle.
 */
function renderComponent(ownProps = {}, stateOverrides = {}) {
  const state = {
    ...baseState,
    ...stateOverrides,
    productPicker: {
      ...baseState.productPicker,
      ...(stateOverrides.productPicker || {}),
    },
    screenSize: {
      ...baseState.screenSize,
      ...(stateOverrides.screenSize || {}),
    },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();

  const { results = [], selectedLayer, isMobile, recentLayerMode } = ownProps;

  const makeJsx = (r) => (
    <Provider store={store}>
      <SearchLayerList
        results={r}
        selectedLayer={selectedLayer}
        isMobile={isMobile}
        recentLayerMode={recentLayerMode}
      />
    </Provider>
  );

  // Initial render with empty results so state starts clean
  const renderResult = render(makeJsx([]));

  // Rerender with actual results → triggers componentDidUpdate which loads items
  act(() => {
    renderResult.rerender(makeJsx(results));
  });

  return { ...renderResult, store };
}

describe('SearchLayerList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── renderNoResults ──────────────────────────────────────────────────────

  describe('renderNoResults — non-recentLayerMode', () => {
    it('shows the no-results div with "No layers found!" when results are empty', () => {
      const { container, getByText } = renderComponent({ results: [] });
      expect(container.querySelector('.no-results')).toBeTruthy();
      expect(getByText(/No layers found!/)).toBeTruthy();
    });

    it('renders the FontAwesome icon in the no-results view', () => {
      const { getByTestId } = renderComponent({ results: [] });
      expect(getByTestId('fa-icon')).toBeTruthy();
    });

    it('does not render InfiniteScroll when there are no results', () => {
      const { queryByTestId } = renderComponent({ results: [] });
      expect(queryByTestId('infinite-scroll')).toBeNull();
    });
  });

  describe('renderNoResults — recentLayerMode', () => {
    it('shows RecentLayersInfo when results are empty and recentLayerMode is true', () => {
      const { getByTestId } = renderComponent(
        { results: [] },
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      expect(getByTestId('recent-layers-info')).toBeTruthy();
    });

    it('does not show the no-results div in recentLayerMode', () => {
      const { container } = renderComponent(
        { results: [] },
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      expect(container.querySelector('.no-results')).toBeNull();
    });
  });

  // ─── render with results ─────────────────────────────────────────────────

  describe('render with results', () => {
    it('renders InfiniteScroll when results are present', () => {
      const results = [{ id: 'layer1' }, { id: 'layer2' }];
      const { getByTestId } = renderComponent({ results });
      expect(getByTestId('infinite-scroll')).toBeTruthy();
    });

    it('renders a SearchLayerRow for each visible item on desktop (non-recentLayerMode)', () => {
      const results = [{ id: 'layer1' }, { id: 'layer2' }];
      const { getByTestId } = renderComponent({ results });
      expect(getByTestId('row-layer1')).toBeTruthy();
      expect(getByTestId('row-layer2')).toBeTruthy();
    });

    it('does not render SwipeToDelete on desktop regardless of recentLayerMode', () => {
      const results = [{ id: 'layer1' }];
      const { queryByTestId } = renderComponent(
        { results },
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      expect(queryByTestId('swipe-delete')).toBeNull();
    });
  });

  // ─── mobile + recentLayerMode ─────────────────────────────────────────────

  describe('mobile + recentLayerMode — SwipeToDelete', () => {
    it('wraps rows in SwipeToDelete when mobile and recentLayerMode', () => {
      const results = [{ id: 'layer1' }];
      const { getByTestId } = renderComponent(
        { results },
        {
          productPicker: { selectedLayer: null, categoryType: 'recent' },
          screenSize: { isMobileDevice: true },
        },
      );
      expect(getByTestId('swipe-delete')).toBeTruthy();
      expect(getByTestId('row-layer1')).toBeTruthy();
    });

    it('dispatches clearSingleRecentLayer when SwipeToDelete onDelete fires', () => {
      const layer = { id: 'layer1' };
      const { getByTestId, store } = renderComponent(
        { results: [layer] },
        {
          productPicker: { selectedLayer: null, categoryType: 'recent' },
          screenSize: { isMobileDevice: true },
        },
      );
      fireEvent.click(getByTestId('swipe-delete'));
      expect(clearSingleRecentLayerAction).toHaveBeenCalledWith(layer);
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'CLEAR_RECENT' });
    });
  });

  // ─── loadMoreItems ────────────────────────────────────────────────────────

  describe('loadMoreItems', () => {
    it('loads up to 50 items from results into visibleItems on first render', () => {
      const results = Array.from({ length: 60 }, (_, i) => ({ id: `layer${i}` }));
      const { getAllByTestId } = renderComponent({ results });
      const rows = getAllByTestId(/^row-layer/);
      expect(rows).toHaveLength(50);
    });

    it('sets hasMoreItems=false when all results fit within the first 50', () => {
      const results = Array.from({ length: 10 }, (_, i) => ({ id: `layer${i}` }));
      const { getAllByTestId } = renderComponent({ results });
      expect(getAllByTestId(/^row-layer/)).toHaveLength(10);
    });
  });

  // ─── showLayerMetadata ────────────────────────────────────────────────────

  describe('showLayerMetadata', () => {
    it('calls selectLayer(null) when selectedLayer is not in the results list', () => {
      // selectedLayer exists but is absent from results → showLayerMetadata(null)
      const selectedLayer = { id: 'missing-layer' };
      renderComponent(
        { results: [{ id: 'other-layer' }], selectedLayer },
        { productPicker: { selectedLayer, categoryType: 'search' } },
      );
      expect(selectLayerAction).toHaveBeenCalledWith(null);
    });

    it('calls selectLayer(layer) when no selectedLayer and result is available', () => {
      // componentDidUpdate auto-selects first result when firstLoadAutoSelect is false
      const layer = { id: 'layer1' };
      renderComponent({ results: [layer] });
      expect(selectLayerAction).toHaveBeenCalledWith(layer);
    });

    it('does NOT re-call selectLayer when layer already selected and has metadata', () => {
      const layer = { id: 'layer1', metadata: '<p>info</p>' };
      renderComponent(
        { results: [layer], selectedLayer: layer },
        { productPicker: { selectedLayer: layer, categoryType: 'search' } },
      );
      // selectedLayer in results and has metadata → no re-select
      expect(selectLayerAction).not.toHaveBeenCalled();
    });
  });

  // ─── getDerivedStateFromProps ─────────────────────────────────────────────

  describe('getDerivedStateFromProps', () => {
    it('sets firstLoadAutoSelect=true when selectedLayer prop is present', () => {
      const layer = { id: 'layer1', metadata: '<p>info</p>' };
      // selectedLayer already set → getDerivedStateFromProps returns {firstLoadAutoSelect:true}
      // so componentDidUpdate does NOT auto-select; selectLayer is never called
      renderComponent(
        { results: [layer], selectedLayer: layer },
        { productPicker: { selectedLayer: layer, categoryType: 'search' } },
      );
      expect(selectLayerAction).not.toHaveBeenCalled();
    });
  });

  // ─── componentDidUpdate — auto-select first result ────────────────────────

  describe('componentDidUpdate — auto-select first result', () => {
    it('auto-selects the first result when no selectedLayer and results are present', () => {
      const layer = { id: 'layer1' };
      renderComponent({ results: [layer] });
      expect(selectLayerAction).toHaveBeenCalledWith(layer);
    });

    it('does not auto-select when results array is empty', () => {
      renderComponent({ results: [] });
      expect(selectLayerAction).not.toHaveBeenCalled();
    });
  });
});
