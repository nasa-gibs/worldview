/* eslint-disable react/jsx-props-no-spreading */
import { createRef } from 'react';
import { render, act } from '@testing-library/react';
import TimelineAxis from './timeline-axis';

// Draggable just renders its single child here
jest.mock('react-draggable', () => ({ __esModule: true, default: ({ children }) => children }));

// Isolate the axis from the (separately tested) grid rendering
jest.mock('./grid-range/grid-range', () => () => null);

const START_LIMIT = '2010-01-01T00:00:00.000Z';
const END_LIMIT = '2030-01-01T00:00:00.000Z';

const createdWorkers = [];

beforeAll(() => {
  global.Worker = jest.fn().mockImplementation(() => {
    const worker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null,
    };
    createdWorkers.push(worker);
    return worker;
  });
  global.DOMParser = class {
    parseFromString() {
      return { querySelector: () => ({ textContent: '2023-01-01/2023-12-31/P1D' }) };
    }
  };
});

function makeProps(overrides = {}) {
  return {
    activeLayers: [],
    addGranuleDateRanges: jest.fn(),
    animationEndLocation: 0,
    animationStartLocation: 0,
    animEndLocationDate: null,
    animStartLocationDate: null,
    appNow: new Date('2023-06-01T00:00:00.000Z'),
    axisWidth: 1000,
    backDate: '2023-05-31T00:00:00.000Z',
    dateA: '2023-05-15T00:00:00.000Z',
    dateB: '2023-05-16T00:00:00.000Z',
    debounceChangeTimeScaleWheel: jest.fn(),
    draggerPosition: 200,
    draggerPositionB: 250,
    draggerSelected: 'selected',
    draggerTimeState: '2023-05-15T00:00:00.000Z',
    draggerTimeStateB: '2023-05-16T00:00:00.000Z',
    draggerVisible: true,
    draggerVisibleB: false,
    frontDate: '2023-05-01T00:00:00.000Z',
    hasFutureLayers: false,
    hasSubdailyLayers: false,
    hoverTime: '2023-05-15T00:00:00.000Z',
    isAnimationDraggerDragging: false,
    isAnimationPlaying: false,
    isAnimatingToEvent: false,
    isCompareModeActive: false,
    isDraggerDragging: false,
    isTimelineDragging: false,
    isTourActive: false,
    leftOffset: 500,
    matchingTimelineCoverage: [],
    onDateChange: jest.fn(),
    parentOffset: 10,
    position: 100,
    proj: { crs: 'EPSG:4326' },
    showHover: jest.fn(),
    showHoverOff: jest.fn(),
    showHoverOn: jest.fn(),
    timelineEndDateLimit: END_LIMIT,
    timelineStartDateLimit: START_LIMIT,
    timeScale: 'day',
    transformX: -50,
    updateDraggerDatePosition: jest.fn(),
    updatePositioning: jest.fn(),
    updatePositioningOnAxisStopDrag: jest.fn(),
    updatePositioningOnSimpleDrag: jest.fn(),
    updateTimelineMoveAndDrag: jest.fn(),
    describeDomainsUrl: 'https://dd.example.com',
    cmrBaseUrl: 'https://cmr.example.com',
    ...overrides,
  };
}

function mountAxis(overrides = {}) {
  const ref = createRef();
  // single props object so callback (jest.fn) references stay stable across rerenders
  const props = makeProps(overrides);
  const utils = render(<TimelineAxis ref={ref} {...props} />);
  const rerender = (newOverrides) => {
    Object.assign(props, newOverrides);
    utils.rerender(<TimelineAxis ref={ref} {...props} />);
  };
  return {
    ...utils, ref, props, rerender,
  };
}

const evt = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  persist: jest.fn(),
  type: 'mousemove',
  target: { className: { animVal: 'axis-grid-rect' } },
  clientX: 100,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  createdWorkers.length = 0;
});

describe('TimelineAxis mount & render', () => {
  it('renders the axis container and grid after mounting', () => {
    const { container } = mountAxis();
    expect(container.querySelector('.timeline-axis-container')).toBeTruthy();
    expect(container.querySelector('.timeline-axis-svg')).toBeTruthy();
  });

  it('computes a current time range on mount', () => {
    const { ref } = mountAxis();
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
    expect(ref.current.state.init).toBe(false);
  });

  it('calls updatePositioning during the initial scale update', () => {
    const { props } = mountAxis();
    expect(props.updatePositioning).toHaveBeenCalled();
  });

  it('renders matching coverage lines when coverage data is present', () => {
    const { container } = mountAxis({
      matchingTimelineCoverage: [{ startDate: '2023-05-05T00:00:00Z', endDate: '2023-05-20T00:00:00Z' }],
      frontDate: '2023-05-01T00:00:00.000Z',
      backDate: '2023-05-31T00:00:00.000Z',
    });
    expect(container.querySelector('.axis-matching-layer-coverage-line')).toBeTruthy();
  });

  it('mounts with a year timescale', () => {
    const { ref } = mountAxis({ timeScale: 'year' });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('mounts with a month timescale', () => {
    const { ref } = mountAxis({ timeScale: 'month' });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('mounts with the B dragger selected', () => {
    const { ref } = mountAxis({ draggerSelected: 'selectedB' });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('mounts in compare mode with animation dragger locations', () => {
    const { ref } = mountAxis({
      isCompareModeActive: true,
      animStartLocationDate: '2023-05-10T00:00:00.000Z',
      animEndLocationDate: '2023-05-20T00:00:00.000Z',
    });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });
});

describe('TimelineAxis updateScale variations', () => {
  it('handles a greater-to-lesser timescale change with hover', () => {
    const { ref } = mountAxis();
    act(() => {
      ref.current.updateScale('2023-05-15T00:00:00.000Z', 'day', 0.5, true, 'year');
    });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('handles updateScaleWithOffset for a past date and a future date', () => {
    const { ref } = mountAxis();
    act(() => {
      ref.current.updateScaleWithOffset('2023-05-10T00:00:00.000Z', 'day', true);
    });
    act(() => {
      ref.current.updateScaleWithOffset('2023-05-20T00:00:00.000Z', 'day', false);
    });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });
});

describe('TimelineAxis time range helpers', () => {
  it('builds a time range array for day/hour/minute/month/year scales', () => {
    ['day', 'hour', 'minute'].forEach((timeScale) => {
      const { ref } = mountAxis({ timeScale });
      const range = ref.current.getTimeRangeArray(5, 5, '2023-05-15T00:00:00.000Z');
      expect(range.length).toBeGreaterThan(0);
    });
    const { ref: yearRef } = mountAxis({ timeScale: 'year' });
    expect(yearRef.current.getTimeRangeArray(0, 0, '2023-05-15T00:00:00.000Z').length).toBeGreaterThan(0);
    const { ref: monthRef } = mountAxis({ timeScale: 'month' });
    expect(monthRef.current.getTimeRangeArray(0, 0, '2023-05-15T00:00:00.000Z').length).toBeGreaterThan(0);
  });

  it('updates the time range when dragging right (exposing past dates)', () => {
    const { ref } = mountAxis();
    let result;
    act(() => {
      result = ref.current.updateTimeRangeFromDrag(100, 50, 200, 250, 0);
    });
    expect(result.newCurrentTimeRange.length).toBeGreaterThan(0);
  });

  it('updates the time range when dragging left (exposing future dates)', () => {
    const { ref } = mountAxis();
    let result;
    act(() => {
      result = ref.current.updateTimeRangeFromDrag(100, -50, 200, 250, 0);
    });
    expect(result.newCurrentTimeRange.length).toBeGreaterThan(0);
  });

  it('updates the time range for both draggers in compare mode', () => {
    const { ref } = mountAxis({ isCompareModeActive: true });
    let result;
    act(() => {
      result = ref.current.updateTimeRangeFromDrag(100, 50, 200, 250, 30);
    });
    expect(result).toHaveProperty('newDraggerPosition');
    expect(result).toHaveProperty('newDraggerPositionB');
  });
});

describe('TimelineAxis dragger checks', () => {
  it('checkDraggerVisibility returns visible with a recalculated position', () => {
    const { ref } = mountAxis();
    const result = ref.current.checkDraggerVisibility('2023-05-15T00:00:00.000Z', false, 200, {
      frontDate: '2023-05-01T00:00:00.000Z',
      backDate: '2023-05-31T00:00:00.000Z',
      position: 100,
      transform: -50,
    });
    expect(result.isVisible).toBe(true);
  });

  it('checkDraggerVisibility returns not visible when out of range', () => {
    const { ref } = mountAxis();
    const result = ref.current.checkDraggerVisibility('2022-01-01T00:00:00.000Z', true, 200, {
      frontDate: '2023-05-01T00:00:00.000Z',
      backDate: '2023-05-31T00:00:00.000Z',
      position: 100,
      transform: -50,
    });
    expect(result.isVisible).toBe(false);
  });

  it('checkDraggerMoveOrUpdateScale evaluates A and B draggers', () => {
    const { ref } = mountAxis();
    const a = ref.current.checkDraggerMoveOrUpdateScale('2023-05-14T00:00:00.000Z', false);
    const b = ref.current.checkDraggerMoveOrUpdateScale('2023-05-17T00:00:00.000Z', true);
    expect(a).toHaveProperty('withinRange');
    expect(b).toHaveProperty('newDateInThePast');
  });

  it('checkDraggerMoveOrUpdateScale flags the appNow edge case', () => {
    const { ref } = mountAxis({
      dateA: '2023-06-01T00:00:00Z',
      backDate: '2023-06-15T00:00:00.000Z',
      appNow: new Date('2023-06-01T00:00:00.000Z'),
    });
    const result = ref.current.checkDraggerMoveOrUpdateScale('2023-05-30T00:00:00.000Z', false);
    expect(result.withinRange).toBe(false);
  });

  it('handleDraggerUpdateCheck triggers a scale update for a tour date change', () => {
    const { ref } = mountAxis({ isTourActive: true });
    act(() => {
      ref.current.handleDraggerUpdateCheck(
        '2025-01-01T00:00:00.000Z',
        '2023-05-15T00:00:00.000Z',
        '2023-05-15T00:00:00.000Z',
        false,
      );
    });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('handleDraggerUpdateCheck handles a changed date that needs an offset update', () => {
    const { ref } = mountAxis();
    act(() => {
      ref.current.handleDraggerUpdateCheck(
        '2025-01-01T00:00:00.000Z',
        '2023-05-15T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z',
        false,
      );
    });
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });
});

describe('TimelineAxis mouse / hover handlers', () => {
  it('handleMouseDown records clientX for mouse and touch events', () => {
    const { ref } = mountAxis();
    act(() => ref.current.handleMouseDown(evt({ clientX: 321 })));
    expect(ref.current.state.clientXOnDrag).toBe(321);
    act(() => ref.current.handleMouseDown(evt({ type: 'touchstart', changedTouches: [{ pageX: 654 }] })));
    expect(ref.current.state.clientXOnDrag).toBe(654);
  });

  it('showHoverOn resets the updatedTimeScale flag then fires the hover callback', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.showHoverOn(evt()));
    expect(ref.current.state.updatedTimeScale).toBe(false);
    act(() => ref.current.showHoverOn(evt()));
    expect(props.showHoverOn).toHaveBeenCalled();
  });

  it('setLineTime ignores clicks that are not on the grid rect', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.setLineTime(evt({ target: { className: { animVal: 'other' } } })));
    expect(props.updateDraggerDatePosition).not.toHaveBeenCalled();
  });

  it('setLineTime updates the dragger position on a stationary click', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleMouseDown(evt({ clientX: 100 })));
    act(() => ref.current.setLineTime(evt({ clientX: 100 })));
    expect(props.updateDraggerDatePosition).toHaveBeenCalled();
  });

  it('setLineTime in compare mode checks the other dragger visibility', () => {
    const { ref, props } = mountAxis({ isCompareModeActive: true, draggerSelected: 'selectedB' });
    act(() => ref.current.handleMouseDown(evt({ clientX: 100 })));
    act(() => ref.current.setLineTime(evt({ clientX: 100 })));
    expect(props.updateDraggerDatePosition).toHaveBeenCalled();
  });

  it('setLineTimeTouch updates the dragger position on a stationary touch', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleMouseDown(evt({ type: 'touchstart', changedTouches: [{ pageX: 150 }] })));
    act(() => ref.current.setLineTimeTouch(evt({ changedTouches: [{ pageX: 150 }] })));
    expect(props.updateDraggerDatePosition).toHaveBeenCalled();
  });

  it('setLineTimeTouch on a month scale uses the daysInMonth calculation', () => {
    const { ref, props } = mountAxis({ timeScale: 'month' });
    act(() => ref.current.handleMouseDown(evt({ type: 'touchstart', changedTouches: [{ pageX: 150 }] })));
    act(() => ref.current.setLineTimeTouch(evt({ changedTouches: [{ pageX: 150 }] })));
    expect(props.updateDraggerDatePosition).toHaveBeenCalled();
  });

  it('setLineTimeTouch ignores non grid-rect targets', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.setLineTimeTouch(evt({
      target: { className: { animVal: 'other' } },
      changedTouches: [{ pageX: 1 }],
    })));
    expect(props.updateDraggerDatePosition).not.toHaveBeenCalled();
  });
});

describe('TimelineAxis wheel and drag handlers', () => {
  it('handleWheelType zooms on a dominant vertical scroll', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleWheelType(evt({ deltaY: 10, deltaX: 0 })));
    expect(props.debounceChangeTimeScaleWheel).toHaveBeenCalled();
    expect(ref.current.state.wheelZoom).toBe(true);
  });

  it('handleWheelType pans on a dominant horizontal scroll', () => {
    jest.useFakeTimers();
    const { ref, props } = mountAxis();
    act(() => ref.current.handleWheelType(evt({ deltaY: 0, deltaX: 10, type: 'wheel' })));
    expect(props.updateTimelineMoveAndDrag).toHaveBeenCalled();
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('handleWheelPan drags right (negative deltaX)', () => {
    jest.useFakeTimers();
    const { ref } = mountAxis();
    act(() => ref.current.handleWheelPan(evt({ deltaX: -10, type: 'wheel' })));
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    expect(ref.current).toBeTruthy();
  });

  it('handleStartDrag notifies the parent it is dragging', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleStartDrag());
    expect(props.updateTimelineMoveAndDrag).toHaveBeenCalledWith(true);
  });

  it('handleDrag uses simple positioning for month/year scales', () => {
    const { ref, props } = mountAxis({ timeScale: 'month' });
    act(() => ref.current.handleDrag(evt({ type: 'mousemove' }), { deltaX: 10, x: 110 }));
    expect(props.updatePositioningOnSimpleDrag).toHaveBeenCalled();
  });

  it('handleDrag with a small right delta uses simple positioning', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleDrag(evt({ type: 'mousemove' }), { deltaX: 5, x: 105 }));
    expect(props.updatePositioningOnSimpleDrag).toHaveBeenCalled();
  });

  it('handleDrag with a large right delta rebuilds the time range', () => {
    const { ref, props } = mountAxis();
    const big = ref.current.state.dragSentinelChangeNumber * 2 + 50;
    act(() => ref.current.handleDrag(evt({ type: 'mousemove' }), { deltaX: big, x: 100 + big }));
    expect(props.updatePositioning).toHaveBeenCalled();
  });

  it('handleDrag with a large left delta rebuilds the time range', () => {
    const { ref, props } = mountAxis();
    const big = ref.current.state.dragSentinelChangeNumber * 2 + 50;
    act(() => ref.current.handleDrag(evt({ type: 'mousemove' }), { deltaX: -big, x: 100 - big }));
    expect(props.updatePositioning).toHaveBeenCalled();
  });

  it('handleDrag with a small left delta uses simple positioning', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleDrag(evt({ type: 'mousemove' }), { deltaX: -5, x: 95 }));
    expect(props.updatePositioningOnSimpleDrag).toHaveBeenCalled();
  });

  it('handleStopDrag treats a moved drag as a position update', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.handleStopDrag(evt(), { x: 9999 }, false));
    expect(props.updatePositioningOnAxisStopDrag).toHaveBeenCalled();
  });

  it('handleStopDrag treats a non-moved drag using existing hover time', () => {
    const { ref, props } = mountAxis();
    const { midPoint } = ref.current.state;
    act(() => ref.current.handleStopDrag(evt(), { x: midPoint }, false));
    expect(props.updatePositioningOnAxisStopDrag).toHaveBeenCalled();
  });

  it('handleStopDrag on a month scale calculates hover time from the front date', () => {
    const { ref, props } = mountAxis({ timeScale: 'month' });
    act(() => ref.current.handleStopDrag(evt(), { x: 9999 }, true));
    expect(props.updatePositioningOnAxisStopDrag).toHaveBeenCalled();
  });
});

describe('TimelineAxis coverage line + granule ranges', () => {
  it('getMatchingCoverageLineDimensions computes visibility and offsets', () => {
    const { ref } = mountAxis({
      frontDate: '2023-05-01T00:00:00.000Z',
      backDate: '2023-05-31T00:00:00.000Z',
      position: 0,
      transformX: 0,
      matchingTimelineCoverage: [
        { startDate: '2023-06-01T00:00:00Z', endDate: '2023-06-10T00:00:00Z' },
        { startDate: '2023-04-01T00:00:00Z', endDate: '2023-05-15T00:00:00Z' },
        { startDate: '2023-05-10T00:00:00Z', endDate: '2023-05-20T00:00:00Z' },
        { startDate: '2023-05-10T00:00:00Z', endDate: '2023-07-01T00:00:00Z' },
      ],
    });
    const dims = ref.current.getMatchingCoverageLineDimensions();
    expect(dims[0].visible).toBe(false);
    expect(dims[1].leftOffset).toBe(0);
    expect(dims[2].visible).toBe(true);
    expect(dims[3].width).toBeGreaterThan(0);
  });

  it('addTimeRanges spins up a CMR worker for CMR-availability layers', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.addTimeRanges(
      { id: 'L1', cmrAvailability: true, startDate: '2020-01-01' },
      { crs: 'EPSG:4326' },
      null,
    ));
    expect(global.Worker).toHaveBeenCalled();
    act(() => createdWorkers[0].onmessage({ data: [{ startDate: '2020', endDate: '2021' }] }));
    expect(props.addGranuleDateRanges).toHaveBeenCalled();
  });

  it('addTimeRanges spins up a DescribeDomains worker and parses domains', () => {
    const { ref, props } = mountAxis();
    act(() => ref.current.addTimeRanges(
      {
        id: 'L2', dataAvailability: 'dd', startDate: '2020-01-01', endDate: '2021-01-01',
      },
      { crs: 'EPSG:4326' },
      ['2020-01-01', '2021-01-01'],
    ));
    expect(global.Worker).toHaveBeenCalled();
    act(() => createdWorkers[0].onmessage({ data: [{ startDate: '2020', endDate: '2021' }] }));
    expect(props.addGranuleDateRanges).toHaveBeenCalled();
    act(() => createdWorkers[0].onmessage({ data: '<xml/>' }));
    expect(createdWorkers[0].postMessage).toHaveBeenCalled();
  });
});

describe('TimelineAxis componentDidUpdate', () => {
  it('updates the scale when the timescale changes', () => {
    const { ref, rerender } = mountAxis();
    act(() => rerender({ timeScale: 'month' }));
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('updates the scale when the timescale changes during a wheel zoom', () => {
    const { ref, rerender } = mountAxis();
    act(() => { ref.current.setState({ wheelZoom: true }); });
    act(() => rerender({ timeScale: 'hour' }));
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('updates the scale when the axis width changes', () => {
    const { props, rerender } = mountAxis();
    props.updatePositioning.mockClear();
    act(() => rerender({ axisWidth: 1200 }));
    expect(props.updatePositioning).toHaveBeenCalled();
  });

  it('updates the scale when finishing an animate-to-event', () => {
    const { props, rerender } = mountAxis({ isAnimatingToEvent: true });
    props.updatePositioning.mockClear();
    act(() => rerender({ isAnimatingToEvent: false }));
    expect(props.updatePositioning).toHaveBeenCalled();
  });

  it('updates the date when the end date limit changes', () => {
    const { props, rerender } = mountAxis();
    act(() => rerender({ timelineEndDateLimit: '2031-01-01T00:00:00.000Z' }));
    expect(props.onDateChange).toHaveBeenCalled();
  });

  it('handles the A/B dragger focus switch in compare mode', () => {
    const { ref, rerender } = mountAxis({ isCompareModeActive: true, draggerSelected: 'selected' });
    act(() => rerender({ isCompareModeActive: true, draggerSelected: 'selectedB' }));
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('handles animation turning on', () => {
    const { ref, rerender } = mountAxis();
    act(() => rerender({ isAnimationPlaying: true }));
    expect(ref.current.state.currentTimeRange.length).toBeGreaterThan(0);
  });

  it('adds time ranges when the active layers change', () => {
    const { rerender } = mountAxis();
    act(() => rerender({
      activeLayers: [{
        id: 'L1', cmrAvailability: true, startDate: '2020-01-01', visible: true,
      }],
    }));
    expect(global.Worker).toHaveBeenCalled();
  });
});
