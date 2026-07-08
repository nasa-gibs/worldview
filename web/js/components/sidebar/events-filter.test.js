/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import EventsFilter from './events-filter';
import util from '../../util/util';

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

// UncontrolledTooltip throws in jsdom because it can't locate its target on mount
jest.mock('reactstrap', () => ({
  ...jest.requireActual('reactstrap'),
  UncontrolledTooltip: ({ children }) => <span>{children}</span>,
}));

jest.mock('../util/switch', () => (props) => (
  <button
    type="button"
    data-testid={`switch-${props.id}`}
    data-active={`${props.active}`}
    onClick={props.toggle}
  >
    {props.label}
  </button>
));

jest.mock('../util/checkbox', () => (props) => (
  <button
    type="button"
    data-testid={`checkbox-${props.id}`}
    data-checked={`${props.checked}`}
    onClick={props.onCheck}
  >
    {props.label}
  </button>
));

jest.mock('../date-selector/date-range-selector', () => (props) => (
  <button
    type="button"
    data-testid="date-range-selector"
    onClick={() => props.setDateRange([new Date('2023-01-01'), new Date('2023-02-01')])}
  >
    date-range
  </button>
));

jest.mock('../../modules/natural-events/actions', () => ({
  setEventsFilter: jest.fn((...args) => ({ type: 'SET_EVENTS_FILTER', args })),
}));

const { setEventsFilter } = require('../../modules/natural-events/actions');
const googleTagManager = require('googleTagManager');

const eventCategories = [
  { id: 'wildfires', title: 'Wildfires', description: 'Fire events' },
  { id: 'storms', title: 'Severe Storms', description: 'Storm events' },
];

const PARENT_ID = 'event-filter-modal';

function buildState(overrides = {}) {
  return {
    events: {
      selectedCategories: overrides.selectedCategories || [eventCategories[0]],
      selectedDates: overrides.selectedDates || { start: null, end: null },
      showAll: overrides.showAll ?? true,
      showAllTracks: overrides.showAllTracks ?? false,
    },
    proj: { selected: { crs: overrides.crs || 'EPSG:4326' } },
    config: { naturalEvents: { categories: eventCategories } },
    screenSize: {
      isMobileDevice: overrides.isMobile || false,
      screenHeight: 800,
    },
  };
}

const mockStore = configureStore([]);

function renderFilter(stateOverrides = {}, ownProps = {}) {
  // provide a modal-footer node for the portal
  const parent = document.createElement('div');
  parent.id = PARENT_ID;
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  parent.appendChild(footer);
  document.body.appendChild(parent);

  const store = mockStore(buildState(stateOverrides));
  store.dispatch = jest.fn();
  const utils = render(
    <Provider store={store}>
      <EventsFilter
        parentId={PARENT_ID}
        closeModal={ownProps.closeModal || jest.fn()}
        {...ownProps}
      />
    </Provider>,
  );
  return {
    store, footer, ...utils,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

describe('EventsFilter rendering', () => {
  it('renders the date range selector and category switches', () => {
    const { getByTestId } = renderFilter();
    expect(getByTestId('date-range-selector')).toBeTruthy();
    expect(getByTestId('switch-wildfires-switch')).toBeTruthy();
    expect(getByTestId('switch-storms-switch')).toBeTruthy();
  });

  it('renders the map-extent checkbox for non-polar projections', () => {
    const { getByTestId } = renderFilter();
    expect(getByTestId('checkbox-map-extent-filter')).toBeTruthy();
  });

  it('hides the map-extent checkbox for polar projections', () => {
    const { queryByTestId } = renderFilter({ crs: 'EPSG:3413' });
    expect(queryByTestId('checkbox-map-extent-filter')).toBeNull();
  });

  it('renders the show-all-tracks checkbox', () => {
    const { getByTestId } = renderFilter();
    expect(getByTestId('checkbox-show-all-tracks-filter')).toBeTruthy();
  });

  it('renders the Apply and Cancel buttons in the modal footer portal', () => {
    const { footer } = renderFilter();
    expect(footer.querySelector('#filter-apply-btn')).toBeTruthy();
    expect(footer.querySelector('#filter-cancel-btn')).toBeTruthy();
  });

  it('applies mobile font styling when on a mobile device', () => {
    const { container } = renderFilter({ isMobile: true });
    expect(container.querySelector('.wv-header').style.fontSize).toBe('14px');
  });
});

describe('EventsFilter category toggles', () => {
  it('removes a category when an active switch is toggled off', () => {
    const { getByTestId, footer } = renderFilter();
    // wildfires is active by default; toggling removes it -> Apply becomes disabled
    fireEvent.click(getByTestId('switch-wildfires-switch'));
    expect(footer.querySelector('#filter-apply-btn').disabled).toBe(true);
  });

  it('adds a category when an inactive switch is toggled on', () => {
    const { getByTestId, footer } = renderFilter();
    fireEvent.click(getByTestId('switch-storms-switch'));
    expect(footer.querySelector('#filter-apply-btn').disabled).toBe(false);
  });

  it('selects all categories when the All switch is toggled on', () => {
    const { getByTestId, footer } = renderFilter({ selectedCategories: [] });
    // with no selected categories, allNone starts false -> toggling selects all
    fireEvent.click(getByTestId('switch-header-disable'));
    expect(footer.querySelector('#filter-apply-btn').disabled).toBe(false);
  });

  it('clears all categories when the All switch is toggled off', () => {
    const { getByTestId, footer } = renderFilter();
    // with selected categories, allNone starts true -> toggling clears them
    fireEvent.click(getByTestId('switch-header-disable'));
    expect(footer.querySelector('#filter-apply-btn').disabled).toBe(true);
  });
});

describe('EventsFilter checkboxes', () => {
  it('toggles the list-all (map extent) option', () => {
    const { getByTestId } = renderFilter();
    const checkbox = getByTestId('checkbox-map-extent-filter');
    expect(checkbox.getAttribute('data-checked')).toBe('false');
    fireEvent.click(checkbox);
    expect(getByTestId('checkbox-map-extent-filter').getAttribute('data-checked')).toBe('true');
  });

  it('toggles the show-all-tracks option', () => {
    const { getByTestId } = renderFilter();
    const checkbox = getByTestId('checkbox-show-all-tracks-filter');
    expect(checkbox.getAttribute('data-checked')).toBe('false');
    fireEvent.click(checkbox);
    expect(getByTestId('checkbox-show-all-tracks-filter').getAttribute('data-checked')).toBe('true');
  });
});

describe('EventsFilter apply', () => {
  it('closes the modal and dispatches the filter on apply', () => {
    const closeModal = jest.fn();
    const { footer, store } = renderFilter({}, { closeModal });
    fireEvent.click(footer.querySelector('#filter-apply-btn'));
    expect(closeModal).toHaveBeenCalled();
    expect(setEventsFilter).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('passes formatted dates to the filter when a date range is set', () => {
    const closeModal = jest.fn();
    const { getByTestId, footer } = renderFilter({}, { closeModal });
    fireEvent.click(getByTestId('date-range-selector'));
    fireEvent.click(footer.querySelector('#filter-apply-btn'));
    const callArgs = setEventsFilter.mock.calls[0];
    expect(callArgs[1]).toBe(util.toISOStringDate(new Date('2023-01-01')));
    expect(callArgs[2]).toBe(util.toISOStringDate(new Date('2023-02-01')));
  });

  it('pushes an analytics event when the show-all setting changes', () => {
    const { getByTestId, footer } = renderFilter({ showAll: true });
    // toggle list-all off so listAll !== showAll
    fireEvent.click(getByTestId('checkbox-map-extent-filter'));
    fireEvent.click(footer.querySelector('#filter-apply-btn'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'natural_events_current_view_only',
    });
  });

  it('pushes the show-all analytics event when enabling show all', () => {
    const { getByTestId, footer } = renderFilter({ showAll: false });
    fireEvent.click(getByTestId('checkbox-map-extent-filter'));
    fireEvent.click(footer.querySelector('#filter-apply-btn'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'natural_events_show_all',
    });
  });

  it('disables apply when only one of start/end date is set', () => {
    const { footer } = renderFilter({
      selectedDates: { start: '2023-01-01', end: null },
    });
    const applyBtn = footer.querySelector('#filter-apply-btn');
    expect(applyBtn.disabled).toBe(true);
    expect(applyBtn.title).toContain('Must have both start and end date');
  });

  it('initializes the date range from the selected start and end dates', () => {
    const { footer } = renderFilter({
      selectedDates: { start: '2023-03-01', end: '2023-03-15' },
    });
    // both dates present + a category selected -> apply enabled
    expect(footer.querySelector('#filter-apply-btn').disabled).toBe(false);
  });

  it('cancels via the Cancel button', () => {
    const closeModal = jest.fn();
    const { footer } = renderFilter({}, { closeModal });
    fireEvent.click(footer.querySelector('#filter-cancel-btn'));
    expect(closeModal).toHaveBeenCalled();
  });
});
