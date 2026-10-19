/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const capture = {};
  const mockConnect = (msp, mdp) => {
    capture.msp = msp;
    capture.mdp = mdp;
    return (Component) => Component;
  };
  mockConnect.connectCapture = capture;
  return { ...actual, connect: mockConnect };
});

jest.mock('react-device-detect', () => ({
  isMobileOnly: false,
  isTablet: false,
}));

jest.mock('reactstrap', () => ({
  Button: ({
    children, onClick, id, className, disabled,
  }) => (
    <button
      type="button"
      data-testid={id || 'reactstrap-button'}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('../../components/sidebar/event', () => function MockEvent(props) {
  return (
    <li
      data-testid={`event-${props.event.id}`}
      data-is-selected={String(props.isSelected)}
      data-is-highlighted={String(props.isHighlighted)}
    >
      <button
        type="button"
        data-testid={`select-${props.event.id}`}
        onClick={() => props.selectEvent(props.event.id, props.event.date)}
      >
        select
      </button>
      <button
        type="button"
        data-testid={`deselect-${props.event.id}`}
        onClick={props.deselectEvent}
      >
        deselect
      </button>
      <button
        type="button"
        data-testid={`highlight-${props.event.id}`}
        onClick={() => props.highlightEvent(props.event.id, props.event.date)}
      >
        highlight
      </button>
      <button
        type="button"
        data-testid={`unhighlight-${props.event.id}`}
        onClick={props.unHighlightEvent}
      >
        unhighlight
      </button>
    </li>
  );
});

jest.mock('../../components/sidebar/event-icon', () => function MockEventIcon({ id, category, title }) {
  return <span data-testid={`event-icon-${category}`} title={title}>{id}</span>;
});

jest.mock('../../components/sidebar/events-filter', () => function MockEventFilterModalBody() {
  return <div data-testid="events-filter-modal-body" />;
});

jest.mock('../../components/util/scrollbar', () => function MockScrollbars({ children, style, className }) {
  return (
    <div
      data-testid="scrollbars"
      className={className}
      style={style}
    >
      {children}
    </div>
  );
});

jest.mock('../../modules/natural-events/actions', () => ({
  selectEvent: jest.fn((id, date) => ({ type: 'SELECT_EVENT', id, date })),
  deselectEvent: jest.fn(() => ({ type: 'DESELECT_EVENT' })),
  highlightEvent: jest.fn((id, date) => ({ type: 'HIGHLIGHT_EVENT', id, date })),
  unHighlightEvent: jest.fn(() => ({ type: 'UNHIGHLIGHT_EVENT' })),
}));

jest.mock('../../modules/sidebar/actions', () => ({
  collapseSidebar: jest.fn(() => ({ type: 'COLLAPSE_SIDEBAR' })),
}));

jest.mock('../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2021-06-15')),
}));

jest.mock('../../modules/modal/actions', () => ({
  toggleCustomContent: jest.fn((key, opts) => ({ type: 'TOGGLE_CUSTOM_CONTENT', key, opts })),
}));

jest.mock('../../modules/layers/actions', () => ({
  addLayer: jest.fn((id) => ({ type: 'ADD_LAYER', id })),
  removeGroup: jest.fn((ids) => ({ type: 'REMOVE_GROUP', ids })),
  toggleVisibility: jest.fn((ids, vis) => ({ type: 'TOGGLE_VISIBILITY', ids, vis })),
  toggleGroupVisibility: jest.fn((ids, vis) => ({ type: 'TOGGLE_GROUP_VISIBILITY', ids, vis })),
}));

jest.mock('../../util/util', () => ({
  toISOStringDate: jest.fn(() => '2021-06-15'),
}));

jest.mock('../../modules/date/util', () => ({
  formatDisplayDate: jest.fn((d) => d || ''),
}));

import Events from './events';
import {
  selectEvent as selectEventActionCreator,
  deselectEvent as deselectEventActionCreator,
  highlightEvent as highlightEventActionCreator,
  unHighlightEvent as unHighlightEventActionCreator,
} from '../../modules/natural-events/actions';
import { collapseSidebar } from '../../modules/sidebar/actions';
import { toggleCustomContent } from '../../modules/modal/actions';
import {
  addLayer as addLayerAction,
  removeGroup as removeGroupAction,
  toggleVisibility as toggleVisibilityAction,
  toggleGroupVisibility as toggleGroupVisibilityAction,
} from '../../modules/layers/actions';
import { getSelectedDate } from '../../modules/date/selectors';
import { formatDisplayDate } from '../../modules/date/util';
import util from '../../util/util';

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  formatDisplayDate.mockImplementation((d) => d || '');
  util.toISOStringDate.mockReturnValue('2021-06-15');
  getSelectedDate.mockReturnValue(new Date('2021-06-15'));
  const rdd = require('react-device-detect');
  rdd.isMobileOnly = false;
  rdd.isTablet = false;
});

const defaultEvent = { id: 'EVT001', date: '2021-06-10' };

const defaultProps = {
  defaultEventLayer: 'HLS_Shortwave_Infrared_Combination',
  deselectEvent: jest.fn(),
  eventLayers: [],
  eventsData: [],
  hasRequestError: false,
  height: 600,
  highlighted: { id: null },
  highlightEvent: jest.fn(),
  isLoading: false,
  isMobile: false,
  isEmbedModeActive: false,
  layers: [],
  openFilterModal: jest.fn(),
  removeGroup: jest.fn(),
  selectedDate: '2021-06-15',
  selected: { id: null },
  selectEvent: jest.fn(),
  selectedStartDate: '2021-01-01',
  selectedEndDate: '2021-12-31',
  selectedCategories: [],
  showAlert: false,
  showDates: false,
  sources: [{ id: 'src1', title: 'Source 1' }],
  toggleVisibility: jest.fn(),
  toggleGroupVisibility: jest.fn(),
  unHighlightEvent: jest.fn(),
};

const renderComponent = (propOverrides = {}) => render(
  <Events {...defaultProps} {...propOverrides} />,
);

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Events rendering', () => {
  it('renders the event container', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.event-container')).toBeInTheDocument();
  });

  it('renders the filter controls section', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.filter-controls')).toBeInTheDocument();
  });

  it('renders the filter button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('event-filter-button')).toBeInTheDocument();
  });

  it('renders the scrollbars component', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('scrollbars')).toBeInTheDocument();
  });

  it('shows "no events" message when eventsData is empty and not loading', () => {
    const { container } = renderComponent({ eventsData: [], isLoading: false });
    expect(container.querySelector('.no-events')).toBeInTheDocument();
  });

  it('does not show "no events" message when loading', () => {
    const { container } = renderComponent({ eventsData: [], isLoading: true });
    expect(container.querySelector('.no-events')).not.toBeInTheDocument();
  });

  it('shows loading text when isLoading is true', () => {
    const { container } = renderComponent({ isLoading: true });
    expect(container.querySelector('.events-loading-text')).toBeInTheDocument();
    expect(container.querySelector('.events-loading-text').textContent).toContain('Loading ...');
  });

  it('shows error text when hasRequestError is true', () => {
    const { container } = renderComponent({ hasRequestError: true, isLoading: false });
    const el = container.querySelector('.events-loading-text');
    expect(el).toBeInTheDocument();
    expect(el.textContent).toContain('ERROR');
  });

  it('shows error icon when hasRequestError is true', () => {
    const { getByTestId } = renderComponent({ hasRequestError: true, isLoading: false });
    expect(getByTestId('fa-icon-exclamation-triangle')).toBeInTheDocument();
  });

  it('does not show error icon when hasRequestError is false', () => {
    const { queryByTestId } = renderComponent({ isLoading: true, hasRequestError: false });
    expect(queryByTestId('fa-icon-exclamation-triangle')).not.toBeInTheDocument();
  });

  it('renders event list when eventsData has items', () => {
    const { getByTestId } = renderComponent({ eventsData: [defaultEvent] });
    expect(getByTestId(`event-${defaultEvent.id}`)).toBeInTheDocument();
  });

  it('renders one Event component per event', () => {
    const events = [{ id: 'E1', date: 'd1' }, { id: 'E2', date: 'd2' }, { id: 'E3', date: 'd3' }];
    const { getAllByTestId } = renderComponent({ eventsData: events });
    // each event renders 4 buttons plus the li
    expect(getAllByTestId(/^event-E/)).toHaveLength(3);
  });

  it('marks event as selected when selected.id matches', () => {
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      selected: { id: defaultEvent.id },
    });
    expect(getByTestId(`event-${defaultEvent.id}`)).toHaveAttribute('data-is-selected', 'true');
  });

  it('marks event as not selected when selected.id does not match', () => {
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      selected: { id: 'other' },
    });
    expect(getByTestId(`event-${defaultEvent.id}`)).toHaveAttribute('data-is-selected', 'false');
  });

  it('marks event as highlighted when highlighted.id matches', () => {
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      highlighted: { id: defaultEvent.id },
    });
    expect(getByTestId(`event-${defaultEvent.id}`)).toHaveAttribute('data-is-highlighted', 'true');
  });

  it('shows date range when showDates is true', () => {
    formatDisplayDate.mockImplementation((d) => d);
    const { container } = renderComponent({
      showDates: true,
      selectedStartDate: '2021-01-01',
      selectedEndDate: '2021-12-31',
    });
    expect(container.querySelector('.filter-dates').textContent).toContain('2021-01-01');
    expect(container.querySelector('.filter-dates').textContent).toContain('2021-12-31');
  });

  it('does not show date range when showDates is false', () => {
    const { container } = renderComponent({ showDates: false });
    expect(container.querySelector('.filter-dates').textContent).toBe('');
  });

  it('renders EventIcon for each selected category', () => {
    const cats = [{ id: 'volcanoes', title: 'Volcanoes' }, { id: 'floods', title: 'Floods' }];
    const { getByTestId } = renderComponent({ selectedCategories: cats });
    expect(getByTestId('event-icon-volcanoes')).toBeInTheDocument();
    expect(getByTestId('event-icon-floods')).toBeInTheDocument();
  });
});

// ─── Scrollbar height ─────────────────────────────────────────────────────────

describe('Events scrollbar height', () => {
  it('uses pixel maxHeight when not in embed mode', () => {
    const { getByTestId } = renderComponent({ height: 600, isEmbedModeActive: false });
    const scrollbars = getByTestId('scrollbars');
    expect(scrollbars.style.maxHeight).toBe('485px');
  });

  it('uses 50vh maxHeight in embed mode', () => {
    const { getByTestId } = renderComponent({ isEmbedModeActive: true });
    const scrollbars = getByTestId('scrollbars');
    expect(scrollbars.style.maxHeight).toBe('50vh');
  });

  it('clamps maxHeight to at least 166px for small heights', () => {
    const { getByTestId } = renderComponent({ height: 100, isEmbedModeActive: false });
    const scrollbars = getByTestId('scrollbars');
    expect(scrollbars.style.maxHeight).toBe('166px');
  });
});

// ─── Filter button ────────────────────────────────────────────────────────────

describe('Events filter button', () => {
  it('has filter-button class when not in embed mode', () => {
    const { getByTestId } = renderComponent({ isEmbedModeActive: false });
    expect(getByTestId('event-filter-button').className).toBe('filter-button');
  });

  it('has filter-button-hidden class in embed mode', () => {
    const { getByTestId } = renderComponent({ isEmbedModeActive: true });
    expect(getByTestId('event-filter-button').className).toBe('filter-button-hidden');
  });

  it('is disabled when isLoading is true', () => {
    const { getByTestId } = renderComponent({ isLoading: true });
    expect(getByTestId('event-filter-button')).toBeDisabled();
  });

  it('is enabled when isLoading is false', () => {
    const { getByTestId } = renderComponent({ isLoading: false });
    expect(getByTestId('event-filter-button')).not.toBeDisabled();
  });

  it('calls openFilterModal when filter button is clicked', () => {
    const openFilterModal = jest.fn();
    const { getByTestId } = renderComponent({ openFilterModal });
    fireEvent.click(getByTestId('event-filter-button'));
    expect(openFilterModal).toHaveBeenCalledTimes(1);
  });
});

// ─── Event interactions ───────────────────────────────────────────────────────

describe('Events event interactions', () => {
  it('calls selectEvent with event id and date when event is selected', () => {
    const selectEvent = jest.fn();
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      selectEvent,
    });
    fireEvent.click(getByTestId(`select-${defaultEvent.id}`));
    expect(selectEvent).toHaveBeenCalledWith(defaultEvent.id, defaultEvent.date, false);
  });

  it('passes isMobile to selectEvent', () => {
    const selectEvent = jest.fn();
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      selectEvent,
      isMobile: true,
    });
    fireEvent.click(getByTestId(`select-${defaultEvent.id}`));
    expect(selectEvent).toHaveBeenCalledWith(defaultEvent.id, defaultEvent.date, true);
  });

  it('calls deselectEvent when deselect is triggered', () => {
    const deselectEvent = jest.fn();
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      deselectEvent,
    });
    fireEvent.click(getByTestId(`deselect-${defaultEvent.id}`));
    expect(deselectEvent).toHaveBeenCalledTimes(1);
  });

  it('calls highlightEvent with id and date', () => {
    const highlightEvent = jest.fn();
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      highlightEvent,
    });
    fireEvent.click(getByTestId(`highlight-${defaultEvent.id}`));
    expect(highlightEvent).toHaveBeenCalledWith(defaultEvent.id, defaultEvent.date);
  });

  it('calls unHighlightEvent when triggered', () => {
    const unHighlightEvent = jest.fn();
    const { getByTestId } = renderComponent({
      eventsData: [defaultEvent],
      unHighlightEvent,
    });
    fireEvent.click(getByTestId(`unhighlight-${defaultEvent.id}`));
    expect(unHighlightEvent).toHaveBeenCalledTimes(1);
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    animation: { isPlaying: false },
    config: { naturalEvents: { defaultLayer: 'default-layer' } },
    embed: { isEmbedModeActive: false },
    events: {
      selected: { id: 'EVT1' },
      highlighted: { id: null },
      showAll: true,
      selectedDates: { start: '2021-01-01', end: '2021-12-31' },
      selectedCategories: [{ id: 'volcanoes', title: 'Volcanoes' }],
      isAnimatingToEvent: false,
    },
    screenSize: { isMobileDevice: false },
    layers: {
      eventLayers: ['layer1'],
      active: { layers: [{ id: 'active-layer' }] },
    },
    ...overrides,
  });

  it('maps defaultEventLayer from config', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.defaultEventLayer).toBe('default-layer');
  });

  it('maps eventLayers from layers.eventLayers', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.eventLayers).toEqual(['layer1']);
  });

  it('maps isPlaying from animation.isPlaying', () => {
    const state = makeState({ animation: { isPlaying: true } });
    expect(capturedMapStateToProps(state).isPlaying).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({ screenSize: { isMobileDevice: true } });
    expect(capturedMapStateToProps(state).isMobile).toBe(true);
  });

  it('maps isEmbedModeActive from embed state', () => {
    const state = makeState({ embed: { isEmbedModeActive: true } });
    expect(capturedMapStateToProps(state).isEmbedModeActive).toBe(true);
  });

  it('maps layers from layers.active.layers', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.layers).toEqual([{ id: 'active-layer' }]);
  });

  it('maps showAll from events.showAll', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.showAll).toBe(true);
  });

  it('maps selected from events.selected', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.selected).toEqual({ id: 'EVT1' });
  });

  it('maps highlighted from events.highlighted', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.highlighted).toEqual({ id: null });
  });

  it('maps selectedCategories from events.selectedCategories', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.selectedCategories).toEqual([{ id: 'volcanoes', title: 'Volcanoes' }]);
  });

  it('maps selectedStartDate from selectedDates.start', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.selectedStartDate).toBe('2021-01-01');
  });

  it('maps selectedEndDate from selectedDates.end', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.selectedEndDate).toBe('2021-12-31');
  });

  it('sets showDates to true when both start and end are set', () => {
    const result = capturedMapStateToProps(makeState());
    expect(result.showDates).toBe(true);
  });

  it('sets showDates to false when start is missing', () => {
    const state = makeState();
    state.events.selectedDates = { start: null, end: '2021-12-31' };
    expect(capturedMapStateToProps(state).showDates).toBe(false);
  });

  it('sets showDates to false when end is missing', () => {
    const state = makeState();
    state.events.selectedDates = { start: '2021-01-01', end: null };
    expect(capturedMapStateToProps(state).showDates).toBe(false);
  });

  it('maps selectedDate via util.toISOStringDate and getSelectedDate', () => {
    util.toISOStringDate.mockReturnValue('2021-06-15');
    const state = makeState();
    const result = capturedMapStateToProps(state);
    expect(result.selectedDate).toBe('2021-06-15');
    expect(getSelectedDate).toHaveBeenCalledWith(state);
  });

  it('maps isAnimatingToEvent from events.isAnimatingToEvent', () => {
    const state = makeState();
    state.events.isAnimatingToEvent = true;
    expect(capturedMapStateToProps(state).isAnimatingToEvent).toBe(true);
  });
});

// ─── mapDispatchToProps ───────────────────────────────────────────────────────

describe('mapDispatchToProps', () => {
  let dispatch;
  let mapped;

  beforeEach(() => {
    dispatch = jest.fn();
    mapped = capturedMapDispatchToProps(dispatch);
  });

  describe('selectEvent', () => {
    it('dispatches selectEventActionCreator with id and date', () => {
      mapped.selectEvent('EVT1', '2021-06-10', false);
      expect(selectEventActionCreator).toHaveBeenCalledWith('EVT1', '2021-06-10');
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SELECT_EVENT' }));
    });

    it('dispatches collapseSidebar when shouldCollapse is true', () => {
      mapped.selectEvent('EVT1', '2021-06-10', true);
      expect(collapseSidebar).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'COLLAPSE_SIDEBAR' }));
    });

    it('does not dispatch collapseSidebar when shouldCollapse is false', () => {
      mapped.selectEvent('EVT1', '2021-06-10', false);
      expect(collapseSidebar).not.toHaveBeenCalled();
    });
  });

  it('deselectEvent dispatches deselectEventActionCreator', () => {
    mapped.deselectEvent();
    expect(deselectEventActionCreator).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'DESELECT_EVENT' });
  });

  it('highlightEvent dispatches highlightEventActionCreator with id and date', () => {
    mapped.highlightEvent('EVT1', '2021-06-10');
    expect(highlightEventActionCreator).toHaveBeenCalledWith('EVT1', '2021-06-10');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'HIGHLIGHT_EVENT' }));
  });

  it('unHighlightEvent dispatches unHighlightEventActionCreator', () => {
    mapped.unHighlightEvent();
    expect(unHighlightEventActionCreator).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UNHIGHLIGHT_EVENT' });
  });

  describe('openFilterModal', () => {
    it('dispatches toggleCustomContent with events-filter key', () => {
      mapped.openFilterModal();
      expect(toggleCustomContent).toHaveBeenCalledWith(
        'events-filter',
        expect.objectContaining({ headerText: 'Filter Events' }),
      );
    });

    it('uses desktop modal class when not mobile/tablet', () => {
      mapped.openFilterModal();
      const opts = toggleCustomContent.mock.calls[0][1];
      expect(opts.modalClassName).toBe('sidebar-modal event-filter-modal');
    });

    it('uses mobile modal class when isMobileOnly is true', () => {
      const rdd = require('react-device-detect');
      rdd.isMobileOnly = true;
      mapped.openFilterModal();
      const opts = toggleCustomContent.mock.calls[0][1];
      expect(opts.modalClassName).toBe(
        'sidebar-modal-mobile event-filter-modal-mobile',
      );
    });

    it('uses mobile modal class when isTablet is true', () => {
      const rdd = require('react-device-detect');
      rdd.isTablet = true;
      mapped.openFilterModal();
      const opts = toggleCustomContent.mock.calls[0][1];
      expect(opts.modalClassName).toBe(
        'sidebar-modal-mobile event-filter-modal-mobile',
      );
    });

    it('sets footer to true and backdrop to false', () => {
      mapped.openFilterModal();
      const opts = toggleCustomContent.mock.calls[0][1];
      expect(opts.footer).toBe(true);
      expect(opts.backdrop).toBe(false);
    });

    it('sets timeout to 150', () => {
      mapped.openFilterModal();
      const opts = toggleCustomContent.mock.calls[0][1];
      expect(opts.timeout).toBe(150);
    });
  });

  it('addLayer dispatches addLayerAction with id', () => {
    mapped.addLayer('MODIS_Terra_CorrectedReflectance');
    expect(addLayerAction).toHaveBeenCalledWith('MODIS_Terra_CorrectedReflectance');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'ADD_LAYER' }));
  });

  it('toggleVisibility dispatches toggleVisibilityAction with ids and visible', () => {
    mapped.toggleVisibility(['layer1', 'layer2'], true);
    expect(toggleVisibilityAction).toHaveBeenCalledWith(['layer1', 'layer2'], true);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'TOGGLE_VISIBILITY' }));
  });

  it('removeGroup dispatches removeGroupAction with ids', () => {
    mapped.removeGroup(['group1']);
    expect(removeGroupAction).toHaveBeenCalledWith(['group1']);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'REMOVE_GROUP' }));
  });

  it('toggleGroupVisibility dispatches toggleGroupVisibilityAction', () => {
    mapped.toggleGroupVisibility(['layer1'], false);
    expect(toggleGroupVisibilityAction).toHaveBeenCalledWith(['layer1'], false);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TOGGLE_GROUP_VISIBILITY' }),
    );
  });
});
