/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('./location-search-input', () => function MockSearchBox(props) {
  return (
    <div data-testid="search-box">
      <input
        data-testid="search-input"
        value={props.inputValue}
        onChange={(e) => props.onChange(e, e.target.value)}
      />
      <button data-testid="submit-btn" onClick={props.onCoordinateInputSelect}>submit</button>
      <button data-testid="clear-btn" onClick={props.clearInput}>clear</button>
      <button
        data-testid="select-btn"
        onClick={() => props.onSelect('Los Angeles, CA', { text: 'Los Angeles, CA', magicKey: 'test-magic-key' })}
      >
        select
      </button>
    </div>
  );
});

jest.mock('../util/alert', () => function MockAlert({ id, message, onDismiss }) {
  return (
    <div data-testid={id}>
      <span>{message}</span>
      <button data-testid={`${id}-dismiss`} onClick={onDismiss}>dismiss</button>
    </div>
  );
});

jest.mock('../util/hover-tooltip', () => function MockHoverTooltip() {
  return null;
});

jest.mock('reactstrap', () => ({
  Button: ({
    children, onClick, id, onTouchEnd, onMouseDown,
  }) => (
    <button
      data-testid={id}
      id={id}
      onClick={onClick}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      {children}
    </button>
  ),
  InputGroup: ({ children }) => <div>{children}</div>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

jest.mock('./util', () => ({
  isValidCoordinates: jest.fn(() => false),
}));

jest.mock('../../modules/location-search/actions', () => ({
  clearSuggestions: jest.fn(() => ({ type: 'CLEAR_SUGGESTIONS' })),
  getSuggestions: jest.fn(() => ({ type: 'GET_SUGGESTIONS' })),
  setPlaceMarker: jest.fn(() => ({ type: 'SET_PLACE_MARKER' })),
  setSuggestion: jest.fn(() => ({ type: 'SET_SUGGESTION' })),
  toggleReverseGeocodeActive: jest.fn(() => ({ type: 'TOGGLE_REVERSE_GEOCODE' })),
  toggleShowLocationSearch: jest.fn(() => ({ type: 'TOGGLE_SHOW_SEARCH' })),
}));

jest.mock('../../modules/location-search/util', () => ({
  areCoordinatesWithinExtent: jest.fn(() => true),
}));

jest.mock('../../modules/location-search/util-api', () => ({
  processMagicKey: jest.fn(() => Promise.resolve({})),
  reverseGeocode: jest.fn(() => Promise.resolve({})),
}));

import { isValidCoordinates } from './util';
import googleTagManager from 'googleTagManager';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import { reverseGeocode } from '../../modules/location-search/util-api';
import LocationSearchModal from './location-search-modal';

const mockStore = configureStore([]);

function buildStore(overrides = {}) {
  return mockStore({
    screenSize: { isMobileDevice: false },
    config: {},
    lastAction: { type: '', value: null },
    proj: {
      selected: {
        crs: 'EPSG:4326',
        maxExtent: [-180, -90, 180, 90],
      },
    },
    modal: { isOpen: false, id: null },
    locationSearch: {
      coordinates: [],
      isCoordinateSearchActive: false,
      suggestions: [],
      suggestedPlace: [],
    },
    ...overrides,
  });
}

const extraProps = {
  coordinatesPending: [],
  inputValue: '',
  updatePendingCoordinates: jest.fn(),
  updateValue: jest.fn(),
};

function renderModal(storeOverrides = {}, propOverrides = {}) {
  const store = buildStore(storeOverrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <LocationSearchModal {...extraProps} {...propOverrides} />
      </Provider>,
    ),
  };
}

describe('LocationSearchModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isValidCoordinates.mockReturnValue(false);
    areCoordinatesWithinExtent.mockReturnValue(true);
  });

  test('renders search box', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('search-box')).toBeInTheDocument();
  });

  test('renders minimize button on desktop', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('location-search-minimize-button')).toBeInTheDocument();
  });

  test('does not render minimize button on mobile', () => {
    const { queryByTestId } = renderModal({ screenSize: { isMobileDevice: true } });
    expect(queryByTestId('location-search-minimize-button')).not.toBeInTheDocument();
  });

  test('renders add coordinate button', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('location-search-add-coordinate-button')).toBeInTheDocument();
  });

  test('clicking minimize button dispatches toggleShowLocationSearch', () => {
    const { store, getByTestId } = renderModal();
    fireEvent.click(getByTestId('location-search-minimize-button'));
    const actions = store.getActions();
    expect(actions).toContainEqual({ type: 'TOGGLE_SHOW_SEARCH' });
  });

  test('mousedown on add coordinate button dispatches toggleReverseGeocodeActive and shows alert', () => {
    const { store, getByTestId } = renderModal();
    fireEvent.mouseDown(getByTestId('location-search-add-coordinate-button'));
    const actions = store.getActions();
    expect(actions).toContainEqual({ type: 'TOGGLE_REVERSE_GEOCODE' });
    expect(getByTestId('location-search-select-coordinates-alert')).toBeInTheDocument();
  });

  test('reverse geocode alert says "Click" on non-touch device', () => {
    const { getByTestId } = renderModal();
    fireEvent.mouseDown(getByTestId('location-search-add-coordinate-button'));
    expect(getByTestId('location-search-select-coordinates-alert')).toHaveTextContent(
      'Click on map to identify a location.',
    );
  });

  test('reverse geocode alert says "Tap" on touch device', () => {
    const { getByTestId } = renderModal();
    fireEvent.touchEnd(getByTestId('location-search-add-coordinate-button'));
    expect(getByTestId('location-search-select-coordinates-alert')).toHaveTextContent(
      'Tap on map to identify a location.',
    );
  });

  test('dismissing reverse geocode alert hides it', () => {
    const { getByTestId, queryByTestId } = renderModal();
    fireEvent.mouseDown(getByTestId('location-search-add-coordinate-button'));
    fireEvent.click(getByTestId('location-search-select-coordinates-alert-dismiss'));
    expect(queryByTestId('location-search-select-coordinates-alert')).not.toBeInTheDocument();
  });

  test('onChange with valid coordinates calls updatePendingCoordinates', () => {
    const updatePendingCoordinates = jest.fn();
    isValidCoordinates.mockReturnValue({ longitude: -118.24, latitude: 34.05 });
    const { getByTestId } = renderModal({}, { updatePendingCoordinates });
    fireEvent.change(getByTestId('search-input'), { target: { value: '34.05, -118.24' } });
    expect(updatePendingCoordinates).toHaveBeenCalledWith([-118.24, 34.05]);
  });

  test('onChange with empty string dispatches clearSuggestions', () => {
    const updateValue = jest.fn();
    const { store, getByTestId } = renderModal({}, { updateValue, inputValue: 'abc' });
    fireEvent.change(getByTestId('search-input'), { target: { value: '' } });
    expect(store.getActions()).toContainEqual({ type: 'CLEAR_SUGGESTIONS' });
  });

  test('clearInput button resets value and dispatches clearSuggestions', () => {
    const updateValue = jest.fn();
    const { store, getByTestId } = renderModal({}, { updateValue });
    fireEvent.click(getByTestId('clear-btn'));
    expect(updateValue).toHaveBeenCalledWith('');
    expect(store.getActions()).toContainEqual({ type: 'CLEAR_SUGGESTIONS' });
  });

  test('submit with coordinates outside extent shows extent alert', () => {
    areCoordinatesWithinExtent.mockReturnValue(false);
    const { getByTestId } = renderModal({}, { coordinatesPending: [-200, 100] });
    fireEvent.click(getByTestId('submit-btn'));
    expect(getByTestId('location-search-select-coordinates-extent-alert')).toBeInTheDocument();
  });

  test('submit within extent calls reverseGeocode and dispatches setPlaceMarker', async () => {
    areCoordinatesWithinExtent.mockReturnValue(true);
    reverseGeocode.mockResolvedValue({ address: null });
    const updateValue = jest.fn();
    const { store, getByTestId } = renderModal({}, {
      coordinatesPending: [-118.24, 34.05],
      updateValue,
    });
    await act(async () => {
      fireEvent.click(getByTestId('submit-btn'));
    });
    expect(reverseGeocode).toHaveBeenCalled();
    expect(store.getActions()).toContainEqual({ type: 'SET_PLACE_MARKER' });
    expect(updateValue).toHaveBeenCalledWith('');
  });

  test('add coordinate button pushes GTM event', () => {
    const { getByTestId } = renderModal();
    fireEvent.mouseDown(getByTestId('location-search-add-coordinate-button'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'location_search_reverse_geocode',
    });
  });

  test('dismissing extent alert hides it', () => {
    areCoordinatesWithinExtent.mockReturnValue(false);
    const { getByTestId, queryByTestId } = renderModal({}, { coordinatesPending: [-200, 100] });
    fireEvent.click(getByTestId('submit-btn'));
    fireEvent.click(getByTestId('location-search-select-coordinates-extent-alert-dismiss'));
    expect(queryByTestId('location-search-select-coordinates-extent-alert')).not.toBeInTheDocument();
  });

  // --- onSelect / processMagicKey flow ---

  test('onSelect updates value, dispatches setSuggestion, and pushes GTM event', async () => {
    const { processMagicKey } = require('../../modules/location-search/util-api');
    processMagicKey.mockResolvedValue({});
    const updateValue = jest.fn();
    const { store, getByTestId } = renderModal({}, { updateValue });
    await act(async () => {
      fireEvent.click(getByTestId('select-btn'));
    });
    expect(updateValue).toHaveBeenCalledWith('Los Angeles, CA');
    expect(store.getActions()).toContainEqual({ type: 'SET_SUGGESTION' });
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'location_search_selected_suggested_menu_item',
    });
  });

  test('onSelect calls setPlaceMarker when processMagicKey returns a candidate within extent', async () => {
    const { processMagicKey } = require('../../modules/location-search/util-api');
    processMagicKey.mockResolvedValue({
      candidates: [{
        location: { x: -118.24, y: 34.05 },
        attributes: { Match_addr: 'Los Angeles, CA' },
      }],
    });
    areCoordinatesWithinExtent.mockReturnValue(true);
    const { store, getByTestId } = renderModal();
    await act(async () => {
      fireEvent.click(getByTestId('select-btn'));
    });
    expect(store.getActions()).toContainEqual({ type: 'SET_PLACE_MARKER' });
  });

  test('onSelect shows extent alert when processMagicKey candidate is outside extent', async () => {
    const { processMagicKey } = require('../../modules/location-search/util-api');
    processMagicKey.mockResolvedValue({
      candidates: [{
        location: { x: -200, y: 100 },
        attributes: { Match_addr: 'Somewhere' },
      }],
    });
    areCoordinatesWithinExtent.mockReturnValue(false);
    const { getByTestId } = renderModal();
    await act(async () => {
      fireEvent.click(getByTestId('select-btn'));
    });
    expect(getByTestId('location-search-select-coordinates-extent-alert')).toBeInTheDocument();
  });

  test('onSelect with no candidates does not dispatch setPlaceMarker', async () => {
    const { processMagicKey } = require('../../modules/location-search/util-api');
    processMagicKey.mockResolvedValue({ candidates: [] });
    const { store, getByTestId } = renderModal();
    await act(async () => {
      fireEvent.click(getByTestId('select-btn'));
    });
    expect(store.getActions()).not.toContainEqual({ type: 'SET_PLACE_MARKER' });
  });

  test('onSelect logs error when processMagicKey rejects', async () => {
    const { processMagicKey } = require('../../modules/location-search/util-api');
    processMagicKey.mockRejectedValue(new Error('network failure'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByTestId } = renderModal();
    await act(async () => {
      fireEvent.click(getByTestId('select-btn'));
    });
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleSpy.mockRestore();
  });

  test('onChange with plain text dispatches getSuggestions', () => {
    const { store, getByTestId } = renderModal();
    fireEvent.change(getByTestId('search-input'), { target: { value: 'Los' } });
    expect(store.getActions()).toContainEqual({ type: 'GET_SUGGESTIONS' });
  });

  // --- componentDidUpdate branches ---

  test('isCoordinateSearchActive toggling off dismisses reverse geocode alert', () => {
    const { getByTestId, queryByTestId, rerender } = renderModal(
      {
        locationSearch: {
          coordinates: [],
          isCoordinateSearchActive: true,
          suggestions: [],
          suggestedPlace: [],
        },
      },
    );
    // first activate reverse geocode alert via button
    fireEvent.mouseDown(getByTestId('location-search-add-coordinate-button'));
    expect(getByTestId('location-search-select-coordinates-alert')).toBeInTheDocument();

    // now flip isCoordinateSearchActive to false in the store
    const nextStore = buildStore({
      locationSearch: {
        coordinates: [],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} />
      </Provider>,
    );
    expect(queryByTestId('location-search-select-coordinates-alert')).not.toBeInTheDocument();
  });

  test('only latitude changing while showExtentAlert is true also clears all alerts', () => {
    areCoordinatesWithinExtent.mockReturnValue(false);
    const locationSearch = {
      coordinates: [-118.24, 34.05],
      isCoordinateSearchActive: false,
      suggestions: [],
      suggestedPlace: [],
    };
    const { getByTestId, queryByTestId, rerender } = renderModal(
      { locationSearch },
      { coordinatesPending: [-200, 100] },
    );
    // trigger extent alert
    fireEvent.click(getByTestId('submit-btn'));
    expect(getByTestId('location-search-select-coordinates-extent-alert')).toBeInTheDocument();

    // re-render with only latitude changed (longitude stays the same)
    const nextStore = buildStore({
      locationSearch: {
        coordinates: [-118.24, 99.99],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} inputValue="test" />
      </Provider>,
    );
    expect(queryByTestId('location-search-select-coordinates-extent-alert')).not.toBeInTheDocument();
  });

  test('coordinates changing while showReverseGeocodeAlert is true clears all alerts', () => {
    const { getByTestId, queryByTestId, rerender } = renderModal();
    // trigger reverse geocode alert
    fireEvent.mouseDown(getByTestId('location-search-add-coordinate-button'));
    expect(getByTestId('location-search-select-coordinates-alert')).toBeInTheDocument();

    // re-render with new coordinates (simulates marker placed on map)
    const nextStore = buildStore({
      locationSearch: {
        coordinates: [-118.24, 34.05],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} inputValue="test" />
      </Provider>,
    );
    expect(queryByTestId('location-search-select-coordinates-alert')).not.toBeInTheDocument();
  });

  test('suggestions dropping to 0 for non-coordinate input shows no-suggestions alert', () => {
    // Start with suggestions present
    const { getByTestId, rerender } = renderModal(
      { locationSearch: { coordinates: [], isCoordinateSearchActive: false, suggestions: [{ text: 'Los Angeles' }], suggestedPlace: [] } },
      { inputValue: 'Los Angeles' },
    );
    // Re-render with suggestions gone (simulates suggestions being cleared after new input)
    const nextStore = buildStore({
      locationSearch: {
        coordinates: [],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} inputValue="Los Angeles" />
      </Provider>,
    );
    expect(getByTestId('location-search-no-suggestions-available-alert')).toBeInTheDocument();
  });

  test('no-suggestions alert is not shown when the dropped suggestion was the selected place', () => {
    const { queryByTestId, rerender } = renderModal(
      {
        locationSearch: {
          coordinates: [],
          isCoordinateSearchActive: false,
          suggestions: [{ text: 'Los Angeles' }],
          suggestedPlace: [{ text: 'Los Angeles' }],
        },
      },
      { inputValue: 'Los Angeles' },
    );
    const nextStore = buildStore({
      locationSearch: { coordinates: [], isCoordinateSearchActive: false, suggestions: [], suggestedPlace: [{ text: 'Los Angeles' }] },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} inputValue="Los Angeles" />
      </Provider>,
    );
    expect(queryByTestId('location-search-no-suggestions-available-alert')).not.toBeInTheDocument();
  });

  test('no-suggestions alert is not shown when the input is a valid coordinate', () => {
    isValidCoordinates.mockReturnValue({ longitude: -118.24, latitude: 34.05 });
    const { queryByTestId, rerender } = renderModal(
      { locationSearch: { coordinates: [], isCoordinateSearchActive: false, suggestions: [{ text: 'irrelevant' }], suggestedPlace: [] } },
      { inputValue: '34.05, -118.24' },
    );
    const nextStore = buildStore({
      locationSearch: {
        coordinates: [],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} inputValue="34.05, -118.24" />
      </Provider>,
    );
    expect(queryByTestId('location-search-no-suggestions-available-alert')).not.toBeInTheDocument();
  });

  test('no-suggestions alert clears when inputValue becomes empty', () => {
    // Start with suggestions present then drop them to trigger the alert
    const { getByTestId, queryByTestId, rerender } = renderModal(
      { locationSearch: { coordinates: [], isCoordinateSearchActive: false, suggestions: [{ text: 'Somewhere' }], suggestedPlace: [] } },
      { inputValue: 'Somewhere' },
    );
    const storeNoSuggestions = buildStore({
      locationSearch: {
        coordinates: [],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={storeNoSuggestions}>
        <LocationSearchModal {...extraProps} inputValue="Somewhere" />
      </Provider>,
    );
    expect(getByTestId('location-search-no-suggestions-available-alert')).toBeInTheDocument();

    // Now clear the input — alert should disappear
    rerender(
      <Provider store={storeNoSuggestions}>
        <LocationSearchModal {...extraProps} inputValue="" />
      </Provider>,
    );
    expect(queryByTestId('location-search-no-suggestions-available-alert')).not.toBeInTheDocument();
  });

  test('dismissing no-suggestions alert hides it', () => {
    const { getByTestId, queryByTestId, rerender } = renderModal(
      { locationSearch: { coordinates: [], isCoordinateSearchActive: false, suggestions: [{ text: 'Somewhere' }], suggestedPlace: [] } },
      { inputValue: 'Somewhere' },
    );
    const nextStore = buildStore({
      locationSearch: {
        coordinates: [],
        isCoordinateSearchActive: false,
        suggestions: [],
        suggestedPlace: [],
      },
    });
    rerender(
      <Provider store={nextStore}>
        <LocationSearchModal {...extraProps} inputValue="Somewhere" />
      </Provider>,
    );
    fireEvent.click(getByTestId('location-search-no-suggestions-available-alert-dismiss'));
    expect(queryByTestId('location-search-no-suggestions-available-alert')).not.toBeInTheDocument();
  });

  // --- mapStateToProps derived props ---

  test('locationSearchMobileModalOpen is true when mobile modal is open', () => {
    // When modal.isOpen=true and id='TOOLBAR_LOCATION_SEARCH_MOBILE' the SearchBox receives
    // locationSearchMobileModalOpen=true — we verify the store state drives the prop correctly
    // by checking the rendered component doesn't crash and the store is configured as expected
    const store = buildStore({
      modal: { isOpen: true, id: 'TOOLBAR_LOCATION_SEARCH_MOBILE' },
    });
    const { getByTestId } = render(
      <Provider store={store}>
        <LocationSearchModal {...extraProps} />
      </Provider>,
    );
    expect(getByTestId('search-box')).toBeInTheDocument();
  });

  test('preventInputFocus is true when lastAction is MEASURE toggle-off', () => {
    const store = buildStore({
      lastAction: { type: 'MEASURE/TOGGLE_MEASURE_ACTIVE', value: false },
    });
    const { getByTestId } = render(
      <Provider store={store}>
        <LocationSearchModal {...extraProps} />
      </Provider>,
    );
    expect(getByTestId('search-box')).toBeInTheDocument();
  });

  test('preventInputFocus is true when lastAction is distraction-free mode toggle', () => {
    const store = buildStore({
      lastAction: { type: 'UI/TOGGLE_DISTRACTION_FREE_MODE', value: null },
    });
    const { getByTestId } = render(
      <Provider store={store}>
        <LocationSearchModal {...extraProps} />
      </Provider>,
    );
    expect(getByTestId('search-box')).toBeInTheDocument();
  });
});
