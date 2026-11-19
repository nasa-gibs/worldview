/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Facets from './facets';
import {
  toggleMobileFacets as toggleMobileFacetsAction,
  collapseFacet as collapseFacetAction,
} from '../../../../modules/product-picker/actions';
import facetConfig from '../../../../modules/product-picker/facet-config';

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: () => (Component) => Component,
}));

jest.mock('./filter-chips', () => ({ filters, facetConfig: fc }) => (
  <div
    data-testid="filter-chips"
    data-filter-count={filters ? filters.length : 0}
    data-facet-config-length={fc ? fc.length : 0}
  />
));

jest.mock('./product-facet', () => ({ config, data, collapsed, toggleCollapse }) => (
  <div data-testid={`product-facet-${config.field}`} data-collapsed={String(!!collapsed)}>
    <button
      data-testid={`collapse-btn-${config.field}`}
      onClick={() => toggleCollapse(config.field)}
    >
      toggle
    </button>
    <span data-testid={`data-count-${config.field}`}>{data.length}</span>
  </div>
));

jest.mock('../../../../modules/product-picker/actions', () => ({
  toggleMobileFacets: jest.fn(() => ({ type: 'TOGGLE_MOBILE_FACETS' })),
  collapseFacet: jest.fn(() => ({ type: 'COLLAPSE_FACET' })),
}));

jest.mock('../../../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => '2023-05-01'),
}));

const mockConfigureStore = configureStore([]);

const baseState = {
  screenSize: {
    isMobileDevice: false,
    screenWidth: 1200,
    breakpoints: { small: 768 },
  },
  productPicker: {
    showMobileFacets: false,
    collapsedFacets: {},
  },
};

const baseSearchProps = {
  facets: {},
  filters: [],
  removeFilter: jest.fn(),
  results: [{ id: 'layer1' }],
};

const renderFacets = (searchProps = {}, stateOverrides = {}) => {
  const state = {
    ...baseState,
    ...stateOverrides,
    screenSize: { ...baseState.screenSize, ...(stateOverrides.screenSize || {}) },
    productPicker: { ...baseState.productPicker, ...(stateOverrides.productPicker || {}) },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();

  const result = render(
    <Provider store={store}>
      <Facets {...baseSearchProps} {...searchProps} />
    </Provider>,
  );
  return { ...result, store };
};

describe('Facets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showFacets visibility', () => {
    it('renders null when desktop, no results, and showMobileFacets is false', () => {
      const { container } = renderFacets({ results: [] });
      expect(container.firstChild).toBeNull();
    });

    it('renders null when mobile with results but showMobileFacets is false', () => {
      const { container } = renderFacets(
        { results: [{ id: 'layer1' }] },
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: { small: 768 } },
          productPicker: { showMobileFacets: false, collapsedFacets: {} },
        },
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders content when desktop with results', () => {
      const { getByTestId } = renderFacets({ results: [{ id: 'layer1' }] });
      expect(getByTestId('filter-chips')).toBeTruthy();
    });

    it('renders content when mobile and showMobileFacets is true even with no results', () => {
      const { getByTestId } = renderFacets(
        { results: [] },
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: { small: 768 } },
          productPicker: { showMobileFacets: true, collapsedFacets: {} },
        },
      );
      expect(getByTestId('filter-chips')).toBeTruthy();
    });
  });

  describe('CSS class names', () => {
    it('uses facet-container class on desktop', () => {
      const { container } = renderFacets();
      expect(container.firstChild.className).toBe('facet-container');
    });

    it('uses mobile class when isMobile is true', () => {
      const { container } = renderFacets(
        {},
        {
          screenSize: { isMobileDevice: true, screenWidth: 1200, breakpoints: { small: 768 } },
          productPicker: { showMobileFacets: true, collapsedFacets: {} },
        },
      );
      expect(container.firstChild.className).toBe('facet-container-mobile facet-container');
    });

    it('uses mobile class when screenWidth is less than breakpoints.small', () => {
      const { container } = renderFacets(
        {},
        {
          screenSize: { isMobileDevice: false, screenWidth: 500, breakpoints: { small: 768 } },
        },
      );
      expect(container.firstChild.className).toBe('facet-container-mobile facet-container');
    });
  });

  describe('FilterChips', () => {
    it('renders FilterChips with the filters prop', () => {
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { getByTestId } = renderFacets({ filters });
      expect(getByTestId('filter-chips').dataset.filterCount).toBe('1');
    });

    it('passes facetConfig to FilterChips', () => {
      const { getByTestId } = renderFacets();
      expect(getByTestId('filter-chips').dataset.facetConfigLength).toBe(String(facetConfig.length));
    });
  });

  describe('ProductFacet rendering', () => {
    it('renders a ProductFacet for each entry in facetConfig', () => {
      renderFacets();
      facetConfig.forEach((config) => {
        expect(document.querySelector(`[data-testid="product-facet-${config.field}"]`)).toBeTruthy();
      });
    });

    it('passes facet data when available for a field', () => {
      const data = [{ value: 'Always', count: 10 }];
      const facets = { coverage: [{ data }] };
      const { getByTestId } = renderFacets({ facets });
      expect(getByTestId('data-count-coverage').textContent).toBe(String(data.length));
    });

    it('passes empty array when facet field is absent from facets', () => {
      const { getByTestId } = renderFacets({ facets: {} });
      expect(getByTestId('data-count-coverage').textContent).toBe('0');
    });

    it('passes empty array when facet entry exists but has no items', () => {
      const { getByTestId } = renderFacets({ facets: { coverage: [] } });
      expect(getByTestId('data-count-coverage').textContent).toBe('0');
    });

    it('passes collapsed=true when field is collapsed in collapsedFacets', () => {
      const { getByTestId } = renderFacets(
        {},
        { productPicker: { showMobileFacets: false, collapsedFacets: { coverage: true } } },
      );
      expect(getByTestId('product-facet-coverage').dataset.collapsed).toBe('true');
    });

    it('passes collapsed=false when field is not in collapsedFacets', () => {
      const { getByTestId } = renderFacets(
        {},
        { productPicker: { showMobileFacets: false, collapsedFacets: {} } },
      );
      expect(getByTestId('product-facet-coverage').dataset.collapsed).toBe('false');
    });
  });

  describe('Apply button', () => {
    it('does not render Apply button on desktop', () => {
      const { queryByText } = renderFacets();
      expect(queryByText('Apply')).toBeNull();
    });

    it('renders Apply button when mobile and showMobileFacets is true', () => {
      const { getByText } = renderFacets(
        { results: [] },
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: { small: 768 } },
          productPicker: { showMobileFacets: true, collapsedFacets: {} },
        },
      );
      expect(getByText('Apply')).toBeTruthy();
    });

    it('dispatches toggleMobileFacets when Apply button is clicked', () => {
      const { getByText, store } = renderFacets(
        { results: [] },
        {
          screenSize: { isMobileDevice: true, screenWidth: 400, breakpoints: { small: 768 } },
          productPicker: { showMobileFacets: true, collapsedFacets: {} },
        },
      );
      fireEvent.click(getByText('Apply'));
      expect(toggleMobileFacetsAction).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MOBILE_FACETS' });
    });
  });

  describe('toggleCollapseFacet dispatch', () => {
    it('dispatches collapseFacet with the correct field when a facet collapse is toggled', () => {
      const { getByTestId, store } = renderFacets();
      fireEvent.click(getByTestId('collapse-btn-coverage'));
      expect(collapseFacetAction).toHaveBeenCalledWith('coverage');
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'COLLAPSE_FACET' });
    });
  });
});
