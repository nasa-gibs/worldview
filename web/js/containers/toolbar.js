import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ButtonToolbar, Button } from 'reactstrap';
import {
  get as lodashGet,
  filter as lodashFilter,
} from 'lodash';
import Promise from 'bluebird';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { openCustomContent, onToggle, toggleAboutModal } from '../modules/modal/actions';
import toggleDistractionFreeMode from '../modules/ui/actions';
import ImageDownload from './image-download';
import Projection from './projection';
import InfoList from './info';
import Share from './share';
import HoverTooltip from '../components/util/hover-tooltip';
import ErrorBoundary from './error-boundary';
import {
  requestNotifications as requestNotificationsAction,
  setNotifications,
} from '../modules/notifications/actions';
import { refreshPalettes } from '../modules/palettes/actions';
import { clearRotate, refreshRotation } from '../modules/map/actions';
import {
  showLayers, hideLayers,
} from '../modules/layers/actions';
import { notificationWarnings } from '../modules/image-download/constants';
import Notify from '../components/image-download/notify';
import LocationSearch from '../components/location-search/location-search';
import {
  toggleShowLocationSearch as toggleShowLocationSearchAction,
  toggleDialogVisible as toggleDialogVisibleAction,
} from '../modules/location-search/actions';
import { isLocationSearchFeatureEnabled } from '../modules/location-search/util';
import { getAllActiveLayers } from '../modules/layers/selectors';
import { hasNonDownloadableVisibleLayer, getNonDownloadableLayerWarning, getNonDownloadableLayers } from '../modules/image-download/util';
import AboutModal from '../components/about/about';
import usePrevious from '../util/customHooks';

Promise.config({ cancellation: true });

const CUSTOM_MODAL_PROPS = {
  TOOLBAR_PROJECTION: {
    headerText: null,
    type: 'toolbar',
    modalClassName: 'toolbar-list-modal toolbar-projection-modal toolbar-modal',
    backdrop: false,
    bodyComponent: Projection,
    wrapClassName: 'toolbar_modal_outer toolbar_modal_outer',
  },
  TOOLBAR_SHARE: {
    headerText: 'Share',
    type: 'toolbar',
    backdrop: false,
    modalClassName: 'toolbar-share-modal toolbar-modal toolbar-medium-modal',
    clickableBehindModal: true,
    wrapClassName: 'toolbar_modal_outer',
    bodyComponent: Share,
  },
  TOOLBAR_INFO: {
    headerText: null,
    backdrop: false,
    type: 'toolbar',
    modalClassName: 'toolbar-list-modal toolbar-info-modal toolbar-modal',
    bodyComponent: InfoList,
    wrapClassName: 'toolbar_modal_outer toolbar_modal_outer',
  },
  TOOLBAR_SNAPSHOT: {
    headerText: 'Take a Snapshot',
    backdrop: false,
    wrapClassName: 'toolbar_modal_outer',
    type: 'selection',
    modalClassName: 'toolbar-snapshot-modal toolbar-modal toolbar-medium-modal',
    bodyComponent: ImageDownload,
    desktopOnly: true,
    clickableBehindModal: true,
  },
  TOOLBAR_LOCATION_SEARCH_MOBILE: {
    backdrop: false,
    bodyComponent: LocationSearch,
    clickableBehindModal: true,
    headerText: 'Search for places',
    mobileOnly: true,
    modalClassName: 'toolbar-location-search-modal toolbar-modal toolbar-medium-modal',
    type: 'toolbar',
    wrapClassName: 'toolbar_modal_outer',
  },
};

function toolbarContainer(props) {
  const {
    isAboutOpen,
    openAboutModal,
    modalIsOpen,
    visibleLayersForProj,
    notify,
    openModal,
    isRotated,
    rotation,
    refreshStateAfterImageDownload,
    toggleDialogVisible,
    hasNonDownloadableLayer,
    config,
    requestNotifications,
    isMobile,
    faSize,
    isDistractionFreeModeActive,
    isProjectionSwitchActive,
    isChartingActive,
    isLocationSearchExpanded,
    shouldBeCollapsed,
    toggleShowLocationSearch,
    isImageDownloadActive,
    isCompareActive,
    notificationType,
    notificationContentNumber,
    toggleDistractionFreeModeAction,
    isKioskModeActive,
  } = props;

  const prevModalIsOpen = usePrevious(modalIsOpen);

  useEffect(() => {
    requestNotificationsFunc();
    if (isAboutOpen) {
      openAboutModal();
    }
  }, []);

  useEffect(() => {
    if (modalIsOpen !== prevModalIsOpen) {
      if (isAboutOpen) {
        openAboutModal();
      }
    }
  }, [modalIsOpen, isAboutOpen]);

  function getPromise(bool, type, action, title) {
    if (bool) {
      return notify(type, action, visibleLayersForProj);
    }
    return Promise.resolve(type);
  }

  async function openImageDownload() {
    const nonDownloadableLayers = hasNonDownloadableLayer
      ? getNonDownloadableLayers(visibleLayersForProj, true)
      : null;
    toggleDialogVisible(false);
    await getPromise(isRotated, 'rotate', clearRotate, 'Reset rotation');
    await getPromise(hasNonDownloadableLayer, 'layers', hideLayers, 'Remove Layers?');
    // Allow time for view to un-rotate
    if (isRotated) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await openModal(
      'TOOLBAR_SNAPSHOT',
      {
        ...CUSTOM_MODAL_PROPS.TOOLBAR_SNAPSHOT,
        onClose: () => {
          refreshStateAfterImageDownload(undefined, rotation, nonDownloadableLayers);
        },
      },
    );
  }

  function requestNotificationsFunc() {
    const { parameters, features } = config;
    const { notification } = features;
    const domain = window.location.origin;
    const testDomains = ['localhost', 'worldview.sit', 'worldview.uat', 'uat.gibs'];
    const isTestInstance = testDomains.some((href) => domain.includes(href));

    if (notification) {
      let notificationURL = !isTestInstance
        // Use the configured domain in production
        ? `${notification.url}?domain=${domain}`
        // Use the UAT domain for test instances
        : `${notification.url}?client=Worldview%20(UAT)`;
      if (parameters.mockAlerts) {
        notificationURL = `mock/notify_${parameters.mockAlerts}.json`;
      } else if (parameters.notificationURL) {
        notificationURL = `${notification.url}?domain=${parameters.notificationURL}`;
      }
      requestNotifications(notificationURL);
    }
  }

  const renderTooltip = (buttonId, labelText) => {
    return (
      <HoverTooltip
        isMobile={isMobile}
        labelText={labelText}
        target={buttonId}
      />
    );
  };

  function renderShareButton() {
    const buttonId = 'wv-share-button';
    const labelText = 'Share this map';
    const mobileWvToolbarButtonStyle = isMobile
      ? {
        fontSize: '14.3px',
        height: '44px',
        margin: '0 0 0 4px',
        padding: '5.72px 9.1px',
      }
      : null;
    return !isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        className="wv-toolbar-button"
        aria-label={labelText}
        style={mobileWvToolbarButtonStyle}
        onClick={() => openModal(
          'TOOLBAR_SHARE',
          CUSTOM_MODAL_PROPS.TOOLBAR_SHARE,
        )}
      >
        {renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="share-square" size={faSize} widthAuto />
      </Button>
    );
  }

  function renderProjectionButton() {
    const buttonId = 'wv-proj-button';
    const labelText = isChartingActive
      ? 'You must exit charting mode to switch projection'
      : 'Switch projection';
    const onClick = () => openModal(
      'TOOLBAR_PROJECTION',
      CUSTOM_MODAL_PROPS.TOOLBAR_PROJECTION,
    );
    const mobileWvToolbarButtonStyle = isMobile
      ? {
        fontSize: '14.3px',
        height: '44px',
        margin: '0 0 0 4px',
        padding: '5.72px 9.1px',
      }
      : null;
    return config.ui && config.ui.projections && !isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        aria-label={labelText}
        onClick={onClick}
        className={
          isProjectionSwitchActive
            ? 'wv-toolbar-button'
            : 'wv-toolbar-button disabled'
        }
        disabled={!isProjectionSwitchActive}
        style={mobileWvToolbarButtonStyle}
      >
        {renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="globe-asia" size={faSize} widthAuto />
      </Button>
    );
  }

  // handle rendering of Location Search button
  // 1) visibility and
  // 2) control of click (mobile vs desktop)
  const renderLocationSearchButtonComponent = () => {
    const isFeatureEnabled = isLocationSearchFeatureEnabled(config);
    // do not render if Location Search feature isn't enabled
    if (!isFeatureEnabled) {
      return null;
    }
    const buttonId = 'wv-location-search-button';
    const labelText = 'Search places by location';
    const handleButtonClick = isMobile
      ? () => openModal(
        'TOOLBAR_LOCATION_SEARCH_MOBILE',
        CUSTOM_MODAL_PROPS.TOOLBAR_LOCATION_SEARCH_MOBILE,
      )
      : () => toggleShowLocationSearch();

    const showButton = (isMobile || (!isMobile && !isLocationSearchExpanded) ||
    shouldBeCollapsed) && !isDistractionFreeModeActive;
    const mobileWvToolbarButtonStyle = isMobile
      ? {
        fontSize: '14.3px',
        height: '44px',
        margin: '0 0 0 4px',
        padding: '5.72px 9.1px',
      }
      : null;
    return showButton && (
      <div id="location-search-wrapper">
        <Button
          id={buttonId}
          className="wv-toolbar-button"
          aria-label={labelText}
          onClick={handleButtonClick}
          style={mobileWvToolbarButtonStyle}
        >
          {renderTooltip(buttonId, labelText)}
          <FontAwesomeIcon icon="search-location" size={faSize} widthAuto />
        </Button>
      </div>
    );
  };

  function renderSnapshotsButton () {
    const buttonId = 'wv-image-button';
    const activeImageDownloadLabel = !isImageDownloadActive
      ? 'You must exit data download mode to use the snapshot feature'
      : 'Take a snapshot';
    const activeChartingLabel = isChartingActive
      ? 'You must exit charting mode to use the snapshot feature'
      : activeImageDownloadLabel;
    const labelText = isCompareActive
      ? 'You must exit comparison mode to use the snapshot feature'
      : activeChartingLabel;
    const mobileWVImageButtonStyle = isMobile
      ? {
        display: 'none',
      }
      : null;

    return !isDistractionFreeModeActive && (
      <div id="snapshot-btn-wrapper">
        {renderTooltip('snapshot-btn-wrapper', labelText)}
        <Button
          id={buttonId}
          className={
            isImageDownloadActive
              ? 'wv-toolbar-button'
              : 'wv-toolbar-button disabled'
          }
          disabled={!isImageDownloadActive}
          aria-label={labelText}
          onClick={openImageDownload}
          style={mobileWVImageButtonStyle}
        >
          <FontAwesomeIcon icon="camera" size={faSize} widthAuto />
        </Button>
      </div>

    );
  }

  function renderInfoButton() {
    const notificationClass = notificationType
      ? ` wv-status-${notificationType}`
      : ' wv-status-hide';
    const buttonId = 'wv-info-button';
    const labelText = 'Information';
    const mobileWvToolbarButtonStyle = isMobile
      ? {
        fontSize: '14.3px',
        height: '44px',
        margin: '0 0 0 4px',
        padding: '5.72px 9.1px',
      }
      : null;

    return !isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        aria-label={labelText}
        className={`wv-toolbar-button${notificationClass}`}
        onClick={() => openModal('TOOLBAR_INFO', CUSTOM_MODAL_PROPS.TOOLBAR_INFO)}
        data-content={notificationContentNumber}
        style={mobileWvToolbarButtonStyle}
      >
        {renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="info-circle" size={faSize} widthAuto />
      </Button>
    );
  }

  function renderDistractionFreeExitButton() {
    const mobileButtonStyle = isMobile
      ? {
        fontSize: '14.3px',
        height: '44px',
        margin: '0 0 0 4px',
        padding: '5.72px 9.1px',
      }
      : null;
    const buttonId = 'wv-exit-distraction-free-mode-button';
    const labelText = 'Exit distraction free mode';
    return isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        className="wv-toolbar-button wv-exit-distraction-free-mode-button"
        aria-label={labelText}
        onClick={() => toggleDistractionFreeModeAction()}
        style={mobileButtonStyle}
      >
        {renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon={['fas', 'eye']} size={faSize} widthAuto />
      </Button>
    );
  }

  return (
    <ErrorBoundary>
      <ButtonToolbar
        id="wv-toolbar"
        className="wv-toolbar"
      >
        {!isKioskModeActive && renderDistractionFreeExitButton()}
        {renderLocationSearchButtonComponent()}
        {renderShareButton()}
        {renderProjectionButton()}
        {renderSnapshotsButton()}
        {renderInfoButton()}
      </ButtonToolbar>
    </ErrorBoundary>
  );
}

const mapStateToProps = (state) => {
  const {
    animation,
    compare,
    charting,
    events,
    locationSearch,
    map,
    measure,
    modal,
    modalAbout,
    notifications,
    proj,
    screenSize,
    sidebar,
    ui,
  } = state;
  const { isDistractionFreeModeActive, isKioskModeActive } = ui;
  const { numberUnseen, type } = notifications;
  const activeLayersForProj = getAllActiveLayers(state);
  const isMobile = screenSize.isMobileDevice;
  const faSize = isMobile ? '2x' : '1x';
  const isCompareActive = compare.active;
  const isChartingActive = charting.active;
  const isLocationSearchExpanded = locationSearch.isExpanded;
  const { isAnimatingToEvent } = events;
  const { activeTab } = sidebar;
  const isDataDownloadTabActive = activeTab === 'download';
  const { isOpen: modalIsOpen } = modal;

  // Collapse when Image download / GIF /  is open or measure tool active
  const snapshotModalOpen = modalIsOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;
  const visibleLayersForProj = lodashFilter(activeLayersForProj, 'visible');
  return {
    config: state.config,
    faSize,
    hasNonDownloadableLayer: hasNonDownloadableVisibleLayer(visibleLayersForProj, true),
    isAboutOpen: modalAbout.isOpen,
    isCompareActive,
    isChartingActive,
    isDistractionFreeModeActive,
    isImageDownloadActive: Boolean(
      lodashGet(state, 'map.ui.selected') &&
      !isCompareActive && !isChartingActive && !isDataDownloadTabActive,
    ),
    isProjectionSwitchActive: Boolean(
      !isAnimatingToEvent && !isChartingActive,
    ),
    isKioskModeActive,
    isLocationSearchExpanded,
    isMobile,
    isRotated: Boolean(map.rotation !== 0),
    modalIsOpen,
    notificationType: type,
    notificationContentNumber: numberUnseen,
    proj,
    rotation: map.rotation,
    shouldBeCollapsed,
    visibleLayersForProj,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleDistractionFreeModeAction: () => {
    dispatch(toggleDistractionFreeMode());
  },
  toggleDialogVisible: (isVisible) => {
    dispatch(toggleDialogVisibleAction(isVisible));
  },
  toggleShowLocationSearch: () => {
    dispatch(toggleShowLocationSearchAction());
  },
  refreshStateAfterImageDownload: (activePalettes, rotation, nonDownloadableLayers) => {
    if (activePalettes) {
      dispatch(refreshPalettes(activePalettes));
    }
    if (rotation) {
      dispatch(refreshRotation(rotation));
    }
    if (nonDownloadableLayers) {
      dispatch(showLayers(nonDownloadableLayers));
    }
  },
  openModal: (key, customParams, actions) => {
    dispatch(openCustomContent(
      key,
      customParams,
    ));
  },
  openAboutModal: () => {
    dispatch(
      openCustomContent('ABOUT_MODAL', {
        headerText: 'About',
        bodyComponent: AboutModal,
        wrapClassName: 'about-page-modal',
        onClose: () => {
          dispatch(toggleAboutModal(false));
        },
      }),
    );
  },
  notify: (type, action, visibleLayersForProj) => new Promise((resolve, reject, cancel) => {
    const nonDownloadableLayers = type !== 'layers' ? null : getNonDownloadableLayers(visibleLayersForProj, true);
    const bodyComponentProps = {
      bodyText: type !== 'layers' ? notificationWarnings[type] : getNonDownloadableLayerWarning(nonDownloadableLayers, true),
      cancel: () => {
        dispatch(onToggle());
      },
      accept: () => {
        dispatch(action(nonDownloadableLayers));
        resolve();
      },
    };
    dispatch(
      openCustomContent(`image_download_notify_${type}`, {
        headerText: 'Notify',
        bodyComponent: Notify,
        size: 'sm',
        modalClassName: 'notify',
        bodyComponentProps,
      }),
    );
  }),
  requestNotifications: (location) => {
    const promise = dispatch(
      requestNotificationsAction(location),
    );
    promise.then((data) => {
      const obj = JSON.parse(data);
      if (obj.notifications) {
        dispatch(setNotifications(obj.notifications));
      }
    });
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(toolbarContainer);

toolbarContainer.propTypes = {
  hasNonDownloadableLayer: PropTypes.bool,
  config: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  faSize: PropTypes.string,
  isAboutOpen: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isChartingActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isKioskModeActive: PropTypes.bool,
  isLocationSearchExpanded: PropTypes.bool,
  isImageDownloadActive: PropTypes.bool,
  isProjectionSwitchActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isRotated: PropTypes.bool,
  modalIsOpen: PropTypes.bool,
  notificationContentNumber: PropTypes.number,
  notificationType: PropTypes.string,
  notify: PropTypes.func,
  openModal: PropTypes.func,
  openAboutModal: PropTypes.func,
  refreshStateAfterImageDownload: PropTypes.func,
  requestNotifications: PropTypes.func,
  rotation: PropTypes.number,
  shouldBeCollapsed: PropTypes.bool,
  toggleDialogVisible: PropTypes.func,
  toggleDistractionFreeModeAction: PropTypes.func,
  toggleShowLocationSearch: PropTypes.func,
  visibleLayersForProj: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
};
