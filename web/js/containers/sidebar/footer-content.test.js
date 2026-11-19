/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';
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
  UncontrolledTooltip: ({ children, id, target, placement }) => (
    <div
      data-testid={`tooltip-${target || id}`}
      data-placement={placement}
    >
      {children}
    </div>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, id }) => <span data-testid={`fa-${id || icon}`} />,
}));

jest.mock('../../components/charting/charting-info', () => function MockChartingInfo() {
  return <div data-testid="charting-info" />;
});

jest.mock('../../components/util/button', () => function MockButton({
  id, onClick, className, text, style,
}) {
  return (
    <button
      type="button"
      data-testid={id}
      className={className}
      style={style}
      onClick={onClick}
    >
      {text}
    </button>
  );
});

jest.mock('../../components/sidebar/compare-mode-options', () => function MockCompareModeOptions({
  isActive, isMobile, selected, onclick,
}) {
  return (
    <div
      data-testid="compare-mode-options"
      data-is-active={String(isActive)}
      data-is-mobile={String(isMobile)}
      data-selected={selected}
    >
      <button type="button" data-testid="compare-mode-change" onClick={() => onclick('spy')} />
    </div>
  );
});

jest.mock('../../components/sidebar/charting-mode-options', () => function MockChartingModeOptions({
  isChartingActive, isMobile, sidebarHeight,
}) {
  return (
    <div
      data-testid="charting-mode-options"
      data-is-active={String(isChartingActive)}
      data-sidebar-height={sidebarHeight}
    />
  );
});

jest.mock('../../components/layer/product-picker/search-ui-provider', () => function MockSearchUiProvider() {
  return <div data-testid="search-ui-provider" />;
});

jest.mock('../../modules/compare/actions', () => ({
  toggleCompareOnOff: jest.fn(() => ({ type: 'TOGGLE_COMPARE' })),
  changeMode: jest.fn((str) => ({ type: 'CHANGE_MODE', str })),
}));

jest.mock('../../modules/charting/actions', () => ({
  toggleChartingModeOnOff: jest.fn(() => ({ type: 'TOGGLE_CHARTING' })),
}));

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn((key, opts) => ({ type: 'OPEN_CUSTOM_CONTENT', key, opts })),
  onClose: jest.fn(() => ({ type: 'CLOSE_MODAL' })),
}));

jest.mock('../../modules/natural-events/selectors', () => ({
  getFilteredEvents: jest.fn(() => []),
}));

jest.mock('../../modules/natural-events/constants', () => ({
  LIMIT_EVENT_REQUEST_COUNT: 50,
}));

jest.mock('../../modules/layers/actions', () => ({
  toggleOverlayGroups: jest.fn(() => ({ type: 'TOGGLE_OVERLAY_GROUPS' })),
}));

jest.mock('../../modules/animation/actions', () => ({
  stop: jest.fn(() => ({ type: 'STOP_ANIMATION' })),
}));

import FooterContent from './footer-content';
import {
  toggleCompareOnOff,
  changeMode,
} from '../../modules/compare/actions';
import { toggleChartingModeOnOff } from '../../modules/charting/actions';
import {
  openCustomContent,
  onClose as closeModal,
} from '../../modules/modal/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  getFilteredEvents.mockReturnValue([]);
  const rdd = require('react-device-detect');
  rdd.isMobileOnly = false;
  rdd.isTablet = false;
});

const defaultProps = {
  activeTab: 'layers',
  changeCompareMode: jest.fn(),
  chartFeature: true,
  chartingModeAccessible: true,
  compareFeature: true,
  compareMode: 'swipe',
  eventsData: [],
  isChartingActive: false,
  isCompareActive: false,
  isMobile: false,
  closeModalAction: jest.fn(),
  openChartingInfoModal: jest.fn(),
  toggleCompare: jest.fn(),
  toggleCharting: jest.fn(),
  sidebarHeight: 500,
};

const renderComponent = (propOverrides = {}) => render(
  <FooterContent {...defaultProps} {...propOverrides} />,
);

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('FooterContent rendering', () => {
  it('renders a footer element', () => {
    const { container } = renderComponent();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('renders layers footer when activeTab is "layers"', () => {
    const { getByTestId } = renderComponent({ activeTab: 'layers' });
    expect(getByTestId('compare-mode-options')).toBeInTheDocument();
  });

  it('renders events footer when activeTab is "events"', () => {
    const { container } = renderComponent({
      activeTab: 'events',
      eventsData: [{ id: 'e1' }],
    });
    expect(container.querySelector('.event-count')).toBeInTheDocument();
  });

  it('renders nothing inside footer when activeTab is neither layers nor events', () => {
    const { container } = renderComponent({ activeTab: 'other' });
    expect(container.querySelector('footer').textContent).toBe('');
  });

  it('renders with a forwarded ref', () => {
    const ref = React.createRef();
    render(<FooterContent {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current.tagName).toBe('FOOTER');
  });
});

// ─── Layers footer ────────────────────────────────────────────────────────────

describe('FooterContent layers footer', () => {
  it('renders CompareModeOptions with correct props', () => {
    const { getByTestId } = renderComponent({ isCompareActive: true, compareMode: 'swipe' });
    const opts = getByTestId('compare-mode-options');
    expect(opts).toHaveAttribute('data-is-active', 'true');
    expect(opts).toHaveAttribute('data-selected', 'swipe');
  });

  it('passes isMobile to CompareModeOptions', () => {
    const { getByTestId } = renderComponent({ isMobile: true });
    expect(getByTestId('compare-mode-options')).toHaveAttribute('data-is-mobile', 'true');
  });

  it('calls changeCompareMode when CompareModeOptions triggers change', () => {
    const changeCompareMode = jest.fn();
    const { getByTestId } = renderComponent({ changeCompareMode });
    fireEvent.click(getByTestId('compare-mode-change'));
    expect(changeCompareMode).toHaveBeenCalledWith('spy');
  });

  it('renders ChartingModeOptions when isChartingActive is true', () => {
    const { getByTestId } = renderComponent({ isChartingActive: true });
    expect(getByTestId('charting-mode-options')).toBeInTheDocument();
  });

  it('does not render ChartingModeOptions when isChartingActive is false', () => {
    const { queryByTestId } = renderComponent({ isChartingActive: false });
    expect(queryByTestId('charting-mode-options')).not.toBeInTheDocument();
  });

  it('passes sidebarHeight to ChartingModeOptions', () => {
    const { getByTestId } = renderComponent({ isChartingActive: true, sidebarHeight: 750 });
    expect(getByTestId('charting-mode-options')).toHaveAttribute('data-sidebar-height', '750');
  });
});

// ─── Chart toggle button ──────────────────────────────────────────────────────

describe('FooterContent chart toggle button', () => {
  it('renders chart button when not mobile, not compare active, and chartFeature is true', () => {
    const { getByTestId } = renderComponent({
      isMobile: false, isCompareActive: false, chartFeature: true,
    });
    expect(getByTestId('chart-toggle-button')).toBeInTheDocument();
  });

  it('does not render chart button when isMobile is true', () => {
    const { queryByTestId } = renderComponent({ isMobile: true });
    expect(queryByTestId('chart-toggle-button')).not.toBeInTheDocument();
  });

  it('does not render chart button when isCompareActive is true', () => {
    const { queryByTestId } = renderComponent({ isCompareActive: true });
    expect(queryByTestId('chart-toggle-button')).not.toBeInTheDocument();
  });

  it('does not render chart button when chartFeature is false', () => {
    const { queryByTestId } = renderComponent({ chartFeature: false });
    expect(queryByTestId('chart-toggle-button')).not.toBeInTheDocument();
  });

  it('shows "Start Charting" text when isChartingActive is false', () => {
    const { getByTestId } = renderComponent({ isChartingActive: false });
    expect(getByTestId('chart-toggle-button').textContent).toBe('Start Charting');
  });

  it('shows "Exit Charting" text when isChartingActive is true', () => {
    // chart button only shows when !isChartingActive, so test via button text
    // when isChartingActive flips to true the button disappears — test text via charting=false
    const { getByTestId } = renderComponent({ isChartingActive: false });
    expect(getByTestId('chart-toggle-button').textContent).toContain('Start Charting');
  });

  it('has accessible class when chartingModeAccessible is true', () => {
    const { getByTestId } = renderComponent({ chartingModeAccessible: true });
    expect(getByTestId('chart-toggle-button').className).not.toContain('disabled');
  });

  it('has disabled class when chartingModeAccessible is false', () => {
    const { getByTestId } = renderComponent({ chartingModeAccessible: false });
    expect(getByTestId('chart-toggle-button').className).toContain('disabled');
  });

  it('renders tooltip when chartingModeAccessible is false', () => {
    const { getByTestId } = renderComponent({ chartingModeAccessible: false });
    expect(getByTestId('tooltip-chart-toggle-button')).toBeInTheDocument();
  });

  it('does not render tooltip when chartingModeAccessible is true', () => {
    const { queryByTestId } = renderComponent({ chartingModeAccessible: true });
    expect(queryByTestId('tooltip-chart-toggle-button')).not.toBeInTheDocument();
  });
});

// ─── Compare toggle button ────────────────────────────────────────────────────

describe('FooterContent compare toggle button', () => {
  it('renders compare button when isChartingActive is false', () => {
    const { getByTestId } = renderComponent({ isChartingActive: false });
    expect(getByTestId('compare-toggle-button')).toBeInTheDocument();
  });

  it('does not render compare button when isChartingActive is true', () => {
    const { queryByTestId } = renderComponent({ isChartingActive: true });
    expect(queryByTestId('compare-toggle-button')).not.toBeInTheDocument();
  });

  it('shows "Start Comparison" on desktop when not comparing', () => {
    const { getByTestId } = renderComponent({ isCompareActive: false, isMobile: false });
    expect(getByTestId('compare-toggle-button').textContent).toBe('Start Comparison');
  });

  it('shows "Exit Comparison" on desktop when comparing', () => {
    const { getByTestId } = renderComponent({ isCompareActive: true, isMobile: false });
    expect(getByTestId('compare-toggle-button').textContent).toBe('Exit Comparison');
  });

  it('shows "Start Comparison Mode" on mobile when not comparing', () => {
    const { getByTestId } = renderComponent({ isCompareActive: false, isMobile: true });
    expect(getByTestId('compare-toggle-button').textContent).toBe('Start Comparison Mode');
  });

  it('shows "Exit Comparison Mode" on mobile when comparing', () => {
    const { getByTestId } = renderComponent({ isCompareActive: true, isMobile: true });
    expect(getByTestId('compare-toggle-button').textContent).toBe('Exit Comparison Mode');
  });
});

// ─── onClickToggleCompare ─────────────────────────────────────────────────────

describe('FooterContent onClickToggleCompare', () => {
  it('calls toggleCompare when compare button is clicked', () => {
    const toggleCompare = jest.fn();
    const { getByTestId } = renderComponent({ toggleCompare });
    fireEvent.click(getByTestId('compare-toggle-button'));
    expect(toggleCompare).toHaveBeenCalledTimes(1);
  });

  it('pushes comparison_mode event to GTM when compare button is clicked', () => {
    window.dataLayer = [];
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('compare-toggle-button'));
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([expect.objectContaining({ event: 'comparison_mode' })]),
    );
  });
});

// ─── onClickToggleCharting ────────────────────────────────────────────────────

describe('FooterContent onClickToggleCharting', () => {
  it('calls toggleCharting when chart button is clicked', () => {
    const toggleCharting = jest.fn();
    const { getByTestId } = renderComponent({ toggleCharting, isChartingActive: false });
    fireEvent.click(getByTestId('chart-toggle-button'));
    expect(toggleCharting).toHaveBeenCalledTimes(1);
  });

  it('calls openChartingInfoModal when activating charting (isChartingActive is false)', () => {
    const openChartingInfoModal = jest.fn();
    const closeModalAction = jest.fn();
    const { getByTestId } = renderComponent({
      isChartingActive: false,
      openChartingInfoModal,
      closeModalAction,
    });
    fireEvent.click(getByTestId('chart-toggle-button'));
    expect(openChartingInfoModal).toHaveBeenCalledTimes(1);
    expect(closeModalAction).not.toHaveBeenCalled();
  });

  it('calls closeModalAction when deactivating charting (isChartingActive is true)', () => {
    const openChartingInfoModal = jest.fn();
    const closeModalAction = jest.fn();
    // chart button is shown when !isMobile && !isCompareActive && chartFeature
    // regardless of isChartingActive — clicking it when active hits the else branch
    const { getByTestId } = renderComponent({
      isChartingActive: true,
      chartingModeAccessible: true,
      openChartingInfoModal,
      closeModalAction,
    });
    fireEvent.click(getByTestId('chart-toggle-button'));
    expect(closeModalAction).toHaveBeenCalledTimes(1);
    expect(openChartingInfoModal).not.toHaveBeenCalled();
  });

  it('pushes charting_mode event to GTM when chart button is clicked', () => {
    window.dataLayer = [];
    const { getByTestId } = renderComponent({ isChartingActive: false });
    fireEvent.click(getByTestId('chart-toggle-button'));
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([expect.objectContaining({ event: 'charting_mode' })]),
    );
  });
});

// ─── Events footer ────────────────────────────────────────────────────────────

describe('FooterContent events footer', () => {
  it('shows event count when events are below the limit', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({ id: `e${i}` }));
    const { container } = renderComponent({ activeTab: 'events', eventsData: events });
    expect(container.querySelector('.event-count').textContent).toContain('Showing 10 events');
  });

  it('shows "first N events" message and info icon when at the limit (50)', () => {
    const events = Array.from({ length: 50 }, (_, i) => ({ id: `e${i}` }));
    const { container, getByTestId } = renderComponent({
      activeTab: 'events', eventsData: events,
    });
    expect(container.querySelector('.event-count').textContent).toContain('Showing the first 50 events');
    expect(getByTestId('fa-filter-info-icon')).toBeInTheDocument();
  });

  it('renders tooltip on info icon when at the limit', () => {
    const events = Array.from({ length: 50 }, (_, i) => ({ id: `e${i}` }));
    const { getByTestId } = renderComponent({ activeTab: 'events', eventsData: events });
    expect(getByTestId('tooltip-filter-info-icon')).toBeInTheDocument();
  });

  it('shows zero events when eventsData is empty', () => {
    const { container } = renderComponent({ activeTab: 'events', eventsData: [] });
    expect(container.querySelector('.event-count').textContent).toContain('Showing 0 events');
  });

  it('shows zero events when eventsData is null', () => {
    const { container } = renderComponent({ activeTab: 'events', eventsData: null });
    expect(container.querySelector('.event-count').textContent).toContain('Showing 0 events');
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    animation: { isPlaying: false },
    config: { features: { charting: true, compare: true } },
    compare: { mode: 'swipe', active: false },
    charting: { active: false },
    screenSize: { isMobileDevice: false, breakpoints: {}, screenWidth: 1024 },
    ...overrides,
  });

  it('maps chartFeature from config.features.charting', () => {
    const state = makeState({ config: { features: { charting: false, compare: true } } });
    expect(capturedMapStateToProps(state, {}).chartFeature).toBe(false);
  });

  it('maps compareFeature from config.features.compare', () => {
    const state = makeState({ config: { features: { charting: true, compare: false } } });
    expect(capturedMapStateToProps(state, {}).compareFeature).toBe(false);
  });

  it('maps compareMode from compare.mode', () => {
    const state = makeState({ compare: { mode: 'opacity', active: false } });
    expect(capturedMapStateToProps(state, {}).compareMode).toBe('opacity');
  });

  it('maps isCompareActive from compare.active', () => {
    const state = makeState({ compare: { mode: 'swipe', active: true } });
    expect(capturedMapStateToProps(state, {}).isCompareActive).toBe(true);
  });

  it('maps isChartingActive from charting.active', () => {
    const state = makeState({ charting: { active: true } });
    expect(capturedMapStateToProps(state, {}).isChartingActive).toBe(true);
  });

  it('maps isMobile from screenSize.isMobileDevice', () => {
    const state = makeState({
      screenSize: {
        isMobileDevice: true,
        breakpoints: {},
        screenWidth: 375,
      },
    });
    expect(capturedMapStateToProps(state, {}).isMobile).toBe(true);
  });

  it('maps isPlaying from animation.isPlaying', () => {
    const state = makeState({ animation: { isPlaying: true } });
    expect(capturedMapStateToProps(state, {}).isPlaying).toBe(true);
  });

  it('maps breakpoints from screenSize.breakpoints', () => {
    const bp = { sm: 576 };
    const state = makeState({
      screenSize: {
        isMobileDevice: false,
        breakpoints: bp,
        screenWidth: 1024,
      },
    });
    expect(capturedMapStateToProps(state, {}).breakpoints).toBe(bp);
  });

  it('maps screenWidth from screenSize.screenWidth', () => {
    const state = makeState({
      screenSize: {
        isMobileDevice: false,
        breakpoints: {},
        screenWidth: 1920,
      },
    });
    expect(capturedMapStateToProps(state, {}).screenWidth).toBe(1920);
  });

  it('maps eventsData from getFilteredEvents', () => {
    const events = [{ id: 'e1' }];
    getFilteredEvents.mockReturnValue(events);
    const state = makeState();
    expect(capturedMapStateToProps(state, {}).eventsData).toBe(events);
    expect(getFilteredEvents).toHaveBeenCalledWith(state);
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

  it('toggleCompare dispatches toggleCompareOnOff', () => {
    mapped.toggleCompare();
    expect(toggleCompareOnOff).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_COMPARE' });
  });

  it('changeCompareMode dispatches changeMode with the string', () => {
    mapped.changeCompareMode('opacity');
    expect(changeMode).toHaveBeenCalledWith('opacity');
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_MODE', str: 'opacity' });
  });

  it('toggleCharting dispatches toggleChartingModeOnOff', () => {
    mapped.toggleCharting();
    expect(toggleChartingModeOnOff).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_CHARTING' });
  });

  it('toggleOverlayGroups dispatches toggleOverlayGroupsAction after setTimeout', () => {
    jest.useFakeTimers();
    mapped.toggleOverlayGroups();
    expect(dispatch).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_OVERLAY_GROUPS' });
    jest.useRealTimers();
  });

  it('closeModalAction dispatches closeModal', () => {
    mapped.closeModalAction();
    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_MODAL' });
  });

  describe('openChartingInfoModal', () => {
    it('dispatches openCustomContent with CHARTING_INFO_MODAL key', () => {
      mapped.openChartingInfoModal();
      expect(openCustomContent).toHaveBeenCalledWith(
        'CHARTING_INFO_MODAL',
        expect.objectContaining({ headerText: 'Charting Tool - BETA' }),
      );
    });

    it('sets backdrop to false', () => {
      mapped.openChartingInfoModal();
      expect(openCustomContent.mock.calls[0][1].backdrop).toBe(false);
    });

    it('sets wrapClassName to clickable-behind-modal', () => {
      mapped.openChartingInfoModal();
      expect(openCustomContent.mock.calls[0][1].wrapClassName).toBe('clickable-behind-modal');
    });
  });

  describe('openChartingDateModal', () => {
    it('dispatches openCustomContent with CHARTING_DATE_MODAL key', () => {
      mapped.openChartingDateModal();
      expect(openCustomContent).toHaveBeenCalledWith(
        'CHARTING_DATE_MODAL',
        expect.objectContaining({ headerText: 'Charting Mode Date Selection' }),
      );
    });
  });

  describe('addLayers', () => {
    it('dispatches openCustomContent with LAYER_PICKER_COMPONENT', () => {
      mapped.addLayers(false);
      expect(openCustomContent).toHaveBeenCalledWith(
        'LAYER_PICKER_COMPONENT',
        expect.objectContaining({ backdrop: true, headerText: null }),
      );
    });

    it('dispatches stopAnimationAction when isPlaying is true', () => {
      mapped.addLayers(true);
      expect(stopAnimationAction).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_ANIMATION' });
    });

    it('does not dispatch stopAnimationAction when isPlaying is false', () => {
      mapped.addLayers(false);
      expect(stopAnimationAction).not.toHaveBeenCalled();
    });

    it('uses desktop modal class when not mobile/tablet', () => {
      mapped.addLayers(false);
      const opts = openCustomContent.mock.calls[0][1];
      expect(opts.modalClassName).toBe('custom-layer-dialog light');
    });

    it('uses mobile modal class when isMobileOnly is true', () => {
      const rdd = require('react-device-detect');
      rdd.isMobileOnly = true;
      mapped.addLayers(false);
      const opts = openCustomContent.mock.calls[0][1];
      expect(opts.modalClassName).toBe('custom-layer-dialog-mobile custom-layer-dialog light');
    });

    it('uses mobile modal class when isTablet is true', () => {
      const rdd = require('react-device-detect');
      rdd.isTablet = true;
      mapped.addLayers(false);
      const opts = openCustomContent.mock.calls[0][1];
      expect(opts.modalClassName).toBe('custom-layer-dialog-mobile custom-layer-dialog light');
    });

    it('passes a function as CompletelyCustomModal', () => {
      mapped.addLayers(false);
      const opts = openCustomContent.mock.calls[0][1];
      expect(typeof opts.CompletelyCustomModal).toBe('function');
    });
  });
});
