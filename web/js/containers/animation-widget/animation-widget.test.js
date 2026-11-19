/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
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

jest.mock('../../util/util', () => ({
  clearTimeUTC: jest.fn((date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }),
}));

jest.mock('../error-boundary', () => ({ children }) => <div data-testid="error-boundary">{children}</div>);

jest.mock('../../components/animation-widget/play-queue', () => () => (
  <div data-testid="play-queue" />
));

jest.mock('../../modules/map/util', () => ({
  promiseImageryForTime: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../modules/date/actions', () => ({
  selectDate: jest.fn(() => ({ type: 'SELECT_DATE' })),
  selectInterval: jest.fn(() => ({ type: 'SELECT_INTERVAL' })),
  toggleCustomModal: jest.fn(() => ({ type: 'TOGGLE_CUSTOM_MODAL' })),
}));

jest.mock('../../modules/date/constants', () => ({
  TIME_SCALE_FROM_NUMBER: {
    1: 'year',
    2: 'month',
    3: 'day',
    4: 'hour',
    5: 'minute',
  },
  customModalType: { ANIMATION: 'ANIMATION' },
}));

jest.mock('../../modules/animation/util', () => ({
  snapToIntervalDelta: jest.fn((date) => date),
  getNumberOfSteps: jest.fn(() => 10),
}));

jest.mock('../../modules/layers/selectors', () => ({
  subdailyLayersActive: jest.fn(() => false),
  getAllActiveLayers: jest.fn(() => []),
  dateRange: jest.fn(() => null),
}));

jest.mock('../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2021-01-15')),
}));

jest.mock('../../modules/animation/actions', () => ({
  play: jest.fn(() => ({ type: 'PLAY' })),
  onClose: jest.fn(() => ({ type: 'CLOSE' })),
  stop: jest.fn(() => ({ type: 'STOP' })),
  toggleLooping: jest.fn(() => ({ type: 'TOGGLE_LOOPING' })),
  changeFrameRate: jest.fn(() => ({ type: 'CHANGE_FRAME_RATE' })),
  changeStartDate: jest.fn(() => ({ type: 'CHANGE_START_DATE' })),
  changeEndDate: jest.fn(() => ({ type: 'CHANGE_END_DATE' })),
  changeStartAndEndDate: jest.fn(() => ({ type: 'CHANGE_START_AND_END_DATE' })),
  toggleAnimationCollapse: jest.fn(() => ({ type: 'TOGGLE_ANIMATION_COLLAPSE' })),
}));

jest.mock('../../util/customHooks', () => jest.fn(() => undefined));

const desktopCapture = {};
const mobileCapture = {};
const collapsedCapture = {};

jest.mock('./desktop-animation-widget', () => function MockDesktopWidget(props) {
  Object.assign(desktopCapture, props);
  return <div data-testid="desktop-animation-widget" />;
});

jest.mock('./mobile-animation-widget', () => function MockMobileWidget(props) {
  Object.assign(mobileCapture, props);
  return <div data-testid="mobile-animation-widget" />;
});

jest.mock('./collapsed-animation-widget', () => function MockCollapsedWidget(props) {
  Object.assign(collapsedCapture, props);
  return <div data-testid="collapsed-animation-widget" />;
});

jest.mock('../../components/kiosk/animation-tile-check/animation-tile-check', () => () => (
  <div data-testid="animation-tile-check" />
));

import usePrevious from '../../util/customHooks';
import util from '../../util/util';
import AnimationWidget from './animation-widget';

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

const appNow = new Date('2021-06-01T00:00:00Z');
const startDate = new Date('2021-01-01T00:00:00Z');
const endDate = new Date('2021-03-01T00:00:00Z');

const defaultProps = {
  appNow,
  animationCustomModalOpen: false,
  autoplay: false,
  breakpoints: {},
  checkAnimationAvailability: false,
  currentDate: new Date('2021-01-15'),
  delta: 1,
  endDate,
  hasFutureLayers: false,
  hasSubdailyLayers: false,
  interval: 'day',
  isActive: true,
  isCollapsed: false,
  isDistractionFreeModeActive: false,
  isEmbedModeActive: false,
  isKioskModeActive: false,
  isLandscape: false,
  isMobile: false,
  isMobilePhone: false,
  isMobileTablet: false,
  isPlaying: false,
  isPortrait: true,
  looping: false,
  map: null,
  maxDate: new Date('2021-06-01'),
  minDate: new Date('2020-01-01'),
  numberOfFrames: 10,
  onClose: jest.fn(),
  onPushLoop: jest.fn(),
  onPushPause: jest.fn(),
  onPushPlay: jest.fn(),
  onSlide: jest.fn(),
  onToggleAnimationCollapse: jest.fn(),
  onUpdateEndDate: jest.fn(),
  onUpdateStartDate: jest.fn(),
  onUpdateStartAndEndDate: jest.fn(),
  playDisabled: false,
  promiseImageryForTime: jest.fn(),
  screenHeight: 768,
  screenWidth: 1024,
  selectDate: jest.fn(),
  sliderLabel: 'Frames Per Second',
  speedRedux: 3,
  snappedCurrentDate: new Date('2021-01-15'),
  startDate,
  subDailyMode: false,
  autoSelected: false,
  layers: [],
};

const renderWidget = (propOverrides = {}) => render(
  <AnimationWidget {...defaultProps} {...propOverrides} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  usePrevious.mockReturnValue(undefined);
  Object.keys(desktopCapture).forEach((k) => delete desktopCapture[k]);
  Object.keys(mobileCapture).forEach((k) => delete mobileCapture[k]);
  Object.keys(collapsedCapture).forEach((k) => delete collapsedCapture[k]);
});

describe('AnimationWidget rendering', () => {
  it('returns null when isActive is false', () => {
    const { container } = renderWidget({ isActive: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders the error boundary when active', () => {
    const { getByTestId } = renderWidget();
    expect(getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('renders DesktopAnimationWidget when not mobile and not collapsed', () => {
    const { getByTestId } = renderWidget({ isMobile: false, isCollapsed: false });
    expect(getByTestId('desktop-animation-widget')).toBeInTheDocument();
  });

  it('renders MobileAnimationWidget when isMobile is true and not collapsed', () => {
    const { getByTestId } = renderWidget({ isMobile: true, isCollapsed: false });
    expect(getByTestId('mobile-animation-widget')).toBeInTheDocument();
  });

  it('does not render DesktopAnimationWidget when isMobile is true', () => {
    const { queryByTestId } = renderWidget({ isMobile: true, isCollapsed: false });
    expect(queryByTestId('desktop-animation-widget')).not.toBeInTheDocument();
  });

  it('renders CollapsedAnimationWidget when isCollapsed is true', () => {
    const { getByTestId } = renderWidget({ isCollapsed: true });
    expect(getByTestId('collapsed-animation-widget')).toBeInTheDocument();
  });

  it('does not render DesktopAnimationWidget when isCollapsed', () => {
    const { queryByTestId } = renderWidget({ isCollapsed: true });
    expect(queryByTestId('desktop-animation-widget')).not.toBeInTheDocument();
  });

  it('renders PlayQueue when isPlaying and checkAnimationAvailability is false', () => {
    const { getByTestId } = renderWidget({ isPlaying: true, checkAnimationAvailability: false });
    expect(getByTestId('play-queue')).toBeInTheDocument();
  });

  it('does not render PlayQueue when not isPlaying', () => {
    const { queryByTestId } = renderWidget({ isPlaying: false });
    expect(queryByTestId('play-queue')).not.toBeInTheDocument();
  });

  it('renders AnimationTileCheck when checkAnimationAvailability is true', () => {
    const { getByTestId } = renderWidget({ checkAnimationAvailability: true });
    expect(getByTestId('animation-tile-check')).toBeInTheDocument();
  });

  it('does not render PlayQueue when checkAnimationAvailability is true (even if playing)', () => {
    const { queryByTestId } = renderWidget({
      isPlaying: true,
      checkAnimationAvailability: true,
    });
    expect(queryByTestId('play-queue')).not.toBeInTheDocument();
  });
});

describe('AnimationWidget mount effect', () => {
  it('calls onPushPlay when autoplay is true and not playing', () => {
    const onPushPlay = jest.fn();
    renderWidget({ autoplay: true, isPlaying: false, onPushPlay });
    expect(onPushPlay).toHaveBeenCalledTimes(1);
  });

  it('does not call onPushPlay when autoplay is true but already playing', () => {
    const onPushPlay = jest.fn();
    renderWidget({ autoplay: true, isPlaying: true, onPushPlay });
    expect(onPushPlay).not.toHaveBeenCalled();
  });

  it('does not call onPushPlay when autoplay is false', () => {
    const onPushPlay = jest.fn();
    renderWidget({ autoplay: false, isPlaying: false, onPushPlay });
    expect(onPushPlay).not.toHaveBeenCalled();
  });

  it('calls onToggleAnimationCollapse when isEmbedModeActive is true', () => {
    const onToggleAnimationCollapse = jest.fn();
    renderWidget({ isEmbedModeActive: true, onToggleAnimationCollapse });
    expect(onToggleAnimationCollapse).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggleAnimationCollapse when isEmbedModeActive is false', () => {
    const onToggleAnimationCollapse = jest.fn();
    renderWidget({ isEmbedModeActive: false, onToggleAnimationCollapse });
    expect(onToggleAnimationCollapse).not.toHaveBeenCalled();
  });
});

describe('AnimationWidget update effect', () => {
  it('calls onUpdateEndDate with appNow when hasFutureLayers changes from true to false', () => {
    const onUpdateEndDate = jest.fn();
    // First call to usePrevious (prevSubDailyMode) returns undefined
    // Second call to usePrevious (prevHasFutureLayers) returns true
    usePrevious
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(true);
    renderWidget({ hasFutureLayers: false, onUpdateEndDate });
    expect(onUpdateEndDate).toHaveBeenCalledWith(appNow);
  });

  it('does not call onUpdateEndDate when hasFutureLayers stays false', () => {
    const onUpdateEndDate = jest.fn();
    usePrevious
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(false);
    renderWidget({ hasFutureLayers: false, onUpdateEndDate });
    expect(onUpdateEndDate).not.toHaveBeenCalled();
  });

  it('does not call onUpdateEndDate when hasFutureLayers stays true', () => {
    const onUpdateEndDate = jest.fn();
    usePrevious
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(true);
    renderWidget({ hasFutureLayers: true, onUpdateEndDate });
    expect(onUpdateEndDate).not.toHaveBeenCalled();
  });

  it('does not update widget position on subDailyMode change when widget was manually moved', () => {
    usePrevious
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    renderWidget({ subDailyMode: true });
    act(() => {
      desktopCapture.onExpandedDrag({}, { x: 50, y: 50 });
    });
    expect(desktopCapture.widgetPosition).toEqual({ x: 50, y: 50 });
  });
});

describe('handleDragStart', () => {
  const makeEvent = (className) => ({
    target: {
      classList: {
        contains: (c) => c === className,
      },
    },
  });

  beforeEach(() => {
    renderWidget();
  });

  it('returns true when target has class wv-animation-widget', () => {
    expect(desktopCapture.handleDragStart(makeEvent('wv-animation-widget'), {})).toBe(true);
  });

  it('returns true when target has class wv-animation-widget-header', () => {
    expect(desktopCapture.handleDragStart(makeEvent('wv-animation-widget-header'), {})).toBe(true);
  });

  it('returns true when target has class wv-anim-dates-case', () => {
    expect(desktopCapture.handleDragStart(makeEvent('wv-anim-dates-case'), {})).toBe(true);
  });

  it('returns true when target has class thru-label', () => {
    expect(desktopCapture.handleDragStart(makeEvent('thru-label'), {})).toBe(true);
  });

  it('returns false when target has an unrecognized class', () => {
    expect(desktopCapture.handleDragStart(makeEvent('some-other-class'), {})).toBe(false);
  });

  it('handleDragStart is also passed to CollapsedAnimationWidget', () => {
    renderWidget({ isCollapsed: true });
    expect(typeof collapsedCapture.handleDragStart).toBe('function');
    expect(collapsedCapture.handleDragStart(makeEvent('wv-animation-widget'), {})).toBe(true);
  });
});

describe('drag handlers', () => {
  it('onExpandedDrag updates widgetPosition and marks widget as moved', () => {
    renderWidget();
    act(() => {
      desktopCapture.onExpandedDrag({}, { x: 200, y: 100 });
    });
    expect(desktopCapture.widgetPosition).toEqual({ x: 200, y: 100 });
  });

  it('onCollapsedDrag updates collapsedWidgetPosition', () => {
    renderWidget({ isCollapsed: true });
    act(() => {
      collapsedCapture.onCollapsedDrag({}, { x: 50, y: 75 });
    });
    expect(collapsedCapture.collapsedWidgetPosition).toEqual({ x: 50, y: 75 });
  });
});

describe('onLoop', () => {
  it('calls onPushLoop when onLoop is triggered', () => {
    const onPushLoop = jest.fn();
    renderWidget({ onPushLoop, looping: false });
    act(() => {
      desktopCapture.onLoop();
    });
    expect(onPushLoop).toHaveBeenCalledWith(false);
  });

  it('passes current looping value to onPushLoop', () => {
    const onPushLoop = jest.fn();
    renderWidget({ onPushLoop, looping: true });
    act(() => {
      desktopCapture.onLoop();
    });
    expect(onPushLoop).toHaveBeenCalledWith(true);
  });
});

describe('onDateChange', () => {
  it('calls onUpdateStartDate when start date changes', () => {
    const onUpdateStartDate = jest.fn();
    const onUpdateEndDate = jest.fn();
    renderWidget({ onUpdateStartDate, onUpdateEndDate });
    const newStart = new Date('2021-02-01');
    act(() => {
      desktopCapture.onDateChange([newStart, endDate]);
    });
    expect(onUpdateStartDate).toHaveBeenCalledWith(newStart);
    expect(onUpdateEndDate).not.toHaveBeenCalled();
  });

  it('calls onUpdateEndDate when end date changes', () => {
    const onUpdateStartDate = jest.fn();
    const onUpdateEndDate = jest.fn();
    renderWidget({ onUpdateStartDate, onUpdateEndDate });
    const newEnd = new Date('2021-04-01');
    act(() => {
      desktopCapture.onDateChange([startDate, newEnd]);
    });
    expect(onUpdateEndDate).toHaveBeenCalledWith(newEnd);
    expect(onUpdateStartDate).not.toHaveBeenCalled();
  });

  it('calls both update functions when both dates change', () => {
    const onUpdateStartDate = jest.fn();
    const onUpdateEndDate = jest.fn();
    renderWidget({ onUpdateStartDate, onUpdateEndDate });
    const newStart = new Date('2021-02-01');
    const newEnd = new Date('2021-04-01');
    act(() => {
      desktopCapture.onDateChange([newStart, newEnd]);
    });
    expect(onUpdateStartDate).toHaveBeenCalledWith(newStart);
    expect(onUpdateEndDate).toHaveBeenCalledWith(newEnd);
  });

  it('calls neither update function when dates are unchanged', () => {
    const onUpdateStartDate = jest.fn();
    const onUpdateEndDate = jest.fn();
    renderWidget({ onUpdateStartDate, onUpdateEndDate });
    act(() => {
      desktopCapture.onDateChange([startDate, endDate]);
    });
    expect(onUpdateStartDate).not.toHaveBeenCalled();
    expect(onUpdateEndDate).not.toHaveBeenCalled();
  });
});

describe('zeroDates', () => {
  it('calls clearTimeUTC for non-subdaily mode', () => {
    renderWidget({ subDailyMode: false });
    desktopCapture.zeroDates();
    expect(util.clearTimeUTC).toHaveBeenCalledWith(startDate);
    expect(util.clearTimeUTC).toHaveBeenCalledWith(endDate);
  });

  it('returns objects with startDate and endDate for non-subdaily mode', () => {
    renderWidget({ subDailyMode: false });
    const result = desktopCapture.zeroDates();
    expect(result).toHaveProperty('startDate');
    expect(result).toHaveProperty('endDate');
    expect(result.startDate.getUTCHours()).toBe(0);
    expect(result.startDate.getUTCSeconds()).toBe(0);
    expect(result.startDate.getUTCMilliseconds()).toBe(0);
  });

  it('zeroes seconds and milliseconds in subdaily mode', () => {
    const subdailyStart = new Date('2021-01-01T10:35:45.500Z');
    const subdailyEnd = new Date('2021-03-01T14:55:30.200Z');
    renderWidget({
      subDailyMode: true,
      startDate: subdailyStart,
      endDate: subdailyEnd,
      autoSelected: false,
    });
    const result = desktopCapture.zeroDates();
    expect(result.startDate.getUTCSeconds()).toBe(0);
    expect(result.startDate.getUTCMilliseconds()).toBe(0);
    expect(result.endDate.getUTCSeconds()).toBe(0);
    expect(result.endDate.getUTCMilliseconds()).toBe(0);
  });

  it('floors minutes to nearest 10 in subdaily mode when not autoSelected', () => {
    const subdailyStart = new Date('2021-01-01T10:35:00.000Z');
    const subdailyEnd = new Date('2021-03-01T14:55:00.000Z');
    renderWidget({
      subDailyMode: true,
      startDate: subdailyStart,
      endDate: subdailyEnd,
      autoSelected: false,
    });
    const result = desktopCapture.zeroDates();
    expect(result.startDate.getUTCMinutes()).toBe(30);
    expect(result.endDate.getUTCMinutes()).toBe(50);
  });

  it('does not floor minutes in subdaily mode when autoSelected', () => {
    const subdailyStart = new Date('2021-01-01T10:35:00.000Z');
    renderWidget({
      subDailyMode: true,
      startDate: subdailyStart,
      endDate: new Date('2021-03-01T14:55:00.000Z'),
      autoSelected: true,
    });
    const result = desktopCapture.zeroDates();
    expect(result.startDate.getUTCMinutes()).toBe(35);
  });

  it('does not call clearTimeUTC in subdaily mode', () => {
    renderWidget({ subDailyMode: true });
    desktopCapture.zeroDates();
    expect(util.clearTimeUTC).not.toHaveBeenCalled();
  });
});

describe('onPushPlayFunc', () => {
  it('calls onUpdateStartAndEndDate with zeroed dates then calls onPushPlay', () => {
    const onUpdateStartAndEndDate = jest.fn();
    const onPushPlay = jest.fn();
    renderWidget({ onUpdateStartAndEndDate, onPushPlay, subDailyMode: false });
    act(() => {
      desktopCapture.onPushPlay();
    });
    expect(onUpdateStartAndEndDate).toHaveBeenCalledTimes(1);
    expect(onPushPlay).toHaveBeenCalledTimes(1);
    const [calledStart, calledEnd] = onUpdateStartAndEndDate.mock.calls[0];
    expect(calledStart.getUTCHours()).toBe(0);
    expect(calledEnd.getUTCHours()).toBe(0);
  });

  it('onPushPlay in CollapsedAnimationWidget also calls onUpdateStartAndEndDate', () => {
    const onUpdateStartAndEndDate = jest.fn();
    const onPushPlay = jest.fn();
    renderWidget({ isCollapsed: true, onUpdateStartAndEndDate, onPushPlay });
    act(() => {
      collapsedCapture.onPushPlay();
    });
    expect(onUpdateStartAndEndDate).toHaveBeenCalledTimes(1);
    expect(onPushPlay).toHaveBeenCalledTimes(1);
  });
});

describe('widget initial position', () => {
  it('sets initial widget x position centered based on screenWidth', () => {
    renderWidget({ screenWidth: 1000, subDailyMode: false });
    // widgetWidth = 334, halfWidgetWidth = 167, x = 500 - 167 = 333
    expect(desktopCapture.widgetPosition.x).toBe(500 - 167);
  });

  it('uses subdailyWidgetWidth when subDailyMode is true', () => {
    renderWidget({ screenWidth: 1000, subDailyMode: true });
    // subdailyWidgetWidth = 460, halfWidgetWidth = 230, x = 500 - 230 = 270
    expect(desktopCapture.widgetPosition.x).toBe(500 - 230);
  });

  it('sets embed mode widget position to x:10, y:0', () => {
    renderWidget({ isEmbedModeActive: true, isCollapsed: false });
    expect(desktopCapture.widgetPosition).toEqual({ x: 10, y: 0 });
  });
});

describe('props forwarded to child widgets', () => {
  it('passes expected props to DesktopAnimationWidget', () => {
    renderWidget();
    expect(desktopCapture).toMatchObject({
      endDate,
      hasSubdailyLayers: false,
      interval: 'day',
      isPlaying: false,
      looping: false,
      minDate: defaultProps.minDate,
      maxDate: defaultProps.maxDate,
      numberOfFrames: 10,
      playDisabled: false,
      sliderLabel: 'Frames Per Second',
      startDate,
      subDailyMode: false,
    });
  });

  it('passes expected props to MobileAnimationWidget', () => {
    renderWidget({ isMobile: true });
    expect(mobileCapture).toMatchObject({
      endDate,
      hasSubdailyLayers: false,
      isPlaying: false,
      looping: false,
      playDisabled: false,
      startDate,
      subDailyMode: false,
    });
  });

  it('passes expected props to CollapsedAnimationWidget', () => {
    renderWidget({ isCollapsed: true });
    expect(collapsedCapture).toMatchObject({
      isPlaying: false,
      playDisabled: false,
      isMobile: false,
    });
  });
});

describe('mapStateToProps', () => {
  const buildMockState = (overrides = {}) => ({
    compare: { active: false, activeString: 'active', ...(overrides.compare || {}) },
    animation: {
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-03-01'),
      speed: 3,
      loop: false,
      isPlaying: false,
      isActive: true,
      isCollapsed: false,
      autoplay: false,
      ...(overrides.animation || {}),
    },
    date: {
      customSelected: false,
      autoSelected: false,
      delta: 1,
      customDelta: null,
      appNow: new Date('2021-06-01'),
      animationCustomModalOpen: false,
      interval: 1,
      customInterval: 3,
      ...(overrides.date || {}),
    },
    embed: { isEmbedModeActive: false, ...(overrides.embed || {}) },
    sidebar: { activeTab: 'layers', ...(overrides.sidebar || {}) },
    modal: { isOpen: false, id: '', ...(overrides.modal || {}) },
    config: { startDate: '2020-01-01', ...(overrides.config || {}) },
    map: { ui: { selected: { frameState_: true } }, ...(overrides.map || {}) },
    screenSize: {
      isMobileDevice: false,
      isMobilePhone: false,
      isMobileTablet: false,
      breakpoints: {},
      screenWidth: 1024,
      screenHeight: 768,
      orientation: 'landscape',
      ...(overrides.screenSize || {}),
    },
    ui: {
      isDistractionFreeModeActive: false,
      isKioskModeActive: false,
      animationAvailabilityChecked: false,
      eic: null,
      ...(overrides.ui || {}),
    },
    proj: {},
    layers: {
      active: { layers: [] },
      ...(overrides.layers || {}),
    },
  });

  const callMSP = (stateOverrides = {}) => capturedMapStateToProps(buildMockState(stateOverrides));

  beforeEach(() => {
    const { subdailyLayersActive, getAllActiveLayers, dateRange } = require('../../modules/layers/selectors');
    const { getNumberOfSteps, snapToIntervalDelta } = require('../../modules/animation/util');
    const { getSelectedDate } = require('../../modules/date/selectors');
    subdailyLayersActive.mockReturnValue(false);
    getAllActiveLayers.mockReturnValue([]);
    dateRange.mockReturnValue(null);
    getNumberOfSteps.mockReturnValue(10);
    getSelectedDate.mockReturnValue(new Date('2021-01-15'));
    snapToIntervalDelta.mockReturnValue(new Date('2021-01-15'));
  });

  it('returns isActive true when all conditions met', () => {
    expect(callMSP().isActive).toBe(true);
  });

  it('returns isActive false when compare is active', () => {
    expect(callMSP({ compare: { active: true } }).isActive).toBe(false);
  });

  it('returns isActive false when sidebar tab is download', () => {
    expect(callMSP({ sidebar: { activeTab: 'download' } }).isActive).toBe(false);
  });

  it('returns isActive false when TOOLBAR_SNAPSHOT modal is open', () => {
    expect(callMSP({ modal: { isOpen: true, id: 'TOOLBAR_SNAPSHOT' } }).isActive).toBe(false);
  });

  it('returns isActive false when map frameState_ is falsy', () => {
    expect(callMSP({ map: { ui: { selected: {} } } }).isActive).toBeFalsy();
  });

  it('returns isActive false when animation.isActive is false', () => {
    expect(callMSP({ animation: { startDate: new Date('2021-01-01'), endDate: new Date('2021-03-01'), speed: 3, loop: false, isPlaying: false, isActive: false, isCollapsed: false, autoplay: false } }).isActive).toBe(false);
  });

  it('maps startDate, endDate, speedRedux, looping, isPlaying from animation state', () => {
    const result = callMSP();
    expect(result.startDate).toEqual(new Date('2021-01-01'));
    expect(result.endDate).toEqual(new Date('2021-03-01'));
    expect(result.speedRedux).toBe(3);
    expect(result.looping).toBe(false);
    expect(result.isPlaying).toBe(false);
  });

  it('maps appNow, animationCustomModalOpen, autoplay from date state', () => {
    const result = callMSP();
    expect(result.appNow).toEqual(new Date('2021-06-01'));
    expect(result.animationCustomModalOpen).toBe(false);
    expect(result.autoplay).toBe(false);
  });

  it('checkAnimationAvailability is true when eic=sa, kiosk, not checked, playing', () => {
    const result = callMSP({
      ui: { isDistractionFreeModeActive: false, isKioskModeActive: true, animationAvailabilityChecked: false, eic: 'sa' },
      animation: { startDate: new Date('2021-01-01'), endDate: new Date('2021-03-01'), speed: 3, loop: false, isPlaying: true, isActive: true, isCollapsed: false, autoplay: false },
    });
    expect(result.checkAnimationAvailability).toBe(true);
  });

  it('checkAnimationAvailability is true when eic=da', () => {
    const result = callMSP({
      ui: { isDistractionFreeModeActive: false, isKioskModeActive: true, animationAvailabilityChecked: false, eic: 'da' },
      animation: { startDate: new Date('2021-01-01'), endDate: new Date('2021-03-01'), speed: 3, loop: false, isPlaying: true, isActive: true, isCollapsed: false, autoplay: false },
    });
    expect(result.checkAnimationAvailability).toBe(true);
  });

  it('checkAnimationAvailability is false when already checked', () => {
    const result = callMSP({
      ui: { isDistractionFreeModeActive: false, isKioskModeActive: true, animationAvailabilityChecked: true, eic: 'sa' },
      animation: { startDate: new Date('2021-01-01'), endDate: new Date('2021-03-01'), speed: 3, loop: false, isPlaying: true, isActive: true, isCollapsed: false, autoplay: false },
    });
    expect(result.checkAnimationAvailability).toBe(false);
  });

  it('checkAnimationAvailability is false when not playing', () => {
    const result = callMSP({
      ui: { isDistractionFreeModeActive: false, isKioskModeActive: true, animationAvailabilityChecked: false, eic: 'sa' },
    });
    expect(result.checkAnimationAvailability).toBe(false);
  });

  it('caps interval to day when no subdaily layers and interval > 3', () => {
    // interval 4 capped to 3, TIME_SCALE_FROM_NUMBER[3] = 'day'
    const result = callMSP({ date: { customSelected: false, autoSelected: false, delta: 1, customDelta: null, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 4, customInterval: 3 } });
    expect(result.interval).toBe('day');
  });

  it('does not cap interval when subdaily layers are active', () => {
    const { subdailyLayersActive } = require('../../modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(true);
    const result = callMSP({ date: { customSelected: false, autoSelected: false, delta: 1, customDelta: null, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 4, customInterval: 4 } });
    expect(result.interval).toBe('hour');
    expect(result.subDailyMode).toBe(true);
  });

  it('uses customDelta when customSelected is true and customDelta is set', () => {
    const result = callMSP({ date: { customSelected: true, autoSelected: false, delta: 1, customDelta: 5, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 1, customInterval: 4 } });
    expect(result.delta).toBe(5);
  });

  it('falls back to delta when customSelected but customDelta is null', () => {
    const result = callMSP({ date: { customSelected: true, autoSelected: false, delta: 2, customDelta: null, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 1, customInterval: 3 } });
    expect(result.delta).toBe(2);
  });

  it('sets maxDate to layerDateRange.end when it exceeds appNow', () => {
    const { dateRange } = require('../../modules/layers/selectors');
    const futureEnd = new Date('2030-01-01');
    dateRange.mockReturnValue({ end: futureEnd });
    expect(callMSP().maxDate).toBe(futureEnd);
  });

  it('sets maxDate to appNow when no layer date range', () => {
    expect(callMSP().maxDate).toEqual(new Date('2021-06-01'));
  });

  it('hasFutureLayers is true when a layer has futureTime', () => {
    const { getAllActiveLayers } = require('../../modules/layers/selectors');
    getAllActiveLayers.mockReturnValue([{ futureTime: '2030-01-01' }]);
    expect(callMSP().hasFutureLayers).toBe(true);
  });

  it('hasFutureLayers is false when no layer has futureTime', () => {
    expect(callMSP().hasFutureLayers).toBe(false);
  });

  it('playDisabled is true when numberOfFrames >= 300 on desktop', () => {
    const { getNumberOfSteps } = require('../../modules/animation/util');
    getNumberOfSteps.mockReturnValue(300);
    expect(callMSP().playDisabled).toBe(true);
  });

  it('playDisabled is true when numberOfFrames >= 50 on mobile', () => {
    const { getNumberOfSteps } = require('../../modules/animation/util');
    getNumberOfSteps.mockReturnValue(50);
    const result = callMSP({ screenSize: { isMobileDevice: true, isMobilePhone: true, isMobileTablet: false, breakpoints: {}, screenWidth: 375, screenHeight: 667, orientation: 'portrait' } });
    expect(result.playDisabled).toBe(true);
  });

  it('playDisabled is true when numberOfFrames === 1', () => {
    const { getNumberOfSteps } = require('../../modules/animation/util');
    getNumberOfSteps.mockReturnValue(1);
    expect(callMSP().playDisabled).toBe(true);
  });

  it('playDisabled is false for valid frame count', () => {
    expect(callMSP().playDisabled).toBe(false);
  });

  it('subDailyMode is true when interval > 3 and hasSubdailyLayers', () => {
    const { subdailyLayersActive } = require('../../modules/layers/selectors');
    subdailyLayersActive.mockReturnValue(true);
    const result = callMSP({ date: { customSelected: false, autoSelected: false, delta: 1, customDelta: null, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 4, customInterval: 4 } });
    expect(result.subDailyMode).toBe(true);
  });

  it('subDailyMode is false when interval <= 3', () => {
    expect(callMSP().subDailyMode).toBe(false);
  });

  it('snappedCurrentDate is currentDate when numberOfFrames >= frameLimit', () => {
    const { getNumberOfSteps, snapToIntervalDelta } = require('../../modules/animation/util');
    const { getSelectedDate } = require('../../modules/date/selectors');
    const currentDate = new Date('2021-01-15');
    getNumberOfSteps.mockReturnValue(300);
    getSelectedDate.mockReturnValue(currentDate);
    const result = callMSP();
    expect(result.snappedCurrentDate).toBe(currentDate);
    expect(snapToIntervalDelta).not.toHaveBeenCalled();
  });

  it('snappedCurrentDate uses snapToIntervalDelta when numberOfFrames < frameLimit', () => {
    const { snapToIntervalDelta } = require('../../modules/animation/util');
    const snapped = new Date('2021-01-10');
    snapToIntervalDelta.mockReturnValue(snapped);
    const result = callMSP();
    expect(result.snappedCurrentDate).toBe(snapped);
    expect(snapToIntervalDelta).toHaveBeenCalled();
  });

  it('maps screenSize fields correctly', () => {
    const result = callMSP();
    expect(result.isMobile).toBe(false);
    expect(result.screenWidth).toBe(1024);
    expect(result.screenHeight).toBe(768);
    expect(result.isLandscape).toBe(true);
    expect(result.isPortrait).toBe(false);
  });

  it('maps portrait mobile screenSize correctly', () => {
    const result = callMSP({ screenSize: { isMobileDevice: true, isMobilePhone: true, isMobileTablet: false, breakpoints: {}, screenWidth: 812, screenHeight: 375, orientation: 'portrait' } });
    expect(result.isMobile).toBe(true);
    expect(result.isPortrait).toBe(true);
    expect(result.isLandscape).toBe(false);
  });

  it('promiseImageryForTime calls the util function when invoked', () => {
    const result = callMSP();
    expect(typeof result.promiseImageryForTime).toBe('function');
    result.promiseImageryForTime(new Date('2021-01-01'));
    const { promiseImageryForTime: promiseUtil } = require('../../modules/map/util');
    expect(promiseUtil).toHaveBeenCalled();
  });

  it('maps isEmbedModeActive from embed state', () => {
    expect(callMSP({ embed: { isEmbedModeActive: true } }).isEmbedModeActive).toBe(true);
  });

  it('maps autoSelected from date state', () => {
    const result = callMSP({ date: { customSelected: false, autoSelected: true, delta: 1, customDelta: null, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 1, customInterval: 3 } });
    expect(result.autoSelected).toBe(true);
  });

  it('customInterval defaults to 3 when null', () => {
    const result = callMSP({ date: { customSelected: false, autoSelected: false, delta: 1, customDelta: null, appNow: new Date('2021-06-01'), animationCustomModalOpen: false, interval: 1, customInterval: null } });
    expect(result.customInterval).toBe(3);
  });

  it('customDelta defaults to 1 when null', () => {
    expect(callMSP().customDelta).toBe(1);
  });

  it('maps isCollapsed, isKioskModeActive, isDistractionFreeModeActive', () => {
    const result = callMSP({
      animation: { startDate: new Date('2021-01-01'), endDate: new Date('2021-03-01'), speed: 3, loop: false, isPlaying: false, isActive: true, isCollapsed: true, autoplay: false },
      ui: {
        isDistractionFreeModeActive: true,
        isKioskModeActive: true,
        animationAvailabilityChecked: false,
        eic: null,
      },
    });
    expect(result.isCollapsed).toBe(true);
    expect(result.isKioskModeActive).toBe(true);
    expect(result.isDistractionFreeModeActive).toBe(true);
  });

  it('maps sliderLabel as Frames Per Second', () => {
    expect(callMSP().sliderLabel).toBe('Frames Per Second');
  });

  it('maps layers from layers.active.layers', () => {
    const myLayers = [{ id: 'layer1' }];
    expect(callMSP({ layers: { active: { layers: myLayers } } }).layers).toBe(myLayers);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jest.fn();
  });

  const callMDP = () => capturedMapDispatchToProps(dispatch);

  it('selectDate dispatches selectDateAction', () => {
    callMDP().selectDate(new Date('2021-01-01'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_DATE' });
  });

  it('onClose dispatches onCloseAction', () => {
    callMDP().onClose();
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE' });
  });

  it('onPushPlay dispatches play action', () => {
    callMDP().onPushPlay();
    expect(dispatch).toHaveBeenCalledWith({ type: 'PLAY' });
  });

  it('onPushPause dispatches stop action', () => {
    callMDP().onPushPause();
    expect(dispatch).toHaveBeenCalledWith({ type: 'STOP' });
  });

  it('onPushLoop dispatches toggleLooping action', () => {
    callMDP().onPushLoop();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_LOOPING' });
  });

  it('toggleCustomModal dispatches toggleCustomModal action', () => {
    callMDP().toggleCustomModal(true, 'INTERVAL');
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_CUSTOM_MODAL' });
  });

  it('onSlide dispatches changeFrameRate action', () => {
    callMDP().onSlide(5);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_FRAME_RATE' });
  });

  it('onIntervalSelect dispatches selectInterval action', () => {
    callMDP().onIntervalSelect(1, 'day', false);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_INTERVAL' });
  });

  it('onUpdateStartDate dispatches changeStartDate action', () => {
    callMDP().onUpdateStartDate(new Date('2021-01-01'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_START_DATE' });
  });

  it('onUpdateEndDate dispatches changeEndDate action', () => {
    callMDP().onUpdateEndDate(new Date('2021-03-01'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_END_DATE' });
  });

  it('onUpdateStartAndEndDate dispatches changeStartAndEndDate action', () => {
    callMDP().onUpdateStartAndEndDate(new Date('2021-01-01'), new Date('2021-03-01'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_START_AND_END_DATE' });
  });

  it('onToggleAnimationCollapse dispatches toggleAnimationCollapse action', () => {
    callMDP().onToggleAnimationCollapse();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ANIMATION_COLLAPSE' });
  });
});
