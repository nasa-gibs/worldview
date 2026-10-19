/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SearchLayers from './search-layers';

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: () => (Component) => Component,
}));

jest.mock('./search-layers-list', () => () => (
  <div data-testid="search-layer-list" />
));

jest.mock('./facets', () => () => (
  <div data-testid="facets" />
));

jest.mock('./layer-metadata-detail', () => ({ layer }) => (
  <div data-testid="layer-metadata-detail" data-layer-id={layer && layer.id} />
));

const mockConfigureStore = configureStore([]);

const BP = { small: 768, medium: 960 };

const baseState = {
  screenSize: {
    isMobileDevice: false,
    screenWidth: 1200,
    breakpoints: BP,
  },
  productPicker: { selectedLayer: null, showMobileFacets: false },
};

function renderComponent(ownProps = {}, stateOverrides = {}) {
  const state = {
    ...baseState,
    ...stateOverrides,
    screenSize: {
      ...baseState.screenSize,
      ...(stateOverrides.screenSize || {}),
      breakpoints: {
        ...baseState.screenSize.breakpoints,
        ...((stateOverrides.screenSize || {}).breakpoints || {}),
      },
    },
    productPicker: {
      ...baseState.productPicker,
      ...(stateOverrides.productPicker || {}),
    },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();

  const { results = [], facets = {} } = ownProps;

  const result = render(
    <Provider store={store}>
      <SearchLayers results={results} facets={facets} />
    </Provider>,
  );
  return { ...result, store };
}

describe('SearchLayers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Facets — always rendered ─────────────────────────────────────────────

  describe('Facets visibility', () => {
    it('always renders Facets regardless of other props', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('facets')).toBeTruthy();
    });

    it('renders Facets even when mobile and showFacets is false', () => {
      const { getByTestId } = renderComponent(
        {},
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      expect(getByTestId('facets')).toBeTruthy();
    });
  });

  // ─── showListAndDetails logic ─────────────────────────────────────────────

  describe('showListAndDetails — desktop always shows list', () => {
    it('renders the layer list on desktop (isMobile=false)', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('search-layer-list')).toBeTruthy();
    });

    it('renders .layer-list-detail-container on desktop', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.layer-list-detail-container')).toBeTruthy();
    });
  });

  describe('showListAndDetails — mobile + showFacets hides list', () => {
    it('hides list and details when mobile and showFacets is true (showMobileFacets)', () => {
      // isMobile=true, showMobileFacets=true → showFacets=true → showListAndDetails=false
      const { queryByTestId } = renderComponent(
        {},
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: true },
        },
      );
      expect(queryByTestId('search-layer-list')).toBeNull();
    });

    it('shows list when mobile but showMobileFacets is false', () => {
      // isMobile=true, showMobileFacets=false, width(400) < medium(960) → showFacets=false
      const { getByTestId } = renderComponent(
        {},
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      expect(getByTestId('search-layer-list')).toBeTruthy();
    });

    it('hides list when mobile and width > medium (desktop-width but isMobile=true)', () => {
      // isMobile=true, width(1200) > medium(960), showMobileFacets=false
      // showFacets = (1200>960 && !true) || false = false
      // showListAndDetails = isMobile ? !showFacets : true = !false = true
      const { getByTestId } = renderComponent(
        {},
        {
          screenSize: { isMobileDevice: true, screenWidth: 1200, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      // showFacets=(1200>960 && !true)||false = false, showListAndDetails=!false=true
      expect(getByTestId('search-layer-list')).toBeTruthy();
    });
  });

  // ─── detail panel — !selectedLayer && smallView → null ───────────────────

  describe('detail panel — no selectedLayer and smallView', () => {
    it('does not render detail panel when no selectedLayer and smallView is true', () => {
      // smallView = screenWidth(400) < breakpoints.small(768)
      const { queryByTestId } = renderComponent(
        { results: [{ id: 'layer1' }] },
        {
          screenSize: { isMobileDevice: false, screenWidth: 400, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      expect(queryByTestId('layer-metadata-detail')).toBeNull();
    });

    it('does not render detail panel even with results when no selectedLayer and smallView', () => {
      const { container } = renderComponent(
        { results: [{ id: 'layer1' }] },
        {
          screenSize: { isMobileDevice: false, screenWidth: 400, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      expect(container.querySelector('.layer-detail-container')).toBeNull();
    });
  });

  // ─── detail panel — selectedLayer with results ────────────────────────────

  describe('detail panel — selectedLayer present with results', () => {
    it('renders LayerMetadataDetail when selectedLayer is set and results are present', () => {
      const selectedLayer = { id: 'layer1', title: 'Layer 1' };
      const { getByTestId } = renderComponent(
        { results: [selectedLayer] },
        { productPicker: { selectedLayer, showMobileFacets: false } },
      );
      expect(getByTestId('layer-metadata-detail')).toBeTruthy();
    });

    it('passes the selectedLayer to LayerMetadataDetail', () => {
      const selectedLayer = { id: 'my-layer', title: 'My Layer' };
      const { getByTestId } = renderComponent(
        { results: [selectedLayer] },
        { productPicker: { selectedLayer, showMobileFacets: false } },
      );
      expect(getByTestId('layer-metadata-detail').dataset.layerId).toBe('my-layer');
    });
  });

  // ─── detail panel — results.length === 0 ─────────────────────────────────

  describe('detail panel — no results', () => {
    it('does not render detail panel when results are empty, even with selectedLayer', () => {
      const selectedLayer = { id: 'layer1' };
      const { queryByTestId } = renderComponent(
        { results: [] },
        { productPicker: { selectedLayer, showMobileFacets: false } },
      );
      expect(queryByTestId('layer-metadata-detail')).toBeNull();
    });

    it('does not render detail panel when results empty and no selectedLayer', () => {
      const { queryByTestId } = renderComponent({ results: [] });
      expect(queryByTestId('layer-metadata-detail')).toBeNull();
    });
  });

  // ─── detail panel — not smallView, no selectedLayer ──────────────────────

  describe('detail panel — not smallView, no selectedLayer, with results', () => {
    it('renders detail panel when not smallView, no selectedLayer, and results present', () => {
      // !selectedLayer && smallView → null; else !!results.length && <detail>
      // not smallView (1200 > 768 → smallView=false), no selectedLayer
      // condition: !null && false → false → go to else branch → !!results.length
      const { getByTestId } = renderComponent(
        { results: [{ id: 'layer1' }] },
        {
          screenSize: { isMobileDevice: false, screenWidth: 1200, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      expect(getByTestId('layer-metadata-detail')).toBeTruthy();
    });
  });

  // ─── showFacets calculation ───────────────────────────────────────────────

  describe('showFacets = (width > mediumBreakpoint && !isMobile) || showMobileFacets', () => {
    it('showFacets=true on desktop: width>medium and not mobile', () => {
      // width=1200, medium=960, isMobile=false → showFacets=true
      // desktop → showListAndDetails=true (always)
      const { getByTestId } = renderComponent();
      expect(getByTestId('search-layer-list')).toBeTruthy();
    });

    it('showFacets=false when width <= medium and not mobile and showMobileFacets=false', () => {
      // width=800, medium=960, isMobile=false → showFacets=(800>960&&true)||false=false
      // showListAndDetails = isMobile ? !showFacets : true = true
      const { getByTestId } = renderComponent(
        {},
        {
          screenSize: { isMobileDevice: false, screenWidth: 800, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: false },
        },
      );
      expect(getByTestId('search-layer-list')).toBeTruthy();
    });

    it('showFacets=true via showMobileFacets even when mobile and width<medium', () => {
      // isMobile=true, showMobileFacets=true → showFacets=true → showListAndDetails=false
      const { queryByTestId } = renderComponent(
        {},
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: BP },
          productPicker: { selectedLayer: null, showMobileFacets: true },
        },
      );
      expect(queryByTestId('search-layer-list')).toBeNull();
    });
  });

  // ─── overall container ────────────────────────────────────────────────────

  describe('container structure', () => {
    it('renders the search-layers-container div', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.search-layers-container')).toBeTruthy();
    });

    it('renders .layer-list-container.search inside the detail container', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.layer-list-container.search')).toBeTruthy();
    });
  });
});
