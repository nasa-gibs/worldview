/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

let mockCapturedAlerts = [];
jest.mock('../components/util/alert', () => (props) => {
  mockCapturedAlerts.push(props);
  return <div data-testid="alert" data-message={props.message} />;
});

jest.mock('../modules/modal/actions', () => ({
  openCustomContent: jest.fn((id, params) => ({ type: 'OPEN_CUSTOM_CONTENT', id, params })),
}));

jest.mock('../modules/layers/util', () => ({
  hasVectorLayers: jest.fn(() => false),
}));

jest.mock('../modules/alerts/constants', () => ({
  DISABLE_VECTOR_ZOOM_ALERT: 'DISABLE_VECTOR_ZOOM_ALERT',
  DISABLE_VECTOR_EXCEEDED_ALERT: 'DISABLE_VECTOR_EXCEEDED_ALERT',
  MODAL_PROPERTIES: {
    eventModalProps: { id: 'event_modal', props: { event: true } },
    compareModalProps: { id: 'compare_modal', props: { compare: true } },
    vectorModalProps: { id: 'vector_modal', props: { vector: true } },
    granuleModalProps: { id: 'granule_modal', props: { granule: true } },
    zoomModalProps: { id: 'zoom_modal', props: { zoom: true } },
  },
}));

jest.mock('../util/local-storage', () => ({
  __esModule: true,
  default: {
    enabled: true,
    keys: {
      DISMISSED_COMPARE_ALERT: 'DISMISSED_COMPARE_ALERT',
      DISMISSED_DISTRACTION_FREE_ALERT: 'DISMISSED_DISTRACTION_FREE_ALERT',
      DISMISSED_EVENT_VIS_ALERT: 'DISMISSED_EVENT_VIS_ALERT',
      DISSMISSED_DDV_ZOOM_ALERT: 'DISSMISSED_DDV_ZOOM_ALERT',
      DISSMISSED_DDV_LOCATION_ALERT: 'DISSMISSED_DDV_LOCATION_ALERT',
    },
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
  },
}));

jest.mock('../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => []),
  subdailyLayersActive: jest.fn(() => false),
}));

const DismissableAlerts = require('./alerts').default;
const safeLocalStorage = require('../util/local-storage').default;
const { openCustomContent } = require('../modules/modal/actions');
const { hasVectorLayers } = require('../modules/layers/util');
const { getActiveLayers, subdailyLayersActive } = require('../modules/layers/selectors');

const defaultProps = {
  ddvZoomAlerts: [],
  ddvLocationAlerts: [],
  dismissVectorZoomAlert: jest.fn(),
  dismissVectorExceededAlert: jest.fn(),
  hasSubdailyLayers: false,
  isAnimationActive: false,
  isCompareActive: false,
  isDistractionFreeModeActive: false,
  isEmbedModeActive: false,
  isEventsActive: false,
  isSmall: false,
  isMobile: false,
  isVectorZoomAlertPresent: false,
  isVectorExceededAlertPresent: false,
  isDDVZoomAlertPresent: false,
  isDDVLocationAlertPresent: false,
  openAlertModal: jest.fn(),
  openGranuleAlertModal: jest.fn(),
  openZoomAlertModal: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <DismissableAlerts {...defaultProps} {...props} />,
);

const findAlert = (message) => mockCapturedAlerts.find((a) => a.message.includes(message));

beforeEach(() => {
  jest.clearAllMocks();
  mockCapturedAlerts = [];
  safeLocalStorage.getItem.mockReturnValue(null);
});

describe('DismissableAlerts render', () => {
  it('renders nothing when no alerts are present', () => {
    const { container } = renderComponent();
    expect(container.querySelectorAll('[data-testid="alert"]')).toHaveLength(0);
  });

  it('returns null in embed mode', () => {
    const { container } = renderComponent({ isEmbedModeActive: true, isEventsActive: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when distraction free mode is active on initial load', () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the distraction free alert after leaving and re-entering', () => {
    const { rerender } = renderComponent({ isDistractionFreeModeActive: true });
    // leaving distraction free mode clears the init load flag
    act(() => {
      rerender(<DismissableAlerts {...defaultProps} isDistractionFreeModeActive={false} />);
    });
    mockCapturedAlerts = [];
    act(() => {
      rerender(<DismissableAlerts {...defaultProps} isDistractionFreeModeActive />);
    });
    const alert = findAlert('distraction free mode');
    expect(alert).toBeDefined();
    act(() => { alert.onDismiss(); });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('DISMISSED_DISTRACTION_FREE_ALERT', true);
  });

  it('shows the events alert and supports click and dismiss', () => {
    const openAlertModal = jest.fn();
    renderComponent({ isEventsActive: true, openAlertModal });
    const alert = findAlert('Events may not be visible');
    expect(alert).toBeDefined();
    alert.onClick();
    expect(openAlertModal).toHaveBeenCalledWith({ id: 'event_modal', props: { event: true } });
    act(() => { alert.onDismiss(); });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('DISMISSED_EVENT_VIS_ALERT', true);
    expect(mockCapturedAlerts.filter((a) => a.message.includes('Events may not'))).toHaveLength(1);
  });

  it('does not show the events alert when previously dismissed', () => {
    safeLocalStorage.getItem.mockReturnValue('true');
    renderComponent({ isEventsActive: true });
    expect(findAlert('Events may not be visible')).toBeUndefined();
  });

  it('does not show events or compare alerts on small screens', () => {
    renderComponent({ isEventsActive: true, isCompareActive: true, isSmall: true });
    expect(mockCapturedAlerts).toHaveLength(0);
  });

  it('shows the compare alert with click and dismiss', () => {
    const openAlertModal = jest.fn();
    renderComponent({ isCompareActive: true, openAlertModal });
    const alert = findAlert('comparison mode');
    expect(alert).toBeDefined();
    alert.onClick();
    expect(openAlertModal).toHaveBeenCalledWith({ id: 'compare_modal', props: { compare: true } });
    act(() => { alert.onDismiss(); });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('DISMISSED_COMPARE_ALERT', true);
  });

  it('shows the vector zoom alert with dismiss callback from props', () => {
    const dismissVectorZoomAlert = jest.fn();
    const openAlertModal = jest.fn();
    renderComponent({ isVectorZoomAlertPresent: true, dismissVectorZoomAlert, openAlertModal });
    const alert = findAlert('Vector features may not be clickable');
    alert.onClick();
    expect(openAlertModal).toHaveBeenCalledWith({ id: 'vector_modal', props: { vector: true } });
    alert.onDismiss();
    expect(dismissVectorZoomAlert).toHaveBeenCalled();
  });

  it('shows the vector exceeded alert', () => {
    const dismissVectorExceededAlert = jest.fn();
    renderComponent({ isVectorExceededAlertPresent: true, dismissVectorExceededAlert });
    const alert = findAlert('Too many results');
    alert.onDismiss();
    expect(dismissVectorExceededAlert).toHaveBeenCalled();
  });

  it('shows the animation data alert on mobile with subdaily layers', () => {
    renderComponent({ isMobile: true, isAnimationActive: true, hasSubdailyLayers: true });
    const alert = findAlert('large amount of data');
    expect(alert).toBeDefined();
    alert.onDismiss();
  });

  it('shows DDV zoom alerts per layer', () => {
    const openZoomAlertModal = jest.fn();
    renderComponent({
      isDDVZoomAlertPresent: true,
      ddvZoomAlerts: ['Layer One', 'Layer Two'],
      openZoomAlertModal,
    });
    const zoomAlerts = mockCapturedAlerts.filter((a) => a.message.includes('zoom level'));
    expect(zoomAlerts).toHaveLength(2);
    expect(zoomAlerts[0].onClick).toBe(openZoomAlertModal);
    act(() => { zoomAlerts[0].onDismiss(); });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('DISSMISSED_DDV_ZOOM_ALERT', true);
  });

  it('shows DDV location alerts per layer', () => {
    const openGranuleAlertModal = jest.fn();
    renderComponent({
      isDDVLocationAlertPresent: true,
      ddvLocationAlerts: ['Layer Three'],
      openGranuleAlertModal,
    });
    const locationAlerts = mockCapturedAlerts.filter((a) => a.message.includes('location or date'));
    expect(locationAlerts).toHaveLength(1);
    expect(locationAlerts[0].onClick).toBe(openGranuleAlertModal);
    act(() => { locationAlerts[0].onDismiss(); });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('DISSMISSED_DDV_LOCATION_ALERT', true);
  });
});

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    embed: { isEmbedModeActive: false },
    events: { selected: { id: 'event1' } },
    sidebar: { activeTab: 'events' },
    compare: { active: true },
    alerts: {
      isVectorZoomAlertPresent: true,
      isVectorExceededAlertPresent: true,
      isDDVZoomAlertPresent: false,
      isDDVLocationAlertPresent: false,
      ddvZoomAlerts: [],
      ddvLocationAlerts: [],
    },
    ui: { isDistractionFreeModeActive: false },
    animation: { isActive: false },
    screenSize: { screenWidth: 1200, breakpoints: { small: 740 }, isMobileDevice: false },
    ...overrides,
  });

  it('maps alert state with vector layers present', () => {
    hasVectorLayers.mockReturnValue(true);
    const result = capturedMapState(makeState());
    expect(result.isEventsActive).toBe(true);
    expect(result.isCompareActive).toBe(true);
    expect(result.isVectorZoomAlertPresent).toBe(true);
    expect(result.isVectorExceededAlertPresent).toBe(true);
    expect(result.isSmall).toBe(false);
    expect(getActiveLayers).toHaveBeenCalled();
    expect(subdailyLayersActive).toHaveBeenCalled();
  });

  it('vector alerts are false without active vector layers', () => {
    hasVectorLayers.mockReturnValue(false);
    const result = capturedMapState(makeState());
    expect(result.isVectorZoomAlertPresent).toBe(false);
    expect(result.isVectorExceededAlertPresent).toBe(false);
  });

  it('isEventsActive is false when no event selected', () => {
    const result = capturedMapState(makeState({ events: { selected: {} } }));
    expect(result.isEventsActive).toBe(false);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('openAlertModal dispatches openCustomContent with given props', () => {
    props.openAlertModal({ id: 'my_modal', props: { a: 1 } });
    expect(openCustomContent).toHaveBeenCalledWith('my_modal', { a: 1 });
  });

  it('openGranuleAlertModal uses granule modal props', () => {
    props.openGranuleAlertModal();
    expect(openCustomContent).toHaveBeenCalledWith('granule_modal', { granule: true });
  });

  it('openZoomAlertModal uses zoom modal props', () => {
    props.openZoomAlertModal();
    expect(openCustomContent).toHaveBeenCalledWith('zoom_modal', { zoom: true });
  });

  it('dismiss actions dispatch the disable types', () => {
    props.dismissVectorZoomAlert();
    expect(dispatch).toHaveBeenCalledWith({ type: 'DISABLE_VECTOR_ZOOM_ALERT' });
    props.dismissVectorExceededAlert();
    expect(dispatch).toHaveBeenCalledWith({ type: 'DISABLE_VECTOR_EXCEEDED_ALERT' });
  });
});
