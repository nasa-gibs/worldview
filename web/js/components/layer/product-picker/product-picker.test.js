/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ProductPicker from './product-picker';

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: () => (Component) => Component,
}));

jest.mock('./header', () => () => <div data-testid="product-picker-header" />);

jest.mock('./browse/browse-layers', () => ({ width }) => (
  <div data-testid="browse-layers" data-width={width} />
));

jest.mock('./search/search-layers', () => () => (
  <div data-testid="search-layers" />
));

jest.mock('../../../modules/modal/actions', () => ({
  onToggle: jest.fn(() => ({ type: 'ON_TOGGLE' })),
}));

jest.mock('../../../modules/product-picker/actions', () => ({
  saveSearchState: jest.fn(() => ({ type: 'SAVE_SEARCH_STATE' })),
}));

jest.mock('../../../util/util', () => ({
  __esModule: true,
  default: { events: { trigger: jest.fn() } },
}));

jest.mock('../../../util/constants', () => ({
  JOYRIDE_INCREMENT: 'JOYRIDE_INCREMENT',
}));

jest.mock('reactstrap', () => ({
  ModalBody: ({ children }) => <div data-testid="modal-body">{children}</div>,
  ModalHeader: ({ children, toggle, close }) => (
    <div data-testid="modal-header">
      {close}
      {children}
    </div>
  ),
}));

const mockConfigureStore = configureStore([]);

const baseState = {
  productPicker: {
    mode: 'category',
    category: { id: 'cat1', title: 'Category 1' },
    categoryType: 'default',
  },
  screenSize: {
    screenWidth: 1200,
  },
};

function createModalElement() {
  let el = document.getElementById('layer_picker_component');
  if (!el) {
    el = document.createElement('div');
    el.id = 'layer_picker_component';
    document.body.appendChild(el);
  }
  return el;
}

function renderComponent(stateOverrides = {}, ownProps = {}) {
  const state = {
    ...baseState,
    productPicker: { ...baseState.productPicker, ...(stateOverrides.productPicker || {}) },
    screenSize: { ...baseState.screenSize, ...(stateOverrides.screenSize || {}) },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();

  const defaults = {
    filters: [],
    searchTerm: '',
  };

  const result = render(
    <Provider store={store}>
      <ProductPicker {...defaults} {...ownProps} />
    </Provider>,
  );
  return { ...result, store };
}

describe('ProductPicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    createModalElement();
  });

  afterEach(() => {
    jest.useRealTimers();
    const el = document.getElementById('layer_picker_component');
    if (el) el.remove();
  });

  describe('rendering BrowseLayers vs SearchLayers', () => {
    it('renders BrowseLayers when mode is category', () => {
      const { getByTestId } = renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'category' },
      });
      expect(getByTestId('browse-layers')).toBeTruthy();
    });

    it('renders BrowseLayers when mode is measurements', () => {
      const { getByTestId } = renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'measurements' },
      });
      expect(getByTestId('browse-layers')).toBeTruthy();
    });

    it('renders SearchLayers when mode is search', () => {
      const { getByTestId } = renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'search' },
      });
      expect(getByTestId('search-layers')).toBeTruthy();
    });

    it('does not render browse-layers in search mode', () => {
      const { queryByTestId } = renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'search' },
      });
      expect(queryByTestId('browse-layers')).toBeNull();
    });
  });

  describe('ModalHeader and close button', () => {
    it('renders the modal header', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('modal-header')).toBeTruthy();
    });

    it('renders ProductPickerHeader inside modal header', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('product-picker-header')).toBeTruthy();
    });

    it('renders a close button', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.layer-btn-close')).toBeTruthy();
    });

    it('close button dispatches closeModal on click', () => {
      const { container, store } = renderComponent();
      container.querySelector('.layer-btn-close').click();
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('close button has top style offset in search mode', () => {
      const { container } = renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'search' },
      });
      expect(container.querySelector('.layer-btn-close').style.top).toBe('-10px');
    });

    it('close button has no top offset outside search mode', () => {
      const { container } = renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'category' },
      });
      expect(container.querySelector('.layer-btn-close').style.top).toBeFalsy();
    });
  });

  describe('setModalClass', () => {
    it('adds category-width class in category mode with non-recent categoryType', () => {
      const modalEl = createModalElement();
      renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'category', categoryType: 'default' },
      });
      expect(modalEl.classList.contains('category-width')).toBe(true);
    });

    it('adds browse-search-width class in search mode', () => {
      const modalEl = createModalElement();
      renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'search', categoryType: 'default' },
      });
      expect(modalEl.classList.contains('browse-search-width')).toBe(true);
    });

    it('adds browse-search-width for recent category type', () => {
      const modalEl = createModalElement();
      renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'category', categoryType: 'recent' },
      });
      expect(modalEl.classList.contains('browse-search-width')).toBe(true);
    });

    it('adds category-width for featured category type in category mode', () => {
      // mode='category' && categoryType !== 'recent' → first branch → category-width
      const modalEl = createModalElement();
      renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'category', categoryType: 'featured' },
      });
      expect(modalEl.classList.contains('category-width')).toBe(true);
    });

    it('adds browse-search-width for measurements mode', () => {
      const modalEl = createModalElement();
      renderComponent({
        productPicker: { ...baseState.productPicker, mode: 'measurements', categoryType: 'default' },
      });
      expect(modalEl.classList.contains('browse-search-width')).toBe(true);
    });
  });

  describe('componentWillUnmount', () => {
    it('dispatches saveSearchState on unmount', () => {
      const { unmount, store } = renderComponent();
      unmount();
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SAVE_SEARCH_STATE' }));
    });
  });

  describe('componentDidMount joyride trigger', () => {
    it('triggers JOYRIDE_INCREMENT after 200ms on mount', () => {
      const util = require('../../../util/util').default;
      renderComponent();
      act(() => { jest.advanceTimersByTime(200); });
      expect(util.events.trigger).toHaveBeenCalledWith('JOYRIDE_INCREMENT');
    });
  });

  describe('getModalWidth (via mapStateToProps)', () => {
    it('passes computed width to BrowseLayers', () => {
      // screenWidth=1200 → availableWidth=1020, 1020/310=3.29 → sizeMultiplier=3
      // width = 310*3 + (3-1)*10 + 26 = 930+20+26 = 976
      const { getByTestId } = renderComponent({ screenSize: { screenWidth: 1200 } });
      expect(getByTestId('browse-layers').dataset.width).toBe('976');
    });

    it('clamps sizeMultiplier to 1 for very small screen', () => {
      // screenWidth=300 → availableWidth=255, 255/310=0.82 → sizeMultiplier=1
      // width = 310 + 0 + 26 = 336
      const { getByTestId } = renderComponent({ screenSize: { screenWidth: 300 } });
      expect(getByTestId('browse-layers').dataset.width).toBe('336');
    });

    it('clamps sizeMultiplier to 3 for large screen', () => {
      // screenWidth=3000 → availableWidth=2550, 2550/310=8.2 → clamp to 3 → 976
      const { getByTestId } = renderComponent({ screenSize: { screenWidth: 3000 } });
      expect(getByTestId('browse-layers').dataset.width).toBe('976');
    });

    it('computes width=656 for medium screen (sizeMultiplier=2)', () => {
      // screenWidth=800 → availableWidth=680, 680/310=2.19 → sizeMultiplier=2
      // width = 310*2 + (2-1)*10 + 26 = 620+10+26 = 656
      const { getByTestId } = renderComponent({ screenSize: { screenWidth: 800 } });
      expect(getByTestId('browse-layers').dataset.width).toBe('656');
    });
  });
});
