/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import {
  render, fireEvent, act, waitFor,
} from '@testing-library/react';
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

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <i data-icon={String(props.icon)} />,
}));

jest.mock('./image-download', () => () => <div />);
jest.mock('./projection', () => () => <div />);
jest.mock('./info', () => () => <div />);
jest.mock('./share', () => () => <div />);
jest.mock('./error-boundary', () => ({ children }) => <div>{children}</div>);
jest.mock('../components/util/hover-tooltip', () => () => <span data-testid="hover-tooltip" />);
jest.mock('../components/image-download/notify', () => () => <div />);
jest.mock('../components/location-search/location-search', () => () => <div />);
jest.mock('../components/about/about', () => () => <div />);

jest.mock('../modules/modal/actions', () => ({
  openCustomContent: jest.fn((id, params) => ({ type: 'OPEN_CUSTOM_CONTENT', id, params })),
  onToggle: jest.fn(() => ({ type: 'MODAL_TOGGLE' })),
  toggleAboutModal: jest.fn((isOpen) => ({ type: 'TOGGLE_ABOUT_MODAL', isOpen })),
}));

jest.mock('../modules/ui/actions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ type: 'TOGGLE_DISTRACTION_FREE' })),
}));

jest.mock('../modules/notifications/actions', () => ({
  requestNotifications: jest.fn((location) => ({ type: 'REQUEST_NOTIFICATIONS', location })),
  setNotifications: jest.fn((notifications) => ({ type: 'SET_NOTIFICATIONS', notifications })),
}));

jest.mock('../modules/palettes/actions', () => ({
  clearCustomsSnapshot: jest.fn(() => ({ type: 'CLEAR_CUSTOMS_SNAPSHOT' })),
  refreshPalettes: jest.fn((palettes) => ({ type: 'REFRESH_PALETTES', palettes })),
}));

jest.mock('../modules/map/actions', () => ({
  clearRotate: jest.fn(() => ({ type: 'CLEAR_ROTATE' })),
  refreshRotation: jest.fn((rotation) => ({ type: 'REFRESH_ROTATION', rotation })),
}));

jest.mock('../modules/layers/actions', () => ({
  showLayers: jest.fn((layers) => ({ type: 'SHOW_LAYERS', layers })),
  hideLayers: jest.fn((layers) => ({ type: 'HIDE_LAYERS', layers })),
}));

jest.mock('../modules/image-download/constants', () => ({
  notificationWarnings: {
    palette: 'palette-warning',
    rotate: 'rotate-warning',
  },
}));

jest.mock('../modules/palettes/util', () => ({
  hasCustomPaletteInActiveProjection: jest.fn(() => false),
}));

jest.mock('../modules/location-search/actions', () => ({
  toggleShowLocationSearch: jest.fn(() => ({ type: 'TOGGLE_SHOW_LOCATION_SEARCH' })),
  toggleDialogVisible: jest.fn((visible) => ({ type: 'TOGGLE_DIALOG_VISIBLE', visible })),
}));

jest.mock('../modules/location-search/util', () => ({
  isLocationSearchFeatureEnabled: jest.fn(() => true),
}));

jest.mock('../modules/layers/selectors', () => ({
  getAllActiveLayers: jest.fn(() => []),
}));

jest.mock('../modules/image-download/util', () => ({
  hasNonDownloadableVisibleLayer: jest.fn(() => false),
  getNonDownloadableLayerWarning: jest.fn(() => 'non-downloadable-warning'),
  getNonDownloadableLayers: jest.fn(() => [{ id: 'bad-layer' }]),
}));

const ToolbarContainer = require('./toolbar').default;
const {
  openCustomContent,
  onToggle,
  toggleAboutModal,
} = require('../modules/modal/actions');
const {
  requestNotifications: requestNotificationsAction,
  setNotifications,
} = require('../modules/notifications/actions');
const { clearCustomsSnapshot, refreshPalettes } = require('../modules/palettes/actions');
const { clearRotate, refreshRotation } = require('../modules/map/actions');
const { showLayers, hideLayers } = require('../modules/layers/actions');
const { hasCustomPaletteInActiveProjection } = require('../modules/palettes/util');
const { isLocationSearchFeatureEnabled } = require('../modules/location-search/util');
const { getAllActiveLayers } = require('../modules/layers/selectors');
const { hasNonDownloadableVisibleLayer, getNonDownloadableLayers } = require('../modules/image-download/util');

const defaultProps = {
  activePalettes: {},
  config: { features: {}, parameters: {}, ui: { projections: {} } },
  faSize: '1x',
  hasCustomPalette: false,
  hasNonDownloadableLayer: false,
  isAboutOpen: false,
  isCompareActive: false,
  isChartingActive: false,
  isDistractionFreeModeActive: false,
  isKioskModeActive: false,
  isLocationSearchExpanded: false,
  isImageDownloadActive: true,
  isProjectionSwitchActive: true,
  isMobile: false,
  isRotated: false,
  modalIsOpen: false,
  notificationContentNumber: 0,
  notificationType: '',
  notify: jest.fn(() => Promise.resolve()),
  openModal: jest.fn(),
  openAboutModal: jest.fn(),
  refreshStateAfterImageDownload: jest.fn(),
  requestNotifications: jest.fn(),
  rotation: 0,
  shouldBeCollapsed: false,
  toggleDialogVisible: jest.fn(),
  toggleDistractionFreeModeAction: jest.fn(),
  toggleShowLocationSearch: jest.fn(),
  visibleLayersForProj: [],
};

const renderComponent = (props = {}) => render(
  <ToolbarContainer {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  isLocationSearchFeatureEnabled.mockReturnValue(true);
});

describe('toolbar buttons', () => {
  it('renders all main buttons', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#wv-share-button')).toBeInTheDocument();
    expect(container.querySelector('#wv-proj-button')).toBeInTheDocument();
    expect(container.querySelector('#wv-image-button')).toBeInTheDocument();
    expect(container.querySelector('#wv-info-button')).toBeInTheDocument();
    expect(container.querySelector('#wv-location-search-button')).toBeInTheDocument();
    expect(container.querySelector('#wv-exit-distraction-free-mode-button')).toBeNull();
  });

  it('hides buttons and shows the exit button in distraction free mode', () => {
    const { container } = renderComponent({ isDistractionFreeModeActive: true });
    expect(container.querySelector('#wv-share-button')).toBeNull();
    expect(container.querySelector('#wv-proj-button')).toBeNull();
    expect(container.querySelector('#wv-exit-distraction-free-mode-button')).toBeInTheDocument();
  });

  it('hides the exit distraction free button in kiosk mode', () => {
    const { container } = renderComponent({
      isDistractionFreeModeActive: true,
      isKioskModeActive: true,
    });
    expect(container.querySelector('#wv-exit-distraction-free-mode-button')).toBeNull();
  });

  it('exit distraction free button toggles distraction free mode', () => {
    const toggleDistractionFreeModeAction = jest.fn();
    const { container } = renderComponent({
      isDistractionFreeModeActive: true,
      toggleDistractionFreeModeAction,
    });
    fireEvent.click(container.querySelector('#wv-exit-distraction-free-mode-button'));
    expect(toggleDistractionFreeModeAction).toHaveBeenCalled();
  });

  it('share button opens the share modal', () => {
    const openModal = jest.fn();
    const { container } = renderComponent({ openModal });
    fireEvent.click(container.querySelector('#wv-share-button'));
    expect(openModal).toHaveBeenCalledWith('TOOLBAR_SHARE', expect.objectContaining({
      headerText: 'Share',
    }));
  });

  it('projection button opens the projection modal', () => {
    const openModal = jest.fn();
    const { container } = renderComponent({ openModal });
    fireEvent.click(container.querySelector('#wv-proj-button'));
    expect(openModal).toHaveBeenCalledWith('TOOLBAR_PROJECTION', expect.anything());
  });

  it('projection button is hidden without config.ui.projections', () => {
    const { container } = renderComponent({ config: { features: {}, parameters: {} } });
    expect(container.querySelector('#wv-proj-button')).toBeNull();
  });

  it('projection button is disabled when projection switching is inactive', () => {
    const { container } = renderComponent({ isProjectionSwitchActive: false });
    expect(container.querySelector('#wv-proj-button')).toBeDisabled();
  });

  it('info button opens the info modal', () => {
    const openModal = jest.fn();
    const { container } = renderComponent({ openModal });
    fireEvent.click(container.querySelector('#wv-info-button'));
    expect(openModal).toHaveBeenCalledWith('TOOLBAR_INFO', expect.anything());
  });

  it('info button shows the notification status class', () => {
    const { container } = renderComponent({ notificationType: 'alert', notificationContentNumber: 4 });
    const btn = container.querySelector('#wv-info-button');
    expect(btn.className).toContain('wv-status-alert');
    expect(btn.getAttribute('data-content')).toBe('4');
  });

  it('snapshot button is disabled when image download is inactive', () => {
    const { container } = renderComponent({ isImageDownloadActive: false });
    expect(container.querySelector('#wv-image-button')).toBeDisabled();
  });
});

describe('location search button', () => {
  it('is not rendered when the feature is disabled', () => {
    isLocationSearchFeatureEnabled.mockReturnValue(false);
    const { container } = renderComponent();
    expect(container.querySelector('#wv-location-search-button')).toBeNull();
  });

  it('toggles the search bar on desktop', () => {
    const toggleShowLocationSearch = jest.fn();
    const { container } = renderComponent({ toggleShowLocationSearch });
    fireEvent.click(container.querySelector('#wv-location-search-button'));
    expect(toggleShowLocationSearch).toHaveBeenCalled();
  });

  it('opens the mobile modal on mobile', () => {
    const openModal = jest.fn();
    const { container } = renderComponent({ isMobile: true, openModal });
    fireEvent.click(container.querySelector('#wv-location-search-button'));
    expect(openModal).toHaveBeenCalledWith('TOOLBAR_LOCATION_SEARCH_MOBILE', expect.anything());
  });

  it('is hidden on desktop when search is expanded and not collapsed', () => {
    const { container } = renderComponent({ isLocationSearchExpanded: true });
    expect(container.querySelector('#wv-location-search-button')).toBeNull();
  });
});

describe('snapshot workflow (openImageDownload)', () => {
  it('opens the snapshot modal directly with no special conditions', async () => {
    const openModal = jest.fn();
    const toggleDialogVisible = jest.fn();
    const refreshStateAfterImageDownload = jest.fn();
    const { container } = renderComponent({
      openModal, toggleDialogVisible, refreshStateAfterImageDownload,
    });
    await act(async () => {
      fireEvent.click(container.querySelector('#wv-image-button'));
    });
    expect(toggleDialogVisible).toHaveBeenCalledWith(false);
    expect(openModal).toHaveBeenCalledWith('TOOLBAR_SNAPSHOT', expect.objectContaining({
      headerText: 'Take a Snapshot',
      onClose: expect.any(Function),
    }));
    const { onClose } = openModal.mock.calls.at(-1)[1];
    onClose();
    expect(refreshStateAfterImageDownload).toHaveBeenCalledWith(undefined, 0, null);
  });

  it('notifies before opening when palettes, rotation and layers need resets', async () => {
    const notify = jest.fn(() => Promise.resolve());
    const openModal = jest.fn();
    const refreshStateAfterImageDownload = jest.fn();
    const activePalettes = { layer: { id: 'p' } };
    const { container } = renderComponent({
      notify,
      openModal,
      refreshStateAfterImageDownload,
      hasCustomPalette: true,
      isRotated: true,
      rotation: 45,
      hasNonDownloadableLayer: true,
      activePalettes,
      visibleLayersForProj: [{ id: 'vl' }],
    });
    await act(async () => {
      fireEvent.click(container.querySelector('#wv-image-button'));
    });
    expect(notify).toHaveBeenCalledTimes(3);
    expect(notify).toHaveBeenCalledWith('palette', clearCustomsSnapshot, [{ id: 'vl' }]);
    expect(notify).toHaveBeenCalledWith('rotate', clearRotate, [{ id: 'vl' }]);
    expect(notify).toHaveBeenCalledWith('layers', hideLayers, [{ id: 'vl' }]);
    const { onClose } = openModal.mock.calls.at(-1)[1];
    onClose();
    expect(refreshStateAfterImageDownload).toHaveBeenCalledWith(
      activePalettes, 45, [{ id: 'bad-layer' }],
    );
  });
});

describe('notification requests', () => {
  it('does not request notifications without the feature flag', () => {
    const requestNotifications = jest.fn();
    renderComponent({ requestNotifications });
    expect(requestNotifications).not.toHaveBeenCalled();
  });

  it('requests UAT notifications on test domains', () => {
    const requestNotifications = jest.fn();
    renderComponent({
      requestNotifications,
      config: {
        features: { notification: { url: 'https://status.nasa.gov' } },
        parameters: {},
      },
    });
    // jsdom origin is localhost, a test domain
    expect(requestNotifications).toHaveBeenCalledWith('https://status.nasa.gov?client=Worldview%20(UAT)');
  });

  it('uses mock alerts parameter when configured', () => {
    const requestNotifications = jest.fn();
    renderComponent({
      requestNotifications,
      config: {
        features: { notification: { url: 'https://status.nasa.gov' } },
        parameters: { mockAlerts: 'all' },
      },
    });
    expect(requestNotifications).toHaveBeenCalledWith('mock/notify_all.json');
  });

  it('uses notificationURL parameter when configured', () => {
    const requestNotifications = jest.fn();
    renderComponent({
      requestNotifications,
      config: {
        features: { notification: { url: 'https://status.nasa.gov' } },
        parameters: { notificationURL: 'custom.domain' },
      },
    });
    expect(requestNotifications).toHaveBeenCalledWith('https://status.nasa.gov?domain=custom.domain');
  });
});

describe('about modal lifecycle', () => {
  it('opens the about modal on mount when isAboutOpen', () => {
    const openAboutModal = jest.fn();
    renderComponent({ isAboutOpen: true, openAboutModal });
    expect(openAboutModal).toHaveBeenCalled();
  });

  it('re-opens the about modal when the modal open state changes', () => {
    const openAboutModal = jest.fn();
    const { rerender } = renderComponent({ isAboutOpen: true, openAboutModal });
    openAboutModal.mockClear();
    rerender(
      <ToolbarContainer
        {...defaultProps}
        isAboutOpen
        openAboutModal={openAboutModal}
        modalIsOpen
      />,
    );
    expect(openAboutModal).toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    animation: { gifActive: false },
    compare: { active: false, activeString: 'active' },
    charting: { active: false },
    events: { isAnimatingToEvent: false },
    locationSearch: { isExpanded: false },
    map: { rotation: 0, ui: { selected: {} } },
    measure: { isActive: false },
    modal: { isOpen: false, id: null },
    modalAbout: { isOpen: false },
    notifications: { numberUnseen: 2, type: 'alert' },
    palettes: { active: { p: 1 } },
    proj: { id: 'geographic' },
    screenSize: { isMobileDevice: false },
    sidebar: { activeTab: 'layers' },
    ui: { isDistractionFreeModeActive: false, isKioskModeActive: false },
    config: { features: {} },
    ...overrides,
  });

  it('maps toolbar state for desktop', () => {
    const result = capturedMapState(makeState());
    expect(result.faSize).toBe('1x');
    expect(result.isImageDownloadActive).toBe(true);
    expect(result.isProjectionSwitchActive).toBe(true);
    expect(result.isRotated).toBe(false);
    expect(result.notificationType).toBe('alert');
    expect(result.notificationContentNumber).toBe(2);
    expect(result.shouldBeCollapsed).toBe(false);
    expect(getAllActiveLayers).toHaveBeenCalled();
    expect(hasNonDownloadableVisibleLayer).toHaveBeenCalled();
    expect(hasCustomPaletteInActiveProjection).toHaveBeenCalled();
  });

  it('uses 2x icons on mobile', () => {
    const result = capturedMapState(makeState({ screenSize: { isMobileDevice: true } }));
    expect(result.faSize).toBe('2x');
  });

  it('disables image download in compare mode', () => {
    const result = capturedMapState(makeState({ compare: { active: true, activeString: 'active' } }));
    expect(result.isImageDownloadActive).toBe(false);
  });

  it('disables image download when the download tab is active', () => {
    const result = capturedMapState(makeState({ sidebar: { activeTab: 'download' } }));
    expect(result.isImageDownloadActive).toBe(false);
  });

  it('disables projection switching while animating to an event', () => {
    const result = capturedMapState(makeState({ events: { isAnimatingToEvent: true } }));
    expect(result.isProjectionSwitchActive).toBe(false);
  });

  it('collapses when the snapshot modal is open', () => {
    const result = capturedMapState(makeState({ modal: { isOpen: true, id: 'TOOLBAR_SNAPSHOT' } }));
    expect(result.shouldBeCollapsed).toBe(true);
  });

  it('detects rotation', () => {
    const result = capturedMapState(makeState({ map: { rotation: 30, ui: { selected: {} } } }));
    expect(result.isRotated).toBe(true);
    expect(result.rotation).toBe(30);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('toggleDistractionFreeModeAction dispatches the toggle', () => {
    props.toggleDistractionFreeModeAction();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DISTRACTION_FREE' });
  });

  it('toggleDialogVisible dispatches visibility', () => {
    props.toggleDialogVisible(false);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DIALOG_VISIBLE', visible: false });
  });

  it('toggleShowLocationSearch dispatches the toggle', () => {
    props.toggleShowLocationSearch();
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_SHOW_LOCATION_SEARCH' });
  });

  it('refreshStateAfterImageDownload restores palettes, rotation and layers', () => {
    props.refreshStateAfterImageDownload({ p: 1 }, 99, [{ id: 'l' }]);
    expect(refreshPalettes).toHaveBeenCalledWith({ p: 1 });
    expect(refreshRotation).toHaveBeenCalledWith(99);
    expect(showLayers).toHaveBeenCalledWith([{ id: 'l' }]);
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it('refreshStateAfterImageDownload skips falsy values', () => {
    props.refreshStateAfterImageDownload(undefined, 0, null);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('openModal dispatches openCustomContent', () => {
    props.openModal('SOME_KEY', { a: 1 });
    expect(openCustomContent).toHaveBeenCalledWith('SOME_KEY', { a: 1 });
  });

  it('openAboutModal opens the about modal and toggles on close', () => {
    props.openAboutModal();
    expect(openCustomContent).toHaveBeenCalledWith('ABOUT_MODAL', expect.objectContaining({
      headerText: 'About',
    }));
    const { onClose } = openCustomContent.mock.calls.at(-1)[1];
    onClose();
    expect(toggleAboutModal).toHaveBeenCalledWith(false);
  });

  it('notify opens a confirmation modal and resolves on accept', async () => {
    const promise = props.notify('palette', clearCustomsSnapshot, []);
    expect(openCustomContent).toHaveBeenCalledWith('image_download_notify_palette', expect.objectContaining({
      headerText: 'Notify',
    }));
    const { bodyComponentProps } = openCustomContent.mock.calls.at(-1)[1];
    expect(bodyComponentProps.bodyText).toBe('palette-warning');
    bodyComponentProps.cancel();
    expect(onToggle).toHaveBeenCalled();
    bodyComponentProps.accept();
    expect(clearCustomsSnapshot).toHaveBeenCalled();
    await promise;
  });

  it('notify uses the non-downloadable layer warning for layer type', () => {
    props.notify('layers', hideLayers, [{ id: 'vl' }]);
    const { bodyComponentProps } = openCustomContent.mock.calls.at(-1)[1];
    expect(getNonDownloadableLayers).toHaveBeenCalledWith([{ id: 'vl' }]);
    expect(bodyComponentProps.bodyText).toBe('non-downloadable-warning');
    bodyComponentProps.accept();
    expect(hideLayers).toHaveBeenCalledWith([{ id: 'bad-layer' }]);
  });

  it('requestNotifications dispatches and stores returned notifications', async () => {
    dispatch.mockReturnValueOnce(Promise.resolve('{"notifications": [{"id": 1}]}'));
    props.requestNotifications('some/url');
    expect(requestNotificationsAction).toHaveBeenCalledWith('some/url');
    await waitFor(() => {
      expect(setNotifications).toHaveBeenCalledWith([{ id: 1 }]);
    });
  });

  it('requestNotifications ignores responses without notifications', async () => {
    dispatch.mockReturnValueOnce(Promise.resolve('{}'));
    props.requestNotifications('some/url');
    await act(async () => {});
    expect(setNotifications).not.toHaveBeenCalled();
  });
});
