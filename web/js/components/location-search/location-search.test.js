import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('./location-search-modal', () => function MockLocationSearchModal() {
  return <div data-testid="location-search-modal" />;
});

jest.mock('../../modules/location-search/actions', () => ({
  toggleShowLocationSearch: jest.fn(() => ({ type: 'TOGGLE_SHOW_SEARCH' })),
}));

jest.mock('../../modules/location-search/util', () => ({
  isLocationSearchFeatureEnabled: jest.fn(() => true),
}));

import { isLocationSearchFeatureEnabled } from '../../modules/location-search/util';
import LocationSearch from './location-search';

const mockStore = configureStore([]);

function buildStore(overrides = {}) {
  return mockStore({
    screenSize: { isMobileDevice: false },
    config: { features: { locationSearch: true } },
    modal: { isOpen: false, id: null },
    measure: { isActive: false },
    animation: { gifActive: false },
    locationSearch: { isExpanded: true },
    ui: { isDistractionFreeModeActive: false },
    ...overrides,
  });
}

function renderLocationSearch(storeOverrides = {}) {
  const store = buildStore(storeOverrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <LocationSearch />
      </Provider>,
    ),
  };
}

describe('LocationSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isLocationSearchFeatureEnabled.mockReturnValue(true);
  });

  test('renders LocationSearchModal when feature is enabled and expanded on desktop', () => {
    const { getByTestId } = renderLocationSearch();
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('renders nothing when feature is disabled', () => {
    isLocationSearchFeatureEnabled.mockReturnValue(false);
    const { queryByTestId } = renderLocationSearch();
    expect(queryByTestId('location-search-modal')).not.toBeInTheDocument();
  });

  test('does not render modal when not expanded on desktop', () => {
    const { queryByTestId } = renderLocationSearch({
      locationSearch: { isExpanded: false },
    });
    expect(queryByTestId('location-search-modal')).not.toBeInTheDocument();
  });

  test('renders modal on mobile regardless of isExpanded', () => {
    const { getByTestId } = renderLocationSearch({
      screenSize: { isMobileDevice: true },
      locationSearch: { isExpanded: false },
    });
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('collapses when measure tool is active on desktop', () => {
    const { queryByTestId } = renderLocationSearch({
      measure: { isActive: true },
      locationSearch: { isExpanded: true },
    });
    expect(queryByTestId('location-search-modal')).not.toBeInTheDocument();
  });

  test('collapses when GIF is active on desktop', () => {
    const { queryByTestId } = renderLocationSearch({
      animation: { gifActive: true },
      locationSearch: { isExpanded: true },
    });
    expect(queryByTestId('location-search-modal')).not.toBeInTheDocument();
  });

  test('collapses when distraction free mode is active on desktop', () => {
    const { queryByTestId } = renderLocationSearch({
      ui: { isDistractionFreeModeActive: true },
      locationSearch: { isExpanded: true },
    });
    expect(queryByTestId('location-search-modal')).not.toBeInTheDocument();
  });

  test('collapses when snapshot modal is open on desktop', () => {
    const { queryByTestId } = renderLocationSearch({
      modal: { isOpen: true, id: 'TOOLBAR_SNAPSHOT' },
      locationSearch: { isExpanded: true },
    });
    expect(queryByTestId('location-search-modal')).not.toBeInTheDocument();
  });

  test('remains visible on mobile even when measure tool is active', () => {
    const { getByTestId } = renderLocationSearch({
      screenSize: { isMobileDevice: true },
      measure: { isActive: true },
    });
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('remains visible on mobile even when GIF is active', () => {
    const { getByTestId } = renderLocationSearch({
      screenSize: { isMobileDevice: true },
      animation: { gifActive: true },
    });
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('remains visible on mobile even when distraction free mode is active', () => {
    const { getByTestId } = renderLocationSearch({
      screenSize: { isMobileDevice: true },
      ui: { isDistractionFreeModeActive: true },
    });
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('remains visible on mobile even when snapshot modal is open', () => {
    const { getByTestId } = renderLocationSearch({
      screenSize: { isMobileDevice: true },
      modal: { isOpen: true, id: 'TOOLBAR_SNAPSHOT' },
    });
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('does not collapse on desktop when modal is open but is not snapshot modal', () => {
    const { getByTestId } = renderLocationSearch({
      modal: { isOpen: true, id: 'SOME_OTHER_MODAL' },
      locationSearch: { isExpanded: true },
    });
    expect(getByTestId('location-search-modal')).toBeInTheDocument();
  });

  test('dispatches toggleShowLocationSearch when re-rendered with changed isMobile while expanded', () => {
    const { toggleShowLocationSearch: mockToggle } = require('../../modules/location-search/actions');
    const store = buildStore({
      locationSearch: { isExpanded: true },
      screenSize: { isMobileDevice: false },
    });
    const { rerender } = render(
      <Provider store={store}>
        <LocationSearch />
      </Provider>,
    );
    const mobileStore = buildStore({
      locationSearch: { isExpanded: true },
      screenSize: { isMobileDevice: true },
    });
    rerender(
      <Provider store={mobileStore}>
        <LocationSearch />
      </Provider>,
    );
    expect(mockToggle).toHaveBeenCalled();
  });
});
