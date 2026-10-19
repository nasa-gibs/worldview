/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SearchUiProvider from './search-ui-provider';

jest.mock('@elastic/react-search-ui', () => ({
  SearchProvider: ({ children, config }) => (
    <div data-testid="search-provider" data-has-config={!!config}>
      {children}
    </div>
  ),
}));

jest.mock('./product-picker', () => () => (
  <div data-testid="product-picker" />
));

jest.mock('../../../modules/product-picker/actions', () => ({
  initState: jest.fn(() => ({ type: 'INIT_STATE' })),
}));

const mockConfigureStore = configureStore([]);

function renderComponent(searchConfig = null) {
  const state = {
    productPicker: { searchConfig },
  };
  const store = mockConfigureStore(state);
  store.dispatch = jest.fn();

  const result = render(
    <Provider store={store}>
      <SearchUiProvider />
    </Provider>,
  );
  return { ...result, store };
}

describe('SearchUiProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when searchConfig is null', () => {
    it('renders nothing when searchConfig is null', () => {
      const { container } = renderComponent(null);
      expect(container.firstChild).toBeNull();
    });

    it('does not render SearchProvider when searchConfig is null', () => {
      const { queryByTestId } = renderComponent(null);
      expect(queryByTestId('search-provider')).toBeNull();
    });

    it('does not render ProductPicker when searchConfig is null', () => {
      const { queryByTestId } = renderComponent(null);
      expect(queryByTestId('product-picker')).toBeNull();
    });
  });

  describe('when searchConfig is provided', () => {
    const mockConfig = { apiConnector: {}, searchQuery: {} };

    it('renders SearchProvider when searchConfig is set', () => {
      const { getByTestId } = renderComponent(mockConfig);
      expect(getByTestId('search-provider')).toBeTruthy();
    });

    it('renders ProductPicker inside SearchProvider', () => {
      const { getByTestId } = renderComponent(mockConfig);
      expect(getByTestId('product-picker')).toBeTruthy();
    });

    it('passes searchConfig to SearchProvider', () => {
      const { getByTestId } = renderComponent(mockConfig);
      expect(getByTestId('search-provider').dataset.hasConfig).toBe('true');
    });
  });

  describe('componentDidMount', () => {
    it('dispatches initState on mount', () => {
      const { store } = renderComponent(null);
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'INIT_STATE' });
    });

    it('dispatches initState even when searchConfig is provided', () => {
      const { store } = renderComponent({ apiConnector: {} });
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'INIT_STATE' });
    });

    it('calls initState action creator', () => {
      const { initState } = require('../../../modules/product-picker/actions');
      renderComponent(null);
      expect(initState).toHaveBeenCalled();
    });
  });
});
