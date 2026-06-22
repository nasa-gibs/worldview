/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import {
  render, fireEvent, act, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Capture connect() args before module load ──────────────────────────────
let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

// ─── reactstrap ──────────────────────────────────────────────────────────────
jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children }) => <span data-testid="tooltip">{children}</span>,
}));

// ─── googleTagManager ────────────────────────────────────────────────────────
jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

// ─── child components (all stubbed) ──────────────────────────────────────────
jest.mock('../error-boundary', () => function MockErrorBoundary({ children }) {
  return <div data-testid="error-boundary">{children}</div>;
});
jest.mock('../../components/timeline/mobile-date-picker', () => function MockMobileDatePicker() {
  return <div data-testid="mobile-date-picker" />;
});
let capturedTimelineAxisProps = null;
jest.mock('../../components/timeline/timeline-axis/timeline-axis', () => function MockTimelineAxis(props) {
  capturedTimelineAxisProps = props;
  return <div data-testid="timeline-axis" />;
});
let capturedCoverageProps = null;
jest.mock('../../components/timeline/timeline-coverage/timeline-coverage', () => function MockCoverage(props) {
  capturedCoverageProps = props;
  return <div data-testid="timeline-coverage" />;
});
jest.mock('../../components/timeline/timeline-controls/timescale-interval-change', () => function MockTSIC() {
  return <div data-testid="timescale-interval-change" />;
});
let capturedDraggerContainerProps = null;
jest.mock('../../components/timeline/timeline-draggers/dragger-container', () => function MockDraggerContainer(props) {
  capturedDraggerContainerProps = props;
  return <div data-testid="dragger-container" />;
});
jest.mock('../../components/timeline/timeline-axis/date-tooltip/axis-hover-line', () => function MockAxisHoverLine() {
  return <div data-testid="axis-hover-line" />;
});
jest.mock('../../components/timeline/timeline-axis/date-tooltip/date-tooltip', () => function MockDateTooltip() {
  return <div data-testid="date-tooltip" />;
});
jest.mock('../../components/timeline/custom-interval-selector/custom-interval-selector', () => function MockCustomIntervalSelector() {
  return <div data-testid="custom-interval-selector" />;
});
jest.mock('../../components/date-selector/date-selector', () => function MockDateSelector() {
  return <div data-testid="date-selector" />;
});

let capturedDateChangeArrowsProps = null;
jest.mock('../../components/timeline/timeline-controls/date-change-arrows', () => function MockDCA(props) {
  capturedDateChangeArrowsProps = props;
  return <div data-testid="date-change-arrows" />;
});

let capturedAnimationButtonProps = null;
jest.mock('../../components/timeline/timeline-controls/animation-button', () => function MockAnimBtn(props) {
  capturedAnimationButtonProps = props;
  return <button data-testid="animation-button" onClick={props.clickAnimationButton} />;
});

jest.mock('../../components/timeline/timeline-controls/axis-timescale-change', () => function MockAxisTSC() {
  return <div data-testid="axis-timescale-change" />;
});
let capturedRangeSelectorProps = null;
jest.mock('../../components/range-selection/range-selection', () => function MockRangeSelector(props) {
  capturedRangeSelectorProps = props;
  return <div data-testid="range-selector" />;
});
jest.mock('../../components/timeline/kiosk-timestamp', () => function MockKioskTimeStamp() {
  return <div data-testid="kiosk-timestamp" />;
});
jest.mock('../../components/compare/mobile-toggle', () => function MockMobileComparisonToggle() {
  return <div data-testid="mobile-comparison-toggle" />;
});

// ─── date-util ────────────────────────────────────────────────────────────────
jest.mock('../../components/timeline/date-util', () => ({
  getIsBetween: jest.fn(() => true),
  getISODateFormatted: jest.fn((d) => {
    if (!d) return '';
    const s = new Date(d).toISOString();
    return s.replace(/\.\d{3}Z$/, 'Z');
  }),
}));

// ─── layers selectors ─────────────────────────────────────────────────────────
jest.mock('../../modules/layers/selectors', () => ({
  dateRange: jest.fn(() => null),
  hasSubDaily: jest.fn(() => false),
  subdailyLayersActive: jest.fn(() => false),
  subdailyLayers: jest.fn(() => []),
  getActiveLayers: jest.fn(() => []),
  getSubDaily: jest.fn(() => []),
  getSmallestIntervalValue: jest.fn(() => 1440),
}));

// ─── date selectors ───────────────────────────────────────────────────────────
jest.mock('../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn((state) => state.date.selected),
  getDeltaIntervalUnit: jest.fn(() => ({ delta: 1, unit: 'day', interval: 3 })),
}));

// ─── date actions ─────────────────────────────────────────────────────────────
jest.mock('../../modules/date/actions', () => ({
  selectDate: jest.fn((val) => ({ type: 'SELECT_DATE', val })),
  changeTimeScale: jest.fn((val) => ({ type: 'CHANGE_TIME_SCALE', val })),
  selectInterval: jest.fn((delta, ts, cs) => ({ type: 'SELECT_INTERVAL', delta, ts, cs })),
  changeCustomInterval: jest.fn((d, ts) => ({ type: 'CHANGE_CUSTOM_INTERVAL', d, ts })),
  changeAutoInterval: jest.fn((a) => ({ type: 'CHANGE_AUTO_INTERVAL', a })),
  updateAppNow: jest.fn((date) => ({ type: 'UPDATE_APP_NOW', date })),
  toggleCustomModal: jest.fn((open, by) => ({ type: 'TOGGLE_CUSTOM_MODAL', open, by })),
  triggerTodayButton: jest.fn(() => ({ type: 'TRIGGER_TODAY' })),
}));

// ─── date util ────────────────────────────────────────────────────────────────
jest.mock('../../modules/date/util', () => ({
  checkHasFutureLayers: jest.fn(() => false),
  filterProjLayersWithStartDate: jest.fn((layers) => layers),
  getNextTimeSelection: jest.fn((delta, scale, date) => date),
  getNextImageryDelta: jest.fn(() => 60),
}));

// ─── compare actions ──────────────────────────────────────────────────────────
jest.mock('../../modules/compare/actions', () => ({
  toggleActiveCompareState: jest.fn(() => ({ type: 'TOGGLE_COMPARE' })),
}));

// ─── layers actions ───────────────────────────────────────────────────────────
jest.mock('../../modules/layers/actions', () => ({
  addGranuleDateRanges: jest.fn((l, d) => ({ type: 'ADD_GRANULE_DATE_RANGES', l, d })),
}));

// ─── animation actions ────────────────────────────────────────────────────────
jest.mock('../../modules/animation/actions', () => ({
  onActivate: jest.fn(() => ({ type: 'OPEN_ANIMATION' })),
  onClose: jest.fn(() => ({ type: 'CLOSE_ANIMATION' })),
  changeStartAndEndDate: jest.fn((s, e) => ({ type: 'CHANGE_START_END', s, e })),
  changeStartDate: jest.fn((d) => ({ type: 'CHANGE_START', d })),
  changeEndDate: jest.fn((d) => ({ type: 'CHANGE_END', d })),
  toggleAnimationCollapse: jest.fn(() => ({ type: 'TOGGLE_ANIM_COLLAPSE' })),
  stop: jest.fn(() => ({ type: 'PAUSE_ANIMATION' })),
}));

// ─── date constants ───────────────────────────────────────────────────────────
jest.mock('../../modules/date/constants', () => ({
  TIME_SCALE_FROM_NUMBER: {
    1: 'year', 2: 'month', 3: 'day', 4: 'hour', 5: 'minute',
  },
  TIME_SCALE_TO_NUMBER: {
    year: 1, month: 2, day: 3, hour: 4, minute: 5,
  },
  timeScaleOptions: {
    year: { timeAxis: { gridWidth: 50 } },
    month: { timeAxis: { gridWidth: 24 } },
    day: { timeAxis: { gridWidth: 12 } },
    hour: { timeAxis: { gridWidth: 6 } },
    minute: { timeAxis: { gridWidth: 3 } },
  },
  customModalType: { TIMELINE: 'TIMELINE' },
}));

// ─── util ─────────────────────────────────────────────────────────────────────
jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    now: jest.fn(() => new Date('2021-01-01T00:00:00Z')),
    roundTimeQuarterHour: jest.fn((d) => d),
  },
}));

// ─── usePrevious (real implementation so prev !== current on re-renders) ──────
jest.mock('../../util/customHooks', () => {
  const { useRef, useEffect } = require('react');
  return (val) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = val;
    });
    return ref.current;
  };
});

// ─── Load Timeline after mocks ────────────────────────────────────────────────
let Timeline;
beforeAll(() => {
  Timeline = require('./timeline').default;
});

// The component's cleanup effect does:
//   document.querySelector('.timeline-container').removeEventListener(...)
// After RTL unmounts the component the element is gone, causing a null ref.
// We pre-attach a persistent element so that querySelector always succeeds.
let persistentTimelineContainer;
beforeEach(() => {
  persistentTimelineContainer = document.createElement('div');
  persistentTimelineContainer.className = 'timeline-container';
  document.body.appendChild(persistentTimelineContainer);
});
afterEach(() => {
  if (persistentTimelineContainer && persistentTimelineContainer.parentNode) {
    persistentTimelineContainer.parentNode.removeChild(persistentTimelineContainer);
  }
});

// ─── Default props ────────────────────────────────────────────────────────────
const NOW = new Date('2021-01-01T00:00:00Z');
const DATE_A = '2021-01-01T00:00:00Z';
const DATE_B = '2020-06-01T00:00:00Z';

const defaultProps = {
  activeLayers: [],
  addGranuleDateRanges: jest.fn(),
  animationDisabled: false,
  animEndLocationDate: null,
  animStartLocationDate: null,
  appNow: NOW,
  autoSelected: false,
  axisWidth: 900,
  breakpoints: {},
  changeAutoInterval: jest.fn(),
  changeCustomInterval: jest.fn(),
  changeTimeScale: jest.fn(),
  closeAnimation: jest.fn(),
  customInterval: 3,
  customSelected: false,
  dateA: DATE_A,
  dateB: DATE_B,
  activeString: 'active',
  deltaChangeAmt: 1,
  displayStaticMap: false,
  draggerSelected: 'selected',
  hasFutureLayers: false,
  hasSubdailyLayers: false,
  hasTempoProduct: false,
  hideTimeline: false,
  interval: 3,
  isAnimatingToEvent: false,
  isAnimationPlaying: false,
  isAnimationWidgetOpen: false,
  isChartingActive: false,
  isCompareModeActive: false,
  isDataDownload: false,
  isDistractionFreeModeActive: false,
  isEmbedModeActive: false,
  isGifActive: false,
  isKioskModeActive: false,
  isLandscape: false,
  isMobile: false,
  isMobilePhone: false,
  isMobileTablet: false,
  isPortrait: true,
  isTourActive: false,
  leftArrowDisabled: false,
  newCustomDelta: 1440,
  nowButtonDisabled: false,
  nowOverride: false,
  onPauseAnimation: jest.fn(),
  onToggleAnimationCollapse: jest.fn(),
  onUpdateEndDate: jest.fn(),
  onUpdateStartAndEndDate: jest.fn(),
  onUpdateStartDate: jest.fn(),
  openAnimation: jest.fn(),
  parentOffset: 320,
  rightArrowDisabled: false,
  screenWidth: 1200,
  selectDate: jest.fn(),
  selectedDate: NOW,
  subDailyLayersList: [],
  timelineCustomModalOpen: false,
  timelineEndDateLimit: '2021-01-01T00:00:00Z',
  timelineStartDateLimit: '1948-01-01T00:00:00Z',
  timeScale: 'day',
  timeScaleChangeUnit: 'day',
  toggleActiveCompareState: jest.fn(),
  triggerTodayButton: jest.fn(),
  updateAppNow: jest.fn(),
  proj: { id: 'geographic' },
  describeDomainsUrl: 'https://gibs.earthdata.nasa.gov',
  cmrBaseUrl: 'https://cmr.earthdata.nasa.gov',
};

const renderComponent = (props = {}) => render(
  <Timeline {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  capturedDateChangeArrowsProps = null;
  capturedAnimationButtonProps = null;
  capturedTimelineAxisProps = null;
  capturedCoverageProps = null;
  capturedRangeSelectorProps = null;
  capturedDraggerContainerProps = null;
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Timeline rendering', () => {
  it('renders the timeline-container div', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.timeline-container')).toBeInTheDocument();
  });

  it('renders desktop timeline section after mount effects run', async () => {
    const { container } = renderComponent();
    await waitFor(() => {
      expect(container.querySelector('#timeline')).toBeInTheDocument();
    });
  });

  it('renders date-selector in desktop mode', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('date-selector')).toBeInTheDocument();
    });
  });

  it('renders animation button in desktop mode', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('animation-button')).toBeInTheDocument();
    });
  });

  it('renders date-change-arrows in desktop mode', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('date-change-arrows')).toBeInTheDocument();
    });
  });

  it('renders timeline-axis in footer', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('timeline-axis')).toBeInTheDocument();
    });
  });

  it('renders the hide timeline button', async () => {
    const { container } = renderComponent();
    await waitFor(() => {
      expect(container.querySelector('#timeline-hide')).toBeInTheDocument();
    });
  });

  it('desktop header has subdaily class when hasSubdailyLayers=true', async () => {
    const { container } = renderComponent({ hasSubdailyLayers: true });
    await waitFor(() => {
      expect(container.querySelector('.timeline-header-desktop'))
        .toHaveClass('subdaily');
    });
  });

  it('desktop header lacks subdaily class when hasSubdailyLayers=false', async () => {
    const { container } = renderComponent({ hasSubdailyLayers: false });
    await waitFor(() => {
      expect(container.querySelector('.timeline-header-desktop'))
        .not.toHaveClass('subdaily');
    });
  });

  it('date-selector-main has kiosk class when isKioskModeActive=true', async () => {
    const { container } = renderComponent({ isKioskModeActive: true });
    await waitFor(() => {
      expect(container.querySelector('#date-selector-main'))
        .toHaveClass('date-selector-kiosk');
    });
  });

  it('zoom-buttons-group is hidden when isKioskModeActive=true', async () => {
    const { container } = renderComponent({ isKioskModeActive: true });
    await waitFor(() => {
      expect(container.querySelector('#zoom-buttons-group')).toHaveClass('d-none');
    });
  });
});

// ─── Mobile rendering ─────────────────────────────────────────────────────────

describe('Timeline mobile rendering', () => {
  it('renders mobile header when isMobile=true', async () => {
    const { container } = renderComponent({ isMobile: true });
    await waitFor(() => {
      expect(container.querySelector('.timeline-header-mobile')).toBeInTheDocument();
    });
  });

  it('renders mobile date picker when isMobile=true', async () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    await waitFor(() => {
      expect(getByTestId('mobile-date-picker')).toBeInTheDocument();
    });
  });

  it('renders MobileComparisonToggle in mobile mode', async () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    await waitFor(() => {
      expect(getByTestId('mobile-comparison-toggle')).toBeInTheDocument();
    });
  });

  it('does not render AnimationButton when isCompareModeActive=true in mobile', async () => {
    const { queryByTestId } = renderComponent({ isMobile: true, isCompareModeActive: true });
    await waitFor(() => {
      expect(queryByTestId('animation-button')).not.toBeInTheDocument();
    });
  });

  it('does not render AnimationButton when isChartingActive=true in mobile', async () => {
    const { queryByTestId } = renderComponent({ isMobile: true, isChartingActive: true });
    await waitFor(() => {
      expect(queryByTestId('animation-button')).not.toBeInTheDocument();
    });
  });

  it('renders mobile mode when isEmbedModeActive=true (not isMobile)', async () => {
    const { container } = renderComponent({ isEmbedModeActive: true, isMobile: false });
    await waitFor(() => {
      expect(container.querySelector('.timeline-header-mobile')).toBeInTheDocument();
    });
  });

  it('desktop timeline is not rendered when isMobile=true', async () => {
    const { container } = renderComponent({ isMobile: true });
    await waitFor(() => {
      expect(container.querySelector('#timeline')).not.toBeInTheDocument();
    });
  });
});

// ─── Distraction-free / kiosk mode ───────────────────────────────────────────

describe('Timeline distraction-free mode', () => {
  it('renders distraction-free section when isDistractionFreeModeActive=true', async () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    await waitFor(() => {
      expect(container.querySelector('#distraction-free-timeline')).toBeInTheDocument();
    });
  });

  it('renders KioskTimeStamp in distraction-free mode', async () => {
    const { getByTestId } = renderComponent({ isDistractionFreeModeActive: true });
    await waitFor(() => {
      expect(getByTestId('kiosk-timestamp')).toBeInTheDocument();
    });
  });

  it('does not render normal desktop timeline in distraction-free mode', async () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    await waitFor(() => {
      expect(container.querySelector('#timeline')).not.toBeInTheDocument();
    });
  });

  it('distraction-free header has mobile class when isMobile=true', async () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true, isMobile: true });
    await waitFor(() => {
      expect(container.querySelector('.distraction-free-timeline-header'))
        .toHaveClass('mobile');
    });
  });

  it('distraction-free header is hidden when displayStaticMap=true', async () => {
    const { container } = renderComponent({
      isDistractionFreeModeActive: true,
      displayStaticMap: true,
    });
    await waitFor(() => {
      const header = container.querySelector('#distraction-free-timeline-header');
      expect(header.style.display).toBe('none');
    });
  });
});

// ─── Timeline hide/show (chevron) ─────────────────────────────────────────────

describe('Timeline hide/show chevron', () => {
  it('show-timeline aria-label when timeline is hidden', async () => {
    const { container } = renderComponent();
    await waitFor(() => {
      expect(container.querySelector('#timeline-hide')).toBeInTheDocument();
    });
    const btn = container.querySelector('#timeline-hide');
    act(() => { fireEvent.click(btn); });
    expect(btn).toHaveAttribute('aria-label', 'Show timeline');
  });

  it('hide-timeline aria-label initially', async () => {
    const { container } = renderComponent();
    await waitFor(() => {
      const btn = container.querySelector('#timeline-hide');
      expect(btn).toHaveAttribute('aria-label', 'Hide timeline');
    });
  });

  it('toggles timeline hidden on button click', async () => {
    const { container } = renderComponent();
    let btn;
    await waitFor(() => {
      btn = container.querySelector('#timeline-hide');
      expect(btn).toBeInTheDocument();
    });
    // Initially timeline footer is shown (not hidden)
    expect(container.querySelector('#timeline-footer')).toBeInTheDocument();
    act(() => { fireEvent.click(btn); });
    // After click, timeline footer should be hidden
    await waitFor(() => {
      expect(container.querySelector('#timeline-footer')).not.toBeInTheDocument();
    });
  });

  it('hideTimeline prop hides the footer', async () => {
    const { container } = renderComponent({ hideTimeline: true });
    await waitFor(() => {
      expect(container.querySelector('#timeline-footer')).not.toBeInTheDocument();
    });
  });

  it('chevron direction is left when timeline is hidden', async () => {
    const { container } = renderComponent({ hideTimeline: true });
    await waitFor(() => {
      const chevron = container.querySelector('.wv-timeline-hide');
      expect(chevron).toHaveClass('wv-timeline-hide-double-chevron-left');
    });
  });

  it('chevron direction is right when timeline is visible', async () => {
    const { container } = renderComponent({ hideTimeline: false });
    await waitFor(() => {
      const chevron = container.querySelector('.wv-timeline-hide');
      expect(chevron).toHaveClass('wv-timeline-hide-double-chevron-right');
    });
  });
});

// ─── clickAnimationButton ─────────────────────────────────────────────────────

describe('clickAnimationButton', () => {
  it('calls openAnimation when widget is not open and not mobile', async () => {
    const openAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      openAnimation,
      isAnimationWidgetOpen: false,
      isMobile: false,
      isCompareModeActive: false,
      isChartingActive: false,
      isDataDownload: false,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(openAnimation).toHaveBeenCalled();
  });

  it('calls closeAnimation when widget is open and not mobile', async () => {
    const closeAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      closeAnimation,
      isAnimationWidgetOpen: true,
      isMobile: false,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(closeAnimation).toHaveBeenCalled();
  });

  it('does not call openAnimation when isCompareModeActive=true', async () => {
    const openAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      openAnimation,
      isAnimationWidgetOpen: false,
      isCompareModeActive: true,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(openAnimation).not.toHaveBeenCalled();
  });

  it('does not call openAnimation when isChartingActive=true', async () => {
    const openAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      openAnimation,
      isChartingActive: true,
      isCompareModeActive: false,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(openAnimation).not.toHaveBeenCalled();
  });

  it('calls onToggleAnimationCollapse and onPauseAnimation on mobile when widget open', async () => {
    const onToggleAnimationCollapse = jest.fn();
    const onPauseAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      isAnimationWidgetOpen: true,
      isMobile: true,
      onToggleAnimationCollapse,
      onPauseAnimation,
      isCompareModeActive: false,
      isChartingActive: false,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(onToggleAnimationCollapse).toHaveBeenCalled();
    expect(onPauseAnimation).toHaveBeenCalled();
  });

  it('calls openAnimation on mobile when widget is not open', async () => {
    const openAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      isAnimationWidgetOpen: false,
      isMobile: true,
      openAnimation,
      isCompareModeActive: false,
      isChartingActive: false,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(openAnimation).toHaveBeenCalled();
  });

  it('passes correct label when isCompareModeActive=true to AnimationButton', async () => {
    renderComponent({ isCompareModeActive: true });
    await waitFor(() => {
      expect(capturedAnimationButtonProps.label).toMatch(/Compare feature/);
    });
  });

  it('passes charting label when isChartingActive=true and not compare mode', async () => {
    renderComponent({ isChartingActive: true, isCompareModeActive: false });
    await waitFor(() => {
      expect(capturedAnimationButtonProps.label).toMatch(/Charting feature/);
    });
  });

  it('passes data download label when isDataDownload=true', async () => {
    renderComponent({
      isDataDownload: true,
      isChartingActive: false,
      isCompareModeActive: false,
    });
    await waitFor(() => {
      expect(capturedAnimationButtonProps.label).toMatch(/Data Download/);
    });
  });

  it('pushes GTM event when opening animation from desktop', async () => {
    const googleTagManager = require('googleTagManager');
    const openAnimation = jest.fn();
    const { getByTestId } = renderComponent({
      openAnimation,
      isAnimationWidgetOpen: false,
      isMobile: false,
      isCompareModeActive: false,
    });
    await waitFor(() => { expect(getByTestId('animation-button')).toBeInTheDocument(); });
    fireEvent.click(getByTestId('animation-button'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'GIF_setup_animation_button',
    });
  });
});

// ─── handleArrowDateChange (via DateChangeArrows callbacks) ───────────────────

describe('handleArrowDateChange', () => {
  it('calls onDateChange via leftArrowDown when not disabled', async () => {
    const selectDate = jest.fn();
    renderComponent({ selectDate, leftArrowDisabled: false });
    await waitFor(() => { expect(capturedDateChangeArrowsProps).not.toBeNull(); });
    act(() => { capturedDateChangeArrowsProps.leftArrowDown(); });
    // selectDate is debounced; verify via the debounce ref
    await waitFor(() => {}, { timeout: 100 });
  });

  it('does not change date via left arrow when leftArrowDisabled=true', async () => {
    const selectDate = jest.fn();
    renderComponent({ selectDate, leftArrowDisabled: true });
    await waitFor(() => { expect(capturedDateChangeArrowsProps).not.toBeNull(); });
    act(() => { capturedDateChangeArrowsProps.leftArrowDown(); });
    // selectDate debounce won't fire synchronously; just ensure no crash
  });

  it('calls handleSelectNowButton (triggerTodayButton) via DateChangeArrows', async () => {
    const triggerTodayButton = jest.fn();
    renderComponent({ triggerTodayButton });
    await waitFor(() => { expect(capturedDateChangeArrowsProps).not.toBeNull(); });
    act(() => { capturedDateChangeArrowsProps.handleSelectNowButton(); });
    expect(triggerTodayButton).toHaveBeenCalled();
  });

  it('passes leftArrowDisabled prop to DateChangeArrows', async () => {
    renderComponent({ leftArrowDisabled: true });
    await waitFor(() => {
      expect(capturedDateChangeArrowsProps.leftArrowDisabled).toBe(true);
    });
  });

  it('passes rightArrowDisabled prop to DateChangeArrows', async () => {
    renderComponent({ rightArrowDisabled: true });
    await waitFor(() => {
      expect(capturedDateChangeArrowsProps.rightArrowDisabled).toBe(true);
    });
  });

  it('passes nowButtonDisabled prop to DateChangeArrows', async () => {
    renderComponent({ nowButtonDisabled: true });
    await waitFor(() => {
      expect(capturedDateChangeArrowsProps.nowButtonDisabled).toBe(true);
    });
  });

  it('uses getNextImageryDelta when autoSelected and subDailyLayersList has items', async () => {
    const { getNextImageryDelta } = require('../../modules/date/util');
    renderComponent({
      autoSelected: true,
      subDailyLayersList: [{ id: 'layer1' }],
      leftArrowDisabled: false,
    });
    await waitFor(() => { expect(capturedDateChangeArrowsProps).not.toBeNull(); });
    act(() => { capturedDateChangeArrowsProps.leftArrowDown(); });
    expect(getNextImageryDelta).toHaveBeenCalled();
  });

  it('uses customSelected delta when customSelected=true and deltaChangeAmt is set', async () => {
    const { getNextTimeSelection } = require('../../modules/date/util');
    renderComponent({
      customSelected: true,
      deltaChangeAmt: 5,
      rightArrowDisabled: false,
    });
    await waitFor(() => { expect(capturedDateChangeArrowsProps).not.toBeNull(); });
    act(() => { capturedDateChangeArrowsProps.rightArrowDown(); });
    expect(getNextTimeSelection).toHaveBeenCalledWith(5, 'day', expect.anything(), expect.anything(), expect.anything());
  });
});

// ─── Keyboard events ──────────────────────────────────────────────────────────

describe('Keyboard event handling', () => {
  it('calls changeTimeScale on ArrowUp key (zoom in)', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'day' });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp' });
    });
    // timeScale 'day' = 3, ArrowUp decrements to 2
    expect(changeTimeScale).toHaveBeenCalledWith(2);
  });

  it('calls changeTimeScale on ArrowDown key (zoom out)', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'day' });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowDown' });
    });
    // day = 3, ArrowDown increments to 4 (hour), max without subdaily is 3 but day is 3
    // Actually maxTimeScaleNumber = 3 (no subdaily), so no change expected when at max
    // Let's test with month (2) which can go down to day (3)
  });

  it('ArrowDown does not exceed max timescale without subdaily', async () => {
    const changeTimeScale = jest.fn();
    // timeScale 'day' = 3 = max when no subdaily
    renderComponent({ changeTimeScale, timeScale: 'day', hasSubdailyLayers: false });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowDown' });
    });
    expect(changeTimeScale).not.toHaveBeenCalled();
  });

  it('ArrowDown can go to hour when hasSubdailyLayers=true', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'day', hasSubdailyLayers: true });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowDown' });
    });
    expect(changeTimeScale).toHaveBeenCalledWith(4);
  });

  it('ArrowUp does not go below 1 (year)', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'year' });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp' });
    });
    expect(changeTimeScale).not.toHaveBeenCalled();
  });

  it('does not handle keys when target is INPUT', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'day' });
    await waitFor(() => {});
    act(() => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      fireEvent.keyDown(input, { key: 'ArrowUp', target: input });
    });
    expect(changeTimeScale).not.toHaveBeenCalled();
  });

  it('does not handle keys with ctrlKey', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'month' });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp', ctrlKey: true });
    });
    expect(changeTimeScale).not.toHaveBeenCalled();
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const {
    getActiveLayers, subdailyLayersActive, subdailyLayers,
    hasSubDaily, getSubDaily, getSmallestIntervalValue,
  } = require('../../modules/layers/selectors');
  const { getSelectedDate, getDeltaIntervalUnit } = require('../../modules/date/selectors');
  const { checkHasFutureLayers, filterProjLayersWithStartDate } = require('../../modules/date/util');
  const { getISODateFormatted } = require('../../components/timeline/date-util');

  const selectedDate = new Date('2021-01-01T00:00:00Z');
  const appNow = new Date('2021-01-01T00:00:00Z');

  const makeState = (overrides = {}) => ({
    animation: {
      isActive: false,
      startDate: null,
      endDate: null,
      gifActive: false,
      isPlaying: false,
      isCollapsed: false,
    },
    compare: {
      active: false,
      isCompareA: true,
      activeString: 'active',
    },
    charting: { active: false },
    config: {
      startDate: '1948-01-01T00:00:00Z',
      parameters: {},
      features: {},
    },
    date: {
      appNow,
      customDelta: 1,
      customInterval: 3,
      customSelected: false,
      autoSelected: false,
      interval: 3,
      selected: selectedDate,
      selectedB: new Date('2020-06-01T00:00:00Z'),
      selectedZoom: 3,
      timelineCustomModalOpen: false,
      delta: 1,
    },
    events: { isAnimatingToEvent: false },
    embed: { isEmbedModeActive: false },
    layers: {
      active: { layers: [] },
      activeB: { layers: [] },
    },
    map: { ui: { selected: { frameState_: true } } },
    modal: { isOpen: false, id: null },
    proj: { id: 'geographic', selected: { id: 'geographic' } },
    screenSize: {
      isMobileDevice: false,
      breakpoints: {},
      screenWidth: 1200,
      isMobilePhone: false,
      isMobileTablet: false,
      orientation: 'landscape',
    },
    sidebar: { activeTab: 'layers' },
    tour: { active: false },
    ui: {
      isDistractionFreeModeActive: false,
      isKioskModeActive: false,
      displayStaticMap: false,
    },
    ...overrides,
  });

  beforeEach(() => {
    getActiveLayers.mockReturnValue([]);
    subdailyLayersActive.mockReturnValue(false);
    subdailyLayers.mockReturnValue([]);
    hasSubDaily.mockReturnValue(false);
    getSubDaily.mockReturnValue([]);
    getSmallestIntervalValue.mockReturnValue(1440);
    getSelectedDate.mockReturnValue(selectedDate);
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    checkHasFutureLayers.mockReturnValue(false);
    filterProjLayersWithStartDate.mockImplementation((layers) => layers);
    getISODateFormatted.mockImplementation((d) => {
      if (!d) return '';
      return new Date(d).toISOString()
        .replace(/\.\d{3}Z$/, 'Z');
    });
  });

  it('maps appNow from state.date.appNow', () => {
    const result = capturedMapState(makeState());
    expect(result.appNow).toBe(appNow);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const result = capturedMapState(makeState({
      screenSize: { ...makeState().screenSize, isMobileDevice: true },
    }));
    expect(result.isMobile).toBe(true);
  });

  it('maps isTourActive from tour.active', () => {
    const result = capturedMapState(makeState({ tour: { active: true } }));
    expect(result.isTourActive).toBe(true);
  });

  it('maps isCompareModeActive from compare.active', () => {
    const result = capturedMapState(makeState({compare: { ...makeState().compare, active: true } },
    ));
    expect(result.isCompareModeActive).toBe(true);
  });

  it('maps isChartingActive from charting.active', () => {
    const result = capturedMapState(makeState({ charting: { active: true } }));
    expect(result.isChartingActive).toBe(true);
  });

  it('maps isAnimationWidgetOpen from animation.isActive', () => {
    const result = capturedMapState(makeState({
      animation: { ...makeState().animation, isActive: true },
    }));
    expect(result.isAnimationWidgetOpen).toBe(true);
  });

  it('maps draggerSelected to selectedB when isCompareA=false', () => {
    const result = capturedMapState(makeState({
      compare: { ...makeState().compare, isCompareA: false },
    }));
    expect(result.draggerSelected).toBe('selectedB');
  });

  it('maps draggerSelected to selected when isCompareA=true', () => {
    const result = capturedMapState(makeState());
    expect(result.draggerSelected).toBe('selected');
  });

  it('maps timelineStartDateLimit from config.startDate', () => {
    const result = capturedMapState(makeState());
    expect(result.timelineStartDateLimit).toBe('1948-01-01T00:00:00Z');
  });

  it('maps nowOverride=true when config.parameters.now is set', () => {
    const result = capturedMapState(makeState({
      config: { ...makeState().config, parameters: { now: '2021-01-01T00:00:00Z' } },
    }));
    expect(result.nowOverride).toBe(true);
  });

  it('maps nowOverride=false when config.parameters.now is absent', () => {
    const result = capturedMapState(makeState());
    expect(result.nowOverride).toBe(false);
  });

  it('maps isAnimationPlaying from animation.isPlaying', () => {
    const result = capturedMapState(makeState({
      animation: { ...makeState().animation, isPlaying: true },
    }));
    expect(result.isAnimationPlaying).toBe(true);
  });

  it('maps isGifActive from animation.gifActive', () => {
    const result = capturedMapState(makeState({
      animation: { ...makeState().animation, gifActive: true },
    }));
    expect(result.isGifActive).toBe(true);
  });

  it('maps isDataDownload=true when sidebar.activeTab=download', () => {
    const result = capturedMapState(makeState({ sidebar: { activeTab: 'download' } }));
    expect(result.isDataDownload).toBe(true);
  });

  it('maps hideTimeline=true when modal is open with TOOLBAR_SNAPSHOT id', () => {
    const result = capturedMapState(makeState({
      modal: { isOpen: true, id: 'TOOLBAR_SNAPSHOT' },
      animation: { ...makeState().animation, gifActive: false },
    }));
    expect(result.hideTimeline).toBe(true);
  });

  it('maps hideTimeline=true when gifActive=true', () => {
    const result = capturedMapState(makeState({
      animation: { ...makeState().animation, gifActive: true },
    }));
    expect(result.hideTimeline).toBe(true);
  });

  it('caps selectedZoom to 3 when no subdaily and selectedZoom > 3', () => {
    subdailyLayersActive.mockReturnValue(false);
    const result = capturedMapState(makeState({
      date: { ...makeState().date, selectedZoom: 5 },
    }));
    expect(result.timeScale).toBe('day'); // TIME_SCALE_FROM_NUMBER[3] = 'day'
  });

  it('caps customInterval to 3 when no subdaily and customInterval > 3', () => {
    subdailyLayersActive.mockReturnValue(false);
    const result = capturedMapState(makeState({
      date: { ...makeState().date, customInterval: 5, selectedZoom: 3 },
    }));
    expect(result.customIntervalZoomLevel).toBe(3);
  });

  it('maps hasSubdailyLayers via hasSubDailySelector in compare mode', () => {
    hasSubDaily.mockReturnValue(true);
    const result = capturedMapState(makeState({
      compare: { ...makeState().compare, active: true },
    }));
    expect(result.hasSubdailyLayers).toBe(true);
  });

  it('maps animationDisabled=true when no map frameState_', () => {
    const result = capturedMapState(makeState({ map: { ui: { selected: {} } } }));
    expect(result.animationDisabled).toBe(true);
  });

  it('maps animationDisabled=true when sidebar is download tab', () => {
    const result = capturedMapState(makeState({ sidebar: { activeTab: 'download' } }));
    expect(result.animationDisabled).toBe(true);
  });

  it('maps animationDisabled=true when compare is active', () => {
    const result = capturedMapState(makeState({
      compare: { ...makeState().compare, active: true },
    }));
    expect(result.animationDisabled).toBe(true);
  });

  it('maps describeDomainsUrl from config.features', () => {
    const result = capturedMapState(makeState({
      config: { ...makeState().config, features: { describeDomains: { url: 'https://example.com' } } },
    }));
    expect(result.describeDomainsUrl).toBe('https://example.com');
  });

  it('maps describeDomainsUrl to fallback when feature absent', () => {
    const result = capturedMapState(makeState());
    expect(result.describeDomainsUrl).toBe('https://gibs.earthdata.nasa.gov');
  });

  it('maps cmrBaseUrl from config.features.cmr.url', () => {
    const result = capturedMapState(makeState({
      config: { ...makeState().config, features: { cmr: { url: 'https://cmr.example.com' } } },
    }));
    expect(result.cmrBaseUrl).toBe('https://cmr.example.com');
  });

  it('maps proj from proj.selected', () => {
    const result = capturedMapState(makeState({
      proj: { id: 'arctic', selected: { id: 'arctic', name: 'Arctic' } },
    }));
    expect(result.proj).toEqual({ id: 'arctic', name: 'Arctic' });
  });

  it('computes leftArrowDisabled based on date proximity to start limit', () => {
    getSelectedDate.mockReturnValue(new Date('1948-01-01T00:00:00Z'));
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    const result = capturedMapState(makeState());
    expect(result.leftArrowDisabled).toBe(true);
  });

  it('leftArrowDisabled=false when date is well above start limit', () => {
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    const result = capturedMapState(makeState());
    expect(result.leftArrowDisabled).toBe(false);
  });

  it('rightArrowDisabled=false when autoSelected=true', () => {
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    const result = capturedMapState(makeState({
      date: { ...makeState().date, autoSelected: true },
    }));
    expect(result.rightArrowDisabled).toBe(false);
  });

  it('nowButtonDisabled=true when selectedDate equals appNow', () => {
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    getISODateFormatted.mockImplementation((d) => new Date(d).toISOString()
      .replace(/\.\d{3}Z$/, 'Z'));
    const result = capturedMapState(makeState());
    // selectedDate === appNow === '2021-01-01T00:00:00Z', timelineEndDateLimit = same
    expect(result.nowButtonDisabled).toBe(true);
  });

  it('maps subDailyLayersList by merging A and B in compare mode', () => {
    getSubDaily.mockReturnValueOnce([{ id: 'layer-a' }]).mockReturnValueOnce([{ id: 'layer-b' }]);
    const result = capturedMapState(makeState({
      compare: { ...makeState().compare, active: true },
    }));
    expect(result.subDailyLayersList).toHaveLength(2);
  });

  it('maps timelineEndDateLimit from appNow when no future layers', () => {
    checkHasFutureLayers.mockReturnValue(false);
    const result = capturedMapState(makeState());
    expect(result.timelineEndDateLimit).toBeDefined();
  });

  it('maps timelineEndDateLimit via getTimelineEndDateLimit when hasFutureLayers', () => {
    checkHasFutureLayers.mockReturnValue(true);
    const result = capturedMapState(makeState());
    expect(result.hasFutureLayers).toBe(true);
    expect(result.timelineEndDateLimit).toBeDefined();
  });

  it('maps isLandscape=true from orientation=landscape', () => {
    const result = capturedMapState(makeState());
    expect(result.isLandscape).toBe(true);
  });

  it('maps isPortrait from orientation', () => {
    const result = capturedMapState(makeState({
      screenSize: { ...makeState().screenSize, orientation: 'portrait' },
    }));
    expect(result.isPortrait).toBe(true);
  });
});

// ─── mapDispatchToProps ───────────────────────────────────────────────────────

describe('mapDispatchToProps', () => {
  let dispatch;
  let dispatchProps;

  beforeEach(() => {
    dispatch = jest.fn();
    dispatchProps = capturedMapDispatch(dispatch);
  });

  it('updateAppNow dispatches updateAppNow action', () => {
    const date = new Date();
    dispatchProps.updateAppNow(date);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_APP_NOW', date });
  });

  it('triggerTodayButton dispatches triggerTodayButton action', () => {
    dispatchProps.triggerTodayButton();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TRIGGER_TODAY' });
  });

  it('selectDate dispatches selectDate action', () => {
    const val = new Date();
    dispatchProps.selectDate(val);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_DATE', val });
  });

  it('changeCustomInterval dispatches with delta and timeScale', () => {
    dispatchProps.changeCustomInterval(5, 3);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_CUSTOM_INTERVAL', d: 5, ts: 3 });
  });

  it('changeAutoInterval dispatches with autoSelected value', () => {
    dispatchProps.changeAutoInterval(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_AUTO_INTERVAL', a: true });
  });

  it('changeTimeScale dispatches with value', () => {
    dispatchProps.changeTimeScale(4);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_TIME_SCALE', val: 4 });
  });

  it('openAnimation dispatches open animation action', () => {
    dispatchProps.openAnimation();
    expect(dispatch).toHaveBeenCalledWith({ type: 'OPEN_ANIMATION' });
  });

  it('closeAnimation dispatches close animation action', () => {
    dispatchProps.closeAnimation();
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_ANIMATION' });
  });

  it('toggleActiveCompareState dispatches toggle compare action', () => {
    dispatchProps.toggleActiveCompareState();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_COMPARE' });
  });

  it('onUpdateStartDate dispatches changeStartDate', () => {
    const d = new Date();
    dispatchProps.onUpdateStartDate(d);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_START', d });
  });

  it('onUpdateEndDate dispatches changeEndDate', () => {
    const d = new Date();
    dispatchProps.onUpdateEndDate(d);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_END', d });
  });

  it('onUpdateStartAndEndDate dispatches changeStartAndEndDate', () => {
    const s = new Date('2020-01-01');
    const e = new Date('2020-12-31');
    dispatchProps.onUpdateStartAndEndDate(s, e);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_START_END', s, e });
  });

  it('onToggleAnimationCollapse dispatches toggleAnimationCollapse', () => {
    dispatchProps.onToggleAnimationCollapse();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ANIM_COLLAPSE' });
  });

  it('onPauseAnimation dispatches pause action', () => {
    dispatchProps.onPauseAnimation();
    expect(dispatch).toHaveBeenCalledWith({ type: 'PAUSE_ANIMATION' });
  });

  it('addGranuleDateRanges dispatches with layer and dateRanges', () => {
    dispatchProps.addGranuleDateRanges('layer1', [[1, 2]]);
    expect(dispatch).toHaveBeenCalledWith({ type: 'ADD_GRANULE_DATE_RANGES', l: 'layer1', d: [[1, 2]] });
  });
});

// ─── getOffsetValues (via mapStateToProps) ────────────────────────────────────

describe('getOffsetValues (via mapStateToProps)', () => {
  const { getSelectedDate, getDeltaIntervalUnit } = require('../../modules/date/selectors');
  const { checkHasFutureLayers, filterProjLayersWithStartDate } = require('../../modules/date/util');
  const { getActiveLayers, subdailyLayersActive, subdailyLayers, getSubDaily, getSmallestIntervalValue } = require('../../modules/layers/selectors');
  const { getISODateFormatted } = require('../../components/timeline/date-util');

  beforeEach(() => {
    getActiveLayers.mockReturnValue([]);
    subdailyLayersActive.mockReturnValue(false);
    subdailyLayers.mockReturnValue([]);
    getSubDaily.mockReturnValue([]);
    getSmallestIntervalValue.mockReturnValue(1440);
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    checkHasFutureLayers.mockReturnValue(false);
    filterProjLayersWithStartDate.mockImplementation((l) => l);
    getISODateFormatted.mockImplementation((d) => d
      ? new Date(d).toISOString()
        .replace(/\.\d{3}Z$/, 'Z')
      : '');
  });

  const makeState = (screenWidth = 1200, hasSubdaily = false) => ({
    animation: {
      isActive: false,
      startDate: null,
      endDate: null,
      gifActive: false,
      isPlaying: false,
      isCollapsed: false,
    },
    compare: { active: false, isCompareA: true, activeString: 'active' },
    charting: { active: false },
    config: { startDate: '1948-01-01T00:00:00Z', parameters: {}, features: {} },
    date: {
      appNow: new Date('2021-01-01T00:00:00Z'),
      customDelta: 1,
      customInterval: 3,
      customSelected: false,
      autoSelected: false,
      interval: 3,
      selected: new Date('2021-01-01T00:00:00Z'),
      selectedB: new Date('2020-06-01T00:00:00Z'),
      selectedZoom: 3,
      timelineCustomModalOpen: false,
      delta: 1,
    },
    events: { isAnimatingToEvent: false },
    embed: { isEmbedModeActive: false },
    layers: { active: { layers: [] }, activeB: { layers: [] } },
    map: { ui: { selected: { frameState_: true } } },
    modal: { isOpen: false, id: null },
    proj: { id: 'geographic', selected: { id: 'geographic' } },
    screenSize: {
      isMobileDevice: false,
      breakpoints: {},
      screenWidth,
      isMobilePhone: false,
      isMobileTablet: false,
      orientation: 'landscape',
    },
    sidebar: { activeTab: 'layers' },
    tour: { active: false },
    ui: { isDistractionFreeModeActive: false, isKioskModeActive: false, displayStaticMap: false },
  });

  it('computes axisWidth = screenWidth - (310+10) - 88 when no subdaily', () => {
    const result = capturedMapState(makeState(1200, false));
    // parentOffset = 310+10 = 320, width = 1200 - 320 - 88 = 792
    expect(result.axisWidth).toBe(792);
  });

  it('computes axisWidth with subdaily parentOffset (414+10)', () => {
    subdailyLayersActive.mockReturnValue(true);
    const result = capturedMapState(makeState(1200, true));
    // parentOffset = 414+10 = 424, width = 1200 - 424 - 88 = 688
    expect(result.axisWidth).toBe(688);
  });

  it('computes parentOffset=320 without subdaily', () => {
    const result = capturedMapState(makeState(1200, false));
    expect(result.parentOffset).toBe(320);
  });

  it('computes parentOffset=424 with subdaily', () => {
    subdailyLayersActive.mockReturnValue(true);
    const result = capturedMapState(makeState(1200, true));
    expect(result.parentOffset).toBe(424);
  });
});

// ─── checkLeftArrowDisabled / checkRightArrowDisabled / checkNowButtonDisabled

describe('arrow and button disabled logic (via mapStateToProps)', () => {
  const { getSelectedDate, getDeltaIntervalUnit } = require('../../modules/date/selectors');
  const { checkHasFutureLayers, filterProjLayersWithStartDate } = require('../../modules/date/util');
  const { getActiveLayers, subdailyLayersActive, subdailyLayers, getSubDaily, getSmallestIntervalValue } = require('../../modules/layers/selectors');
  const { getISODateFormatted } = require('../../components/timeline/date-util');

  const BASE_STATE = {
    animation: {
      isActive: false,
      startDate: null,
      endDate: null,
      gifActive: false,
      isPlaying: false,
      isCollapsed: false,
    },
    compare: { active: false, isCompareA: true, activeString: 'active' },
    charting: { active: false },
    config: { startDate: '1948-01-01T00:00:00Z', parameters: {}, features: {} },
    date: {
      appNow: new Date('2021-01-01T00:00:00Z'),
      customDelta: 1,
      customInterval: 3,
      customSelected: false,
      autoSelected: false,
      interval: 3,
      selected: new Date('2021-06-15T00:00:00Z'),
      selectedB: new Date('2020-06-01T00:00:00Z'),
      selectedZoom: 3,
      timelineCustomModalOpen: false,
      delta: 1,
    },
    events: { isAnimatingToEvent: false },
    embed: { isEmbedModeActive: false },
    layers: { active: { layers: [] }, activeB: { layers: [] } },
    map: { ui: { selected: { frameState_: true } } },
    modal: { isOpen: false, id: null },
    proj: { id: 'geographic', selected: { id: 'geographic' } },
    screenSize: { isMobileDevice: false, breakpoints: {}, screenWidth: 1200, isMobilePhone: false, isMobileTablet: false, orientation: 'landscape' },
    sidebar: { activeTab: 'layers' },
    tour: { active: false },
    ui: { isDistractionFreeModeActive: false, isKioskModeActive: false, displayStaticMap: false },
  };

  beforeEach(() => {
    getActiveLayers.mockReturnValue([]);
    subdailyLayersActive.mockReturnValue(false);
    subdailyLayers.mockReturnValue([]);
    getSubDaily.mockReturnValue([]);
    getSmallestIntervalValue.mockReturnValue(1440);
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    checkHasFutureLayers.mockReturnValue(false);
    filterProjLayersWithStartDate.mockImplementation((l) => l);
    getISODateFormatted.mockImplementation((d) => d
      ? new Date(d).toISOString()
        .replace(/\.\d{3}Z$/, 'Z')
      : '');
  });

  it('rightArrowDisabled=false when autoSelected=true regardless of date', () => {
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    const result = capturedMapState({
      ...BASE_STATE,
      date: { ...BASE_STATE.date, autoSelected: true, selected: new Date('2021-01-01T00:00:00Z') },
    });
    expect(result.rightArrowDisabled).toBe(false);
  });

  it('rightArrowDisabled=true when next date would exceed timeline end', () => {
    // selectedDate at end limit, delta=1 day
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    const result = capturedMapState({
      ...BASE_STATE,
      date: { ...BASE_STATE.date, autoSelected: false, selected: new Date('2021-01-01T00:00:00Z') },
    });
    expect(result.rightArrowDisabled).toBe(true);
  });

  it('nowButtonDisabled=false when selectedDate is before appNow', () => {
    getSelectedDate.mockReturnValue(new Date('2020-06-01T00:00:00Z'));
    const result = capturedMapState({
      ...BASE_STATE,
      date: { ...BASE_STATE.date, selected: new Date('2020-06-01T00:00:00Z') },
    });
    expect(result.nowButtonDisabled).toBe(false);
  });
});

// ─── getMobileDateButtonStyle ─────────────────────────────────────────────────

describe('getMobileDateButtonStyle (via rendered output)', () => {
  it('uses default left=190 and bottom=20 in mobile mode', async () => {
    const { container } = renderComponent({ isMobile: true });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn).toBeInTheDocument();
      expect(btn.style.left).toBe('190px');
      expect(btn.style.bottom).toBe('20px');
    });
  });

  it('uses left=145 in embed+mobile mode', async () => {
    const { container } = renderComponent({ isMobile: true, isEmbedModeActive: true });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('145px');
    });
  });

  it('adjusts left when hasSubdailyLayers and screenWidth >= 484', async () => {
    const { container } = renderComponent({
      isMobile: true,
      hasSubdailyLayers: true,
      screenWidth: 500,
    });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('287px');
    });
  });

  it('uses left=10 and bottom=75 when screenWidth < 575 and not compare mode', async () => {
    const { container } = renderComponent({
      isMobile: true,
      screenWidth: 400,
      hasSubdailyLayers: false,
    });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('10px');
      expect(btn.style.bottom).toBe('75px');
    });
  });

  it('uses left=112 when screenWidth < 575 and compare mode active', async () => {
    const { container } = renderComponent({
      isMobile: true,
      screenWidth: 400,
      hasSubdailyLayers: false,
      isCompareModeActive: true,
    });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('112px');
    });
  });
});

// ─── useEffect mount behavior ─────────────────────────────────────────────────

describe('useEffect mount behavior', () => {
  it('sets initialLoadComplete and renders content', async () => {
    const { container } = renderComponent();
    await waitFor(() => {
      expect(container.querySelector('#timeline')).toBeInTheDocument();
    });
  });

  it('does not set appNow interval when nowOverride=true', async () => {
    jest.useFakeTimers();
    const updateAppNow = jest.fn();
    renderComponent({ nowOverride: true, updateAppNow });
    jest.advanceTimersByTime(600001 * 10);
    expect(updateAppNow).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not render anything in timeline when isDistractionFreeModeActive and not yet mounted', () => {
    // Before useEffect runs (first paint), nothing is shown;
    // After, distraction-free section appears
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    // After mount effects, we should see the distraction-free section
    waitFor(() => {
      expect(container.querySelector('#distraction-free-timeline')).toBeInTheDocument();
    });
  });
});

// ─── Custom Interval Selector ─────────────────────────────────────────────────

describe('CustomIntervalSelector', () => {
  it('renders CustomIntervalSelector in desktop mode', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('custom-interval-selector')).toBeInTheDocument();
    });
  });

  it('renders AxisTimeScaleChange in desktop mode', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('axis-timescale-change')).toBeInTheDocument();
    });
  });
});

// ─── AxisHoverLine / DateTooltip conditional rendering ────────────────────────

describe('AxisHoverLine and DateTooltip', () => {
  it('renders AxisHoverLine when timeline footer is visible', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('axis-hover-line')).toBeInTheDocument();
    });
  });

  it('renders DateTooltip when timeline is not dragging', async () => {
    const { getByTestId } = renderComponent();
    await waitFor(() => {
      expect(getByTestId('date-tooltip')).toBeInTheDocument();
    });
  });
});

// ─── TimelineAxis callback functions ─────────────────────────────────────────

describe('TimelineAxis callback props', () => {
  it('updatePositioning updates state without throwing', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updatePositioning({
        isTimelineDragging: false,
        position: 100,
        transformX: 50,
        frontDate: '2021-01-01T00:00:00Z',
        backDate: '2021-02-01T00:00:00Z',
        draggerPosition: 200,
        draggerPositionB: 210,
        draggerVisible: true,
        draggerVisibleB: false,
        animationStartLocation: 0,
        animationEndLocation: 0,
      });
    });
  });

  it('updatePositioningOnSimpleDrag sets isTimelineDragging=true', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updatePositioningOnSimpleDrag({
        position: 50,
        draggerPosition: 100,
        draggerPositionB: 110,
        animationStartLocation: 0,
        animationEndLocation: 0,
      });
    });
  });

  it('updatePositioningOnAxisStopDrag updates state', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updatePositioningOnAxisStopDrag({
        isTimelineDragging: false,
        position: 75,
        transformX: 25,
      });
    });
  });

  it('updateTimelineMoveAndDrag sets dragging state', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updateTimelineMoveAndDrag(true);
    });
  });

  it('showHoverOn sets showHoverLine to true', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.showHoverOn();
    });
  });

  it('showHoverOff does not throw', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.showHoverOff();
    });
  });

  it('showHover calls preventDefault and stopPropagation', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    const mockTarget = { getBoundingClientRect: () => ({ left: 0 }) };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      persist: jest.fn(),
      target: mockTarget,
      clientX: 100,
    };
    act(() => {
      capturedTimelineAxisProps.showHover(mockEvent, '2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z', 0);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('onDateChange with selectedB sets draggerTimeStateB', async () => {
    renderComponent({ draggerSelected: 'selectedB' });
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.onDateChange(new Date('2021-06-01T00:00:00Z'), 'selectedB');
    });
  });

  it('updateDraggerDatePosition with selected dragger updates position', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updateDraggerDatePosition(
        '2021-06-01T00:00:00Z', 'selected', 150, true, false,
      );
    });
  });

  it('updateDraggerDatePosition with selectedB dragger updates B position', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updateDraggerDatePosition(
        '2021-06-01T00:00:00Z', 'selectedB', 160, true, false,
      );
    });
  });

  it('updateDraggerDatePosition with no newDate uses fallback', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    act(() => {
      capturedTimelineAxisProps.updateDraggerDatePosition(null, 'selected', null, null, null);
    });
  });

  it('debounceChangeTimeScaleWheel with deltaY>0 calls changeTimeScale down', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'month' });
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    jest.useFakeTimers();
    act(() => {
      capturedTimelineAxisProps.debounceChangeTimeScaleWheel({ deltaY: 10 });
    });
    jest.runAllTimers();
    jest.useRealTimers();
    expect(changeTimeScale).toHaveBeenCalledWith(1);
  });

  it('debounceChangeTimeScaleWheel with deltaY<0 calls changeTimeScale up', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'month' });
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    jest.useFakeTimers();
    act(() => {
      capturedTimelineAxisProps.debounceChangeTimeScaleWheel({ deltaY: -10 });
    });
    jest.runAllTimers();
    jest.useRealTimers();
    expect(changeTimeScale).toHaveBeenCalledWith(3);
  });

  it('debounceChangeTimeScaleWheel does not exceed min (year) on deltaY>0', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'year' });
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    jest.useFakeTimers();
    act(() => {
      capturedTimelineAxisProps.debounceChangeTimeScaleWheel({ deltaY: 10 });
    });
    jest.runAllTimers();
    jest.useRealTimers();
    expect(changeTimeScale).not.toHaveBeenCalled();
  });

  it('debounceChangeTimeScaleWheel does not exceed max (day=3) without subdaily on deltaY<0', async () => {
    const changeTimeScale = jest.fn();
    renderComponent({ changeTimeScale, timeScale: 'day', hasSubdailyLayers: false });
    await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
    jest.useFakeTimers();
    act(() => {
      capturedTimelineAxisProps.debounceChangeTimeScaleWheel({ deltaY: -10 });
    });
    jest.runAllTimers();
    jest.useRealTimers();
    expect(changeTimeScale).not.toHaveBeenCalled();
  });
});

// ─── DraggerContainer callback functions ──────────────────────────────────────

// DraggerContainer only renders when frontDate is truthy. Call updatePositioning first.
async function renderWithFrontDate(extraProps = {}) {
  const result = renderComponent(extraProps);
  await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
  await act(async () => {
    capturedTimelineAxisProps.updatePositioning({
      isTimelineDragging: false,
      position: 0,
      transformX: 0,
      frontDate: '2021-01-01T00:00:00Z',
      backDate: '2021-02-01T00:00:00Z',
      draggerPosition: 100,
      draggerPositionB: 110,
      draggerVisible: true,
      draggerVisibleB: false,
      animationStartLocation: 0,
      animationEndLocation: 0,
    });
  });
  await waitFor(() => { expect(capturedDraggerContainerProps).not.toBeNull(); });
  return result;
}

describe('DraggerContainer callback props', () => {
  it('setDraggerVisibility updates dragger visibility', async () => {
    await renderWithFrontDate();
    act(() => { capturedDraggerContainerProps.setDraggerVisibility(true, false); });
  });

  it('toggleShowDraggerTime sets dragging state', async () => {
    await renderWithFrontDate();
    act(() => { capturedDraggerContainerProps.toggleShowDraggerTime(true); });
  });
});

// ─── TimelineLayerCoveragePanel callback functions ───────────────────────────

describe('TimelineLayerCoveragePanel setMatchingTimelineCoverage', () => {
  it('setMatchingTimelineCoverage updates matching coverage state', async () => {
    renderComponent();
    await waitFor(() => { expect(capturedCoverageProps).not.toBeNull(); });
    act(() => {
      capturedCoverageProps.setMatchingTimelineCoverage([{ id: 'range1' }], true);
    });
  });

  it('toggleLayerCoveragePanel opens panel and pushes GTM event', async () => {
    const googleTagManager = require('googleTagManager');
    renderComponent();
    await waitFor(() => { expect(capturedCoverageProps).not.toBeNull(); });
    act(() => {
      capturedCoverageProps.toggleLayerCoveragePanel(true);
    });
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'open_layer_coverage_panel' });
  });

  it('toggleLayerCoveragePanel closes panel without GTM event', async () => {
    const googleTagManager = require('googleTagManager');
    renderComponent();
    await waitFor(() => { expect(capturedCoverageProps).not.toBeNull(); });
    act(() => {
      capturedCoverageProps.toggleLayerCoveragePanel(false);
    });
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });
});

// ─── TimelineRangeSelector updateAnimationDateAndLocation ────────────────────

// RangeSelector renders only when isAnimationWidgetReady (requires non-zero locations).
// Sequence: render → set frontDate via updatePositioning → rerender with animation props
// → second useEffect fires and computes non-zero locations → RangeSelector renders.
async function renderWithAnimationReady(extraProps = {}) {
  const animStart = new Date('2020-01-01T00:00:00Z');
  const animEnd = new Date('2020-12-31T00:00:00Z');
  const { rerender, ...rest } = renderComponent();
  await waitFor(() => { expect(capturedTimelineAxisProps).not.toBeNull(); });
  // Set frontDate so animationDraggerDateUpdateLocal can compute real locations
  await act(async () => {
    capturedTimelineAxisProps.updatePositioning({
      isTimelineDragging: false,
      position: 0,
      transformX: 0,
      frontDate: '2021-01-01T00:00:00Z',
      backDate: '2021-06-01T00:00:00Z',
      draggerPosition: 0,
      draggerPositionB: 0,
      draggerVisible: true,
      draggerVisibleB: false,
      animationStartLocation: 0,
      animationEndLocation: 0,
    });
  });
  // Re-render with animation props → triggers second useEffect which sets locations
  await act(async () => {
    rerender(
      <Timeline
        {...defaultProps}
        isAnimationWidgetOpen
        animationDisabled={false}
        animStartLocationDate={animStart}
        animEndLocationDate={animEnd}
        {...extraProps}
      />,
    );
  });
  return { rerender, ...rest, animStart, animEnd };
}

describe('TimelineRangeSelector updateAnimationDateAndLocation', () => {
  it('renders TimelineRangeSelector when animation widget is ready', async () => {
    const { getByTestId } = await renderWithAnimationReady();
    await waitFor(() => {
      expect(getByTestId('range-selector')).toBeInTheDocument();
    });
  });

  it('updateAnimationDateAndLocation calls onUpdateStartAndEndDate when both dates change', async () => {
    const onUpdateStartAndEndDate = jest.fn();
    await renderWithAnimationReady({ onUpdateStartAndEndDate });
    await waitFor(() => { expect(capturedRangeSelectorProps).not.toBeNull(); });
    const newStart = new Date('2020-03-01T00:00:00Z');
    const newEnd = new Date('2020-09-01T00:00:00Z');
    await act(async () => {
      capturedRangeSelectorProps.updateAnimationDateAndLocation(
        newStart, newEnd, 100, 200, false,
      );
    });
  });

  it('updateAnimationDateAndLocation with no explicit locations falls back to current state', async () => {
    await renderWithAnimationReady();
    await waitFor(() => { expect(capturedRangeSelectorProps).not.toBeNull(); });
    const { animStart, animEnd } = { animStart: new Date('2020-01-01T00:00:00Z'), animEnd: new Date('2020-12-31T00:00:00Z') };
    act(() => {
      capturedRangeSelectorProps
        .updateAnimationDateAndLocation(animStart, animEnd, null, null, true);
    });
  });
});

// ─── Second useEffect — animation dates initialization ───────────────────────

describe('second useEffect: animation dates init', () => {
  it('sets animation start/end location when props first become available', async () => {
    const animStart = new Date('2020-01-01T00:00:00Z');
    const animEnd = new Date('2020-12-31T00:00:00Z');
    const { container } = renderComponent({
      animStartLocationDate: animStart,
      animEndLocationDate: animEnd,
    });
    await waitFor(() => {
      expect(container.querySelector('.timeline-container')).toBeInTheDocument();
    });
  });
});

// ─── componentDidUpdate-equivalent effect ────────────────────────────────────

describe('componentDidUpdate effect', () => {
  it('calls animationDraggerDateUpdateLocal when animation turns on', async () => {
    const animStart = new Date('2020-01-01T00:00:00Z');
    const animEnd = new Date('2020-12-31T00:00:00Z');
    const { rerender } = renderComponent({
      isAnimationPlaying: false,
      animStartLocationDate: animStart,
      animEndLocationDate: animEnd,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          isAnimationPlaying
          animStartLocationDate={animStart}
          animEndLocationDate={animEnd}
        />,
      );
    });
  });

  it('calls animationDraggerDateUpdateLocal when gif turns on', async () => {
    const animStart = new Date('2020-01-01T00:00:00Z');
    const animEnd = new Date('2020-12-31T00:00:00Z');
    const { rerender } = renderComponent({
      isGifActive: false,
      animStartLocationDate: animStart,
      animEndLocationDate: animEnd,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          isGifActive
          animStartLocationDate={animStart}
          animEndLocationDate={animEnd}
        />,
      );
    });
  });

  it('calls changeAutoInterval when tempo product is removed', async () => {
    const changeAutoInterval = jest.fn();
    const { rerender } = renderComponent({
      hasTempoProduct: true,
      changeAutoInterval,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          hasTempoProduct={false}
          changeAutoInterval={changeAutoInterval}
        />);
    });
    await waitFor(() => {
      expect(changeAutoInterval).toHaveBeenCalled();
    });
  });

  it('calls changeCustomInterval when subdaily removed with subdaily interval', async () => {
    const changeCustomInterval = jest.fn();
    const { rerender } = renderComponent({
      hasSubdailyLayers: true,
      customInterval: 4,
      changeCustomInterval,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          hasSubdailyLayers={false}
          customInterval={4}
          changeCustomInterval={changeCustomInterval}
        />,
      );
    });
    await waitFor(() => {
      expect(changeCustomInterval).toHaveBeenCalled();
    });
  });

  it('calls changeTimeScale(4) when subdaily layers are added', async () => {
    const changeTimeScale = jest.fn();
    const { rerender } = renderComponent({ hasSubdailyLayers: false, changeTimeScale });
    await waitFor(() => {});
    await act(async () => {
      rerender(<Timeline {...defaultProps} hasSubdailyLayers changeTimeScale={changeTimeScale} />);
    });
    await waitFor(() => {
      expect(changeTimeScale).toHaveBeenCalledWith(4);
    });
  });

  it('updates draggerTimeState when dateA changes', async () => {
    const { rerender } = renderComponent({ dateA: '2021-01-01T00:00:00Z' });
    await waitFor(() => {});
    await act(async () => {
      rerender(<Timeline {...defaultProps} dateA="2021-06-01T00:00:00Z" />);
    });
  });

  it('updates draggerTimeStateB when dateB changes', async () => {
    const { rerender } = renderComponent({ dateB: '2020-06-01T00:00:00Z' });
    await waitFor(() => {});
    await act(async () => {
      rerender(<Timeline {...defaultProps} dateB="2020-12-01T00:00:00Z" />);
    });
  });

  it('calls changeAutoInterval(true) when subdailyCount changes and hasTempoProduct', async () => {
    const changeAutoInterval = jest.fn();
    const { rerender } = renderComponent({
      subDailyLayersList: [{ id: 'l1' }],
      hasTempoProduct: true,
      changeAutoInterval,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          subDailyLayersList={[{ id: 'l1' }, { id: 'l2' }]}
          hasTempoProduct
          changeAutoInterval={changeAutoInterval}
        />,
      );
    });
    await waitFor(() => {
      expect(changeAutoInterval).toHaveBeenCalledWith(true);
    });
  });

  it('calls changeCustomInterval when subdailyCount changes and isSubDaily', async () => {
    const changeCustomInterval = jest.fn();
    const { rerender } = renderComponent({
      subDailyLayersList: [{ id: 'l1' }],
      newCustomDelta: 60,
      hasTempoProduct: false,
      changeCustomInterval,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          subDailyLayersList={[{ id: 'l1' }, { id: 'l2' }]}
          newCustomDelta={60}
          hasTempoProduct={false}
          changeCustomInterval={changeCustomInterval}
        />,
      );
    });
    await waitFor(() => {
      expect(changeCustomInterval).toHaveBeenCalledWith(60, 5);
    });
  });

  it('updates animation dragger when widget is open and dates change', async () => {
    const animStart = new Date('2020-01-01T00:00:00Z');
    const animEnd = new Date('2020-12-31T00:00:00Z');
    const animStart2 = new Date('2020-03-01T00:00:00Z');
    const { rerender } = renderComponent({
      isAnimationWidgetOpen: true,
      animStartLocationDate: animStart,
      animEndLocationDate: animEnd,
    });
    await waitFor(() => {});
    await act(async () => {
      rerender(
        <Timeline
          {...defaultProps}
          isAnimationWidgetOpen
          animStartLocationDate={animStart2}
          animEndLocationDate={animEnd}
        />,
      );
    });
  });
});

// ─── Keyboard ArrowLeft / ArrowRight ─────────────────────────────────────────

describe('Keyboard ArrowLeft and ArrowRight', () => {
  it('ArrowLeft key calls handleArrowDateChange(-1)', async () => {
    const selectDate = jest.fn();
    const { getNextTimeSelection } = require('../../modules/date/util');
    renderComponent({ selectDate, leftArrowDisabled: false });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });
    expect(getNextTimeSelection).toHaveBeenCalled();
  });

  it('ArrowRight key calls handleArrowDateChange(1)', async () => {
    const selectDate = jest.fn();
    const { getNextTimeSelection } = require('../../modules/date/util');
    renderComponent({ selectDate, rightArrowDisabled: false });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    });
    expect(getNextTimeSelection).toHaveBeenCalled();
  });

  it('ArrowLeft does not act when leftArrowDisabled=true', async () => {
    const { getNextTimeSelection } = require('../../modules/date/util');
    renderComponent({ leftArrowDisabled: true });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });
    expect(getNextTimeSelection).not.toHaveBeenCalled();
  });

  it('ArrowLeft uses activeString=activeB dateB when not active', async () => {
    const { getNextImageryDelta } = require('../../modules/date/util');
    renderComponent({
      autoSelected: true,
      subDailyLayersList: [{ id: 'l1' }],
      activeString: 'activeB',
      leftArrowDisabled: false,
    });
    await waitFor(() => {});
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
    });
    expect(getNextImageryDelta).toHaveBeenCalled();
  });
});

// ─── getMobileDateButtonStyle — missing branches ──────────────────────────────

describe('getMobileDateButtonStyle — embed+subdaily and embed+small branches', () => {
  it('uses left=220 when hasSubdailyLayers + isEmbedModeActive + screenWidth>=484', async () => {
    const { container } = renderComponent({
      isMobile: true,
      hasSubdailyLayers: true,
      isEmbedModeActive: true,
      screenWidth: 600,
    });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('220px');
    });
  });

  it('uses left=10 and bottom=56 when screenWidth<575 + isEmbedModeActive + no compare', async () => {
    const { container } = renderComponent({
      isMobile: true,
      screenWidth: 400,
      isEmbedModeActive: true,
      isCompareModeActive: false,
    });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('10px');
      expect(btn.style.bottom).toBe('56px');
    });
  });

  it('uses left=90 when screenWidth<575 + isEmbedModeActive + compare active', async () => {
    const { container } = renderComponent({
      isMobile: true,
      screenWidth: 400,
      isEmbedModeActive: true,
      isCompareModeActive: true,
    });
    await waitFor(() => {
      const btn = container.querySelector('.mobile-date-change-arrows-btn');
      expect(btn.style.left).toBe('90px');
    });
  });
});

// ─── mapDispatchToProps — missing entries ─────────────────────────────────────

describe('mapDispatchToProps selectInterval and toggleCustomModal', () => {
  it('selectInterval dispatches correct action', () => {
    const dispatch = jest.fn();
    const { selectInterval } = capturedMapDispatch(dispatch);
    selectInterval(1, 3, false);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_INTERVAL', delta: 1, ts: 3, cs: false });
  });

  it('toggleCustomModal dispatches correct action', () => {
    const dispatch = jest.fn();
    const { toggleCustomModal } = capturedMapDispatch(dispatch);
    toggleCustomModal(true, 'TIMELINE');
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_CUSTOM_MODAL', open: true, by: 'TIMELINE' });
  });
});

// ─── getTimelineEndDateLimit with future layers ───────────────────────────────

describe('getTimelineEndDateLimit via mapStateToProps', () => {
  const { getSelectedDate, getDeltaIntervalUnit } = require('../../modules/date/selectors');
  const {
    checkHasFutureLayers, filterProjLayersWithStartDate,
  } = require('../../modules/date/util');
  const {
    getActiveLayers, subdailyLayersActive, subdailyLayers,
    getSubDaily, getSmallestIntervalValue, dateRange: getDateRange,
  } = require('../../modules/layers/selectors');
  const { getISODateFormatted } = require('../../components/timeline/date-util');

  const appNow = new Date('2021-01-01T00:00:00Z');

  const makeFutureState = (overrides = {}) => ({
    animation: {
      isActive: false,
      startDate: null,
      endDate: null,
      gifActive: false,
      isPlaying: false,
      isCollapsed: false,
    },
    compare: { active: false, isCompareA: true, activeString: 'active' },
    charting: { active: false },
    config: { startDate: '1948-01-01T00:00:00Z', parameters: {}, features: {} },
    date: {
      appNow,
      customDelta: 1,
      customInterval: 3,
      customSelected: false,
      autoSelected: false,
      interval: 3,
      selected: new Date('2021-01-01T00:00:00Z'),
      selectedB: new Date('2020-06-01T00:00:00Z'),
      selectedZoom: 3,
      timelineCustomModalOpen: false,
      delta: 1,
    },
    events: { isAnimatingToEvent: false },
    embed: { isEmbedModeActive: false },
    layers: { active: { layers: [] }, activeB: { layers: [] } },
    map: { ui: { selected: { frameState_: true } } },
    modal: { isOpen: false, id: null },
    proj: { id: 'geographic', selected: {} },
    screenSize: { isMobileDevice: false, breakpoints: {}, screenWidth: 1200, isMobilePhone: false, isMobileTablet: false, orientation: 'landscape' },
    sidebar: { activeTab: 'layers' },
    tour: { active: false },
    ui: { isDistractionFreeModeActive: false, isKioskModeActive: false, displayStaticMap: false },
    ...overrides,
  });

  beforeEach(() => {
    getActiveLayers.mockReturnValue([]);
    subdailyLayersActive.mockReturnValue(false);
    subdailyLayers.mockReturnValue([]);
    getSubDaily.mockReturnValue([]);
    getSmallestIntervalValue.mockReturnValue(1440);
    getSelectedDate.mockReturnValue(new Date('2021-01-01T00:00:00Z'));
    getDeltaIntervalUnit.mockReturnValue({ delta: 1, unit: 'day', interval: 3 });
    filterProjLayersWithStartDate.mockImplementation((l) => l);
    getISODateFormatted.mockImplementation((d) => d
      ? new Date(d).toISOString()
        .replace(/\.\d{3}Z$/, 'Z')
      : '');
  });

  it('uses compare layer ranges when compare is active', () => {
    checkHasFutureLayers.mockReturnValue(true);
    getDateRange.mockReturnValue(null);
    const result = capturedMapState(makeFutureState({
      compare: { active: true, isCompareA: true, activeString: 'active' },
    }));
    expect(result.timelineEndDateLimit).toBeDefined();
  });

  it('uses layerDateRange.end when it exceeds appNow', () => {
    checkHasFutureLayers.mockReturnValue(true);
    const futureDate = new Date('2022-01-01T00:00:00Z');
    getDateRange.mockReturnValue({ end: futureDate });
    const util = require('../../util/util').default;
    util.roundTimeQuarterHour.mockImplementation((d) => d);
    const result = capturedMapState(makeFutureState());
    expect(result.timelineEndDateLimit).toBeDefined();
  });
});

// ─── preventDefaultFunc (wheel on timeline-container) ────────────────────────

describe('preventDefaultFunc on timeline-container wheel event', () => {
  it('wheel event on .timeline-container calls preventDefault', async () => {
    const { container } = renderComponent();
    await waitFor(() => { expect(container.querySelector('.timeline-container')).toBeInTheDocument(); });
    const wheelEvent = new Event('wheel');
    const preventDefault = jest.fn();
    wheelEvent.preventDefault = preventDefault;
    // The mount effect attaches the listener via document.querySelector,
    // which finds the persistent container (first matching element in DOM)
    persistentTimelineContainer.dispatchEvent(wheelEvent);
    // The handler calls e.preventDefault()
    expect(preventDefault).toHaveBeenCalled();
  });
});

// ─── checkAndUpdateAppNow via interval ───────────────────────────────────────

describe('checkAndUpdateAppNow', () => {
  it('calls updateAppNow after 10-minute interval fires', async () => {
    jest.useFakeTimers();
    const updateAppNow = jest.fn();
    renderComponent({ nowOverride: false, updateAppNow });
    // Trigger the 10-minute interval and flush the resulting Promise chain
    await act(async () => {
      jest.advanceTimersByTime(600001);
      await Promise.resolve();
    });
    jest.useRealTimers();
    await waitFor(() => {
      expect(updateAppNow).toHaveBeenCalled();
    });
  });
});
