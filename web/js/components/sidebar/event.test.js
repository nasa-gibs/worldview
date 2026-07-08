/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import Event from './event';
import util from '../../util/util';

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

jest.mock('./event-icon', () => (props) => (
  <span data-testid="event-icon" data-category={props.category} />
));

jest.mock('../util/monospace-date', () => (props) => (
  <span data-testid="monospace-date">{props.date}</span>
));

const googleTagManager = require('googleTagManager');

const date1 = '2023-05-01T00:00:00Z';
const date2 = '2023-05-02T00:00:00Z';

function buildEvent(overrides = {}) {
  return {
    id: 'EONET_1000',
    title: 'Test Wildfire',
    categories: [{ id: 'wildfires', title: 'Wildfires' }],
    sources: [{ id: 'src1', url: 'http://example.com/event' }],
    geometry: [{ date: date1 }],
    ...overrides,
  };
}

function buildProps(overrides = {}) {
  const { event: eventOverride, ...rest } = overrides;
  return {
    defaultEventLayer: 'default-layer',
    deselectEvent: jest.fn(),
    eventLayers: ['eventLayerA'],
    highlightEvent: jest.fn(),
    isSelected: false,
    isHighlighted: false,
    layers: [
      { id: 'L1', group: 'overlays', layergroup: 'Other' },
      { id: 'L2', group: 'overlays', layergroup: 'Reference' },
      { id: 'L3', group: 'baselayers', layergroup: 'Other' },
    ],
    removeGroup: jest.fn(),
    selectedDate: util.toISOStringDate(date1),
    selectEvent: jest.fn(),
    sources: [{ id: 'src1', title: 'Source One' }],
    toggleGroupVisibility: jest.fn(),
    toggleVisibility: jest.fn(),
    unHighlightEvent: jest.fn(),
    ...rest,
    event: buildEvent(eventOverride),
  };
}

function renderEvent(overrides = {}) {
  const props = buildProps(overrides);
  const utils = render(<ul><Event {...props} /></ul>);
  return { props, ...utils };
}

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Event rendering', () => {
  it('renders the event title and icon', () => {
    const { getByText, getByTestId } = renderEvent();
    expect(getByText('Test Wildfire')).toBeTruthy();
    expect(getByTestId('event-icon').getAttribute('data-category')).toBe('wildfires');
  });

  it('renders the MonospaceDate when not selected', () => {
    const { getByTestId } = renderEvent({ isSelected: false });
    expect(getByTestId('monospace-date')).toBeTruthy();
  });

  it('applies the selected class and shows the reference list when selected', () => {
    const { container } = renderEvent({ isSelected: true });
    expect(container.querySelector('.item-selected')).toBeTruthy();
    expect(container.querySelector('.natural-event-link')).toBeTruthy();
  });

  it('applies the selected class when highlighted', () => {
    const { container } = renderEvent({ isHighlighted: true });
    expect(container.querySelector('.item-selected')).toBeTruthy();
  });
});

describe('Event selection', () => {
  it('selects the event and pushes analytics when an unselected event is clicked', () => {
    const { container, props } = renderEvent({ isSelected: false });
    fireEvent.click(container.querySelector('li.event'));
    expect(props.toggleVisibility).toHaveBeenCalledWith('default-layer', false);
    expect(props.selectEvent).toHaveBeenCalledWith('EONET_1000', expect.any(String));
    expect(googleTagManager.pushEvent).toHaveBeenCalled();
  });

  it('deselects the event and hides overlay layers when a selected event is clicked', () => {
    const { container, props } = renderEvent({ isSelected: true });
    fireEvent.click(container.querySelector('li.event'));
    expect(props.toggleGroupVisibility).toHaveBeenCalledWith(['L1'], false);
    expect(props.removeGroup).toHaveBeenCalledWith(['eventLayerA']);
    expect(props.toggleVisibility).toHaveBeenCalledWith('default-layer', true);
    expect(props.deselectEvent).toHaveBeenCalled();
  });
});

describe('Event highlight', () => {
  it('highlights on mouse enter and un-highlights on mouse leave', () => {
    const { container, props } = renderEvent();
    const li = container.querySelector('li.event');
    fireEvent.mouseEnter(li);
    expect(props.highlightEvent).toHaveBeenCalledWith('EONET_1000', expect.any(String));
    fireEvent.mouseLeave(li);
    expect(props.unHighlightEvent).toHaveBeenCalled();
  });
});

describe('Event date list (multi-geometry)', () => {
  const multiGeometry = {
    event: { geometry: [{ date: date1 }, { date: date2 }] },
  };

  it('renders a list of dates when the event has multiple geometries', () => {
    const { container } = renderEvent({ ...multiGeometry, isSelected: true });
    expect(container.querySelectorAll('ul.dates li.date').length).toBe(2);
  });

  it('marks the currently selected date as active and stops propagation on click', () => {
    const { container, props } = renderEvent({
      ...multiGeometry,
      isSelected: true,
      selectedDate: util.toISOStringDate(date1),
    });
    const active = container.querySelector('.active');
    expect(active).toBeTruthy();
    fireEvent.click(active);
    // clicking the active date must not trigger another selection
    expect(props.selectEvent).not.toHaveBeenCalled();
  });

  it('selects a different date when a non-active date link is clicked', () => {
    const { container, props } = renderEvent({
      ...multiGeometry,
      isSelected: true,
      selectedDate: util.toISOStringDate(date1),
    });
    const link = container.querySelector('a[role="link"]');
    fireEvent.click(link);
    expect(props.selectEvent).toHaveBeenCalledWith('EONET_1000', util.toISOStringDate(date2));
  });

  it('hides the date list when not selected', () => {
    const { container } = renderEvent({ ...multiGeometry, isSelected: false });
    expect(container.querySelector('ul.dates').style.display).toBe('none');
  });
});

describe('Event magnitude output', () => {
  it('renders wind speed for kts magnitude', () => {
    const { getByText } = renderEvent({
      isSelected: true,
      event: {
        geometry: [
          { date: date1 },
          { date: date2, magnitudeUnit: 'kts', magnitudeValue: 50 },
        ],
      },
    });
    expect(getByText(/Wind Speed:/)).toBeTruthy();
  });

  it('renders surface area for non-kts magnitude', () => {
    const { getByText } = renderEvent({
      isSelected: true,
      event: {
        geometry: [
          { date: date1 },
          { date: date2, magnitudeUnit: 'NM2', magnitudeValue: 1200 },
        ],
      },
    });
    expect(getByText(/Surface Area:/)).toBeTruthy();
  });
});

describe('Event reference list', () => {
  it('renders a plain source title when a reference has no url', () => {
    const { getByText } = renderEvent({
      isSelected: true,
      event: { sources: [{ id: 'src1' }] },
    });
    expect(getByText(/Source One/)).toBeTruthy();
  });

  it('handles sources provided as a single object rather than an array', () => {
    const { container } = renderEvent({
      isSelected: true,
      event: { sources: { id: 'src1', url: 'http://example.com' } },
    });
    expect(container.querySelector('.natural-event-link')).toBeTruthy();
  });

  it('renders no reference links when the sources array is empty', () => {
    const { container } = renderEvent({
      isSelected: true,
      event: { sources: [] },
    });
    expect(container.querySelector('.natural-event-link')).toBeNull();
  });

  it('stops propagation when a reference link is clicked', () => {
    const { container, props } = renderEvent({ isSelected: true });
    fireEvent.click(container.querySelector('.natural-event-link'));
    // clicking the link should not bubble up to select/deselect the event
    expect(props.deselectEvent).not.toHaveBeenCalled();
  });
});

describe('Event scroll into view', () => {
  it('scrolls the selected event into view', () => {
    jest.useFakeTimers();
    renderEvent({ isSelected: true });
    jest.runAllTimers();
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not scroll when the event is not selected', () => {
    jest.useFakeTimers();
    renderEvent({ isSelected: false });
    jest.runAllTimers();
    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
