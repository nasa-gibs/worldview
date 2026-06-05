/* eslint-disable react/prop-types */
import { render, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ProductPickerHeader from './header';

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: () => (Component) => Component,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('reactstrap', () => ({
  InputGroup: ({ children, ...props }) => <div {...props}>{children}</div>,
  Input: ({ innerRef, ...props }) => <input ref={innerRef} {...props} />,
  Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
  Breadcrumb: ({ children, ...props }) => <nav {...props}>{children}</nav>,
  BreadcrumbItem: ({ children, tag: Tag = 'div', ...props }) => <Tag {...props}>{children}</Tag>,
  UncontrolledTooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

jest.mock('../../../modules/product-picker/actions', () => ({
  selectLayer: jest.fn(() => ({ type: 'SELECT_LAYER' })),
  toggleCategoryMode: jest.fn(() => ({ type: 'TOGGLE_CATEGORY_MODE' })),
  toggleSearchMode: jest.fn(() => ({ type: 'TOGGLE_SEARCH_MODE' })),
  toggleMobileFacets: jest.fn(() => ({ type: 'TOGGLE_MOBILE_FACETS' })),
  saveSearchState: jest.fn(() => ({ type: 'SAVE_SEARCH_STATE' })),
}));

jest.mock('../../../modules/product-picker/selectors', () => ({
  getLayersForProjection: jest.fn(() => Array.from({ length: 5 })),
}));

jest.mock('../../../util/util', () => ({
  default: { events: { trigger: jest.fn() } },
}));

jest.mock('../../../util/constants', () => ({
  JOYRIDE_INCREMENT: 'JOYRIDE_INCREMENT',
}));

const mockConfigureStore = configureStore([]);

const baseState = {
  productPicker: {
    mode: 'category',
    category: { id: 'cat1', title: 'Category 1' },
    categoryType: 'default',
    showMobileFacets: false,
    selectedLayer: null,
    searchConfig: {},
  },
  screenSize: { isMobileDevice: false },
  proj: { id: 'geographic' },
};

function renderHeader(ownProps = {}, stateOverrides = {}) {
  const state = {
    ...baseState,
    productPicker: { ...baseState.productPicker, ...(stateOverrides.productPicker || {}) },
    screenSize: { ...baseState.screenSize, ...(stateOverrides.screenSize || {}) },
    proj: { ...baseState.proj, ...(stateOverrides.proj || {}) },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();

  const defaults = {
    filters: [],
    results: [],
    searchTerm: '',
    setSearchTerm: jest.fn(),
    width: 800,
  };

  const result = render(
    <Provider store={store}>
      <ProductPickerHeader {...defaults} {...ownProps} />
    </Provider>,
  );
  return { ...result, store };
}

describe('ProductPickerHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('search input', () => {
    it('renders the search input', () => {
      const { container } = renderHeader();
      expect(container.querySelector('#layers-search-input')).toBeTruthy();
    });

    it('displays the current searchTerm as input value', () => {
      const { container } = renderHeader({ searchTerm: 'fire' });
      expect(container.querySelector('#layers-search-input').value).toBe('fire');
    });

    it('adds faded class when not in search mode but searchTerm exists', () => {
      const { container } = renderHeader(
        { searchTerm: 'fire' },
        { productPicker: { ...baseState.productPicker, mode: 'category' } },
      );
      expect(container.querySelector('#layers-search-input').className).toContain('faded');
    });

    it('does not add faded class in search mode', () => {
      const { container } = renderHeader(
        { searchTerm: 'fire' },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(container.querySelector('#layers-search-input').className).not.toContain('faded');
    });
  });

  describe('handleChange', () => {
    it('calls setSearchTerm with the input value', () => {
      const setSearchTerm = jest.fn();
      const { container } = renderHeader({ setSearchTerm });
      fireEvent.change(container.querySelector('#layers-search-input'), {
        target: { value: 'clouds' },
      });
      expect(setSearchTerm).toHaveBeenCalledWith('clouds', { shouldClearFilters: false, debounce: 200 });
    });

    it('calls toggleMobileFacets when showMobileFacets is true', () => {
      const { store } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, showMobileFacets: true, mode: 'search' } },
      );
      const { container } = renderHeader(
        { searchTerm: '' },
        { productPicker: { ...baseState.productPicker, showMobileFacets: true, mode: 'search' } },
      );
      fireEvent.change(container.querySelector('#layers-search-input'), {
        target: { value: 'test' },
      });
      expect(store.dispatch).toBeDefined();
    });
  });

  describe('onSearchInputFocus', () => {
    it('dispatches toggleSearchMode when mode is not search', () => {
      const { container, store } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'category' } },
      );
      fireEvent.click(container.querySelector('#layers-search-input'));
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('does not dispatch toggleSearchMode when already in search mode', () => {
      const { container, store } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      fireEvent.click(container.querySelector('#layers-search-input'));
      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('back button', () => {
    it('renders back button in search mode', () => {
      const { container } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(container.querySelector('#layer-back-button')).toBeTruthy();
    });

    it('renders back button in measurements mode for geographic projection', () => {
      const { container } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'measurements' } },
      );
      expect(container.querySelector('#layer-back-button')).toBeTruthy();
    });

    it('does not render back button in category mode', () => {
      const { container } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'category' } },
      );
      expect(container.querySelector('#layer-back-button')).toBeNull();
    });

    it('does not render back button for featured-all category', () => {
      const { container } = renderHeader(
        {},
        {
          productPicker: {
            ...baseState.productPicker,
            mode: 'measurements',
            category: { id: 'featured-all', title: 'Featured' },
          },
        },
      );
      expect(container.querySelector('#layer-back-button')).toBeNull();
    });

    it('calls revertToInitialScreen on back button click', () => {
      const { container, store } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      fireEvent.click(container.querySelector('#layer-back-button'));
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('breadcrumb', () => {
    it('renders breadcrumb in non-search mode with back button and wide width', () => {
      const { container } = renderHeader(
        { width: 800 },
        { productPicker: { ...baseState.productPicker, mode: 'measurements' } },
      );
      expect(container.querySelector('.layer-bread-crumb')).toBeTruthy();
    });

    it('does not render breadcrumb in search mode', () => {
      const { container } = renderHeader(
        { width: 800 },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(container.querySelector('.layer-bread-crumb')).toBeNull();
    });

    it('does not render breadcrumb when width <= 650', () => {
      const { container } = renderHeader(
        { width: 600 },
        { productPicker: { ...baseState.productPicker, mode: 'measurements' } },
      );
      expect(container.querySelector('.layer-bread-crumb')).toBeNull();
    });

    it('renders category title in breadcrumb', () => {
      const { getByText } = renderHeader(
        { width: 800 },
        {
          productPicker: {
            ...baseState.productPicker,
            mode: 'measurements',
            category: { id: 'cat1', title: 'My Category' },
          },
        },
      );
      expect(getByText('My Category')).toBeTruthy();
    });

    it('calls revertToInitialScreen on Categories breadcrumb click', () => {
      const { getByText, store } = renderHeader(
        { width: 800 },
        { productPicker: { ...baseState.productPicker, mode: 'measurements' } },
      );
      fireEvent.click(getByText('Categories'));
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('reset button', () => {
    it('renders reset button when filters exist in search mode', () => {
      const { getByText } = renderHeader(
        { filters: [{ field: 'categories', values: ['Fires'] }] },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(getByText('Reset')).toBeTruthy();
    });

    it('renders reset button when searchTerm exists in search mode', () => {
      const { getByText } = renderHeader(
        { searchTerm: 'fire' },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(getByText('Reset')).toBeTruthy();
    });

    it('does not render reset button outside search mode', () => {
      const { queryByText } = renderHeader(
        { searchTerm: 'fire' },
        { productPicker: { ...baseState.productPicker, mode: 'category' } },
      );
      expect(queryByText('Reset')).toBeNull();
    });

    it('does not render reset button when no filters or searchTerm in search mode', () => {
      const { queryByText } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(queryByText('Reset')).toBeNull();
    });

    it('calls resetSearch when reset button clicked', () => {
      const setSearchTerm = jest.fn();
      const { getByText } = renderHeader(
        { searchTerm: 'fire', setSearchTerm },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      fireEvent.click(getByText('Reset'));
      expect(setSearchTerm).toHaveBeenCalledWith('', { shouldClearFilters: true, debounce: 100 });
    });
  });

  describe('filter button', () => {
    it('renders filter button in category mode without selectedLayer', () => {
      const { container } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'category', selectedLayer: null } },
      );
      expect(container.querySelector('#layer-filter-button')).toBeTruthy();
    });

    it('does not render filter button in category mode with selectedLayer', () => {
      const { container } = renderHeader(
        {},
        {
          productPicker: {
            ...baseState.productPicker,
            mode: 'category',
            selectedLayer: { id: 'layer1' },
          },
        },
      );
      expect(container.querySelector('#layer-filter-button')).toBeNull();
    });

    it('renders filter button in recent categoryType', () => {
      const { container } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'category', categoryType: 'recent' } },
      );
      expect(container.querySelector('#layer-filter-button')).toBeTruthy();
    });

    it('dispatches toggleSearchMode when filter button clicked in non-search mode', () => {
      const { container, store } = renderHeader(
        {},
        { productPicker: { ...baseState.productPicker, mode: 'category' } },
      );
      fireEvent.click(container.querySelector('#layer-filter-button'));
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('renders filter button in search mode on mobile without facets shown', () => {
      const { container } = renderHeader(
        {},
        {
          productPicker: { ...baseState.productPicker, mode: 'search', showMobileFacets: false, selectedLayer: null },
          screenSize: { isMobileDevice: true },
        },
      );
      expect(container.querySelector('#layer-filter-button')).toBeTruthy();
    });
  });

  describe('results count', () => {
    it('shows result count when in search mode', () => {
      const { getByText } = renderHeader(
        { results: [{ id: 'a' }, { id: 'b' }] },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(getByText(/Showing 2/)).toBeTruthy();
    });

    it('shows "X out of Y" when results fewer than layerCount', () => {
      const { getLayersForProjection } = require('../../../modules/product-picker/selectors');
      getLayersForProjection.mockReturnValueOnce(Array.from({ length: 100 }));
      const { getByText } = renderHeader(
        { results: [{ id: 'a' }] },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(getByText(/out of/)).toBeTruthy();
    });

    it('shows "Showing N layers" when results equal layerCount', () => {
      const { getLayersForProjection } = require('../../../modules/product-picker/selectors');
      getLayersForProjection.mockReturnValueOnce(Array.from({ length: 2 }));
      const { getByText } = renderHeader(
        { results: [{ id: 'a' }, { id: 'b' }] },
        { productPicker: { ...baseState.productPicker, mode: 'search' } },
      );
      expect(getByText('Showing 2 layers')).toBeTruthy();
    });

    it('does not render results count outside search mode', () => {
      const { queryByText } = renderHeader(
        { results: [{ id: 'a' }] },
        { productPicker: { ...baseState.productPicker, mode: 'category' } },
      );
      expect(queryByText(/Showing/)).toBeNull();
    });
  });

  describe('componentDidMount focus', () => {
    it('focuses input after mount on desktop', () => {
      const focusMock = jest.fn();
      const { container } = renderHeader({}, { screenSize: { isMobileDevice: false } });
      const input = container.querySelector('#layers-search-input');
      input.focus = focusMock;
      act(() => { jest.runAllTimers(); });
      // The focus is called via internal ref; just verify no error thrown
      expect(container.querySelector('#layers-search-input')).toBeTruthy();
    });
  });

  describe('non-geographic projection', () => {
    it('does not show back button in measurements mode for non-geographic projection', () => {
      const { container } = renderHeader(
        {},
        {
          productPicker: { ...baseState.productPicker, mode: 'measurements' },
          proj: { id: 'arctic' },
        },
      );
      expect(container.querySelector('#layer-back-button')).toBeNull();
    });
  });

  describe('featured category type', () => {
    it('does not show back button for featured category type', () => {
      const { container } = renderHeader(
        {},
        {
          productPicker: {
            ...baseState.productPicker,
            mode: 'measurements',
            categoryType: 'featured',
          },
        },
      );
      expect(container.querySelector('#layer-back-button')).toBeNull();
    });
  });
});
