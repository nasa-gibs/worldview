import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ButtonToolbar, Button, UncontrolledTooltip } from 'reactstrap';
import {
  get as lodashGet,
  find as lodashFind,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import Promise from 'bluebird';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { openCustomContent, onToggle } from '../modules/modal/actions';
import toggleDistractionFreeMode from '../modules/ui/actions';
import ImageDownload from './image-download';
import Projection from './projection';
import InfoList from './info';
import ShareLinks from './share';
import ErrorBoundary from './error-boundary';
import {
  requestNotifications,
  setNotifications,
} from '../modules/notifications/actions';
import {
  REQUEST_NOTIFICATIONS,
} from '../modules/notifications/constants';
import { clearCustoms, refreshPalettes } from '../modules/palettes/actions';
import { clearRotate, refreshRotation } from '../modules/map/actions';
import { clearGraticule, refreshGraticule } from '../modules/layers/actions';
import { notificationWarnings } from '../modules/image-download/constants';
import Notify from '../components/image-download/notify';
import { hasCustomPaletteInActiveProjection } from '../modules/palettes/util';
import { getLayers } from '../modules/layers/selectors';


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
  TOOLBAR_SHARE_LINK: {
    headerText: 'Copy Link to Share',
    type: 'toolbar',
    backdrop: false,
    modalClassName: 'toolbar-share-modal toolbar-modal toolbar-medium-modal',
    clickableBehindModal: true,
    wrapClassName: 'toolbar_modal_outer',
    bodyComponent: ShareLinks,
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
};

class toolbarContainer extends Component {
  constructor(props) {
    super(props);
    this.requestNotifications();
    this.openImageDownload = this.openImageDownload.bind(this);
  }

  getPromise(bool, type, action, title) {
    const { notify } = this.props;
    if (bool) {
      return notify(type, action);
    }
    return Promise.resolve(type);
  }

  async openImageDownload() {
    const {
      openModal, hasCustomPalette, isRotated, hasGraticule, activePalettes, rotation, refreshStateAfterImageDownload,
    } = this.props;

    const paletteStore = lodashCloneDeep(activePalettes);
    await this.getPromise(hasCustomPalette, 'palette', clearCustoms, 'Notice');
    await this.getPromise(isRotated, 'rotate', clearRotate, 'Reset rotation');
    await this.getPromise(hasGraticule, 'graticule', clearGraticule, 'Remove Graticule?');
    await openModal(
      'TOOLBAR_SNAPSHOT',
      {
        ...CUSTOM_MODAL_PROPS.TOOLBAR_SNAPSHOT,
        onClose: () => {
          refreshStateAfterImageDownload(
            hasCustomPalette ? paletteStore : undefined, rotation, hasGraticule,
          );
        },
      },
    );
  }

  requestNotifications() {
    const { config, requestNotifications } = this.props;
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
        : `${notification.url}?domain=https%3A%2F%2Fworldview.uat.earthdata.nasa.gov`;

      if (parameters.mockAlerts) {
        notificationURL = `mock/notify_${parameters.mockAlerts}.json`;
      } else if (parameters.notificationURL) {
        notificationURL = `${notification.url}?domain=${parameters.notificationURL}`;
      }
      requestNotifications(notificationURL);
    }
  }

  renderTooltip = (buttonId, labelText) => (
    <UncontrolledTooltip
      target={buttonId}
      boundariesElement="window"
      placement="bottom"
    >
      {labelText}
    </UncontrolledTooltip>
  )

  renderShareButton() {
    const { openModal, isDistractionFreeModeActive } = this.props;
    const buttonId = 'wv-link-button';
    const labelText = 'Share this map';
    return !isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        className="wv-toolbar-button"
        aria-label={labelText}
        onClick={() => openModal(
          'TOOLBAR_SHARE_LINK',
          CUSTOM_MODAL_PROPS.TOOLBAR_SHARE_LINK,
        )}
      >
        {this.renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="share-square" size="2x" />
      </Button>
    );
  }

  renderProjectionButton() {
    const { config, openModal, isDistractionFreeModeActive } = this.props;
    const buttonId = 'wv-proj-button';
    const labelText = 'Switch projection';
    return config.ui && config.ui.projections && !isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        className="wv-toolbar-button"
        aria-label={labelText}
        onClick={() => openModal(
          'TOOLBAR_PROJECTION',
          CUSTOM_MODAL_PROPS.TOOLBAR_PROJECTION,
        )}
      >
        {this.renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="globe-asia" size="2x" />
      </Button>
    );
  }

  renderSnapshotsButton () {
    const {
      isImageDownloadActive,
      isCompareActive,
      isDistractionFreeModeActive,
    } = this.props;
    const buttonId = 'wv-image-button';
    const labelText = isCompareActive
      ? 'You must exit comparison mode to use the snapshot feature'
      : !isImageDownloadActive
        ? 'You must exit data download mode to use the snapshot feature'
        : 'Take a snapshot';

    return !isDistractionFreeModeActive && (
      <Button
        id={buttonId}
        className={
          isImageDownloadActive
            ? 'wv-toolbar-button'
            : 'wv-toolbar-button disabled'
        }
        disabled={!isImageDownloadActive}
        aria-label={labelText}
        onClick={this.openImageDownload}
      >
        {this.renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="camera" size="2x" />
      </Button>
    );
  }

  renderInfoButton() {
    const {
      openModal,
      notificationType,
      notificationContentNumber,
      isDistractionFreeModeActive,
    } = this.props;
    const notificationClass = notificationType
      ? ` wv-status-${notificationType}`
      : ' wv-status-hide';
    const buttonId = 'wv-info-button';
    const labelText = 'Information';

    return (
      <Button
        id={buttonId}
        aria-label={labelText}
        className={
              `wv-toolbar-button${notificationClass}
              ${isDistractionFreeModeActive ? 'wv-info-button-distraction-free-mode' : ''}`
            }
        onClick={() => openModal('TOOLBAR_INFO', CUSTOM_MODAL_PROPS.TOOLBAR_INFO)}
        data-content={notificationContentNumber}
      >
        {this.renderTooltip(buttonId, labelText)}
        <FontAwesomeIcon icon="info-circle" size="2x" />
      </Button>
    );
  }

  render() {
    return (
      <ErrorBoundary>
        <ButtonToolbar
          id="wv-toolbar"
          className="wv-toolbar"
        >
          {this.renderShareButton()}
          {this.renderProjectionButton()}
          {this.renderSnapshotsButton()}
          {this.renderInfoButton()}
        </ButtonToolbar>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    notifications, palettes, compare, map, layers, proj, data, ui,
  } = state;
  const { isDistractionFreeModeActive } = ui;
  const { number, type } = notifications;
  const { activeString } = compare;
  const activeLayersForProj = getLayers(
    layers[activeString],
    { proj: proj.id },
    state,
  );
  const isCompareActive = compare.active;
  const isDataDownloadActive = data.active;
  const activePalettes = palettes[activeString];
  return {
    notificationType: type,
    notificationContentNumber: number,
    config: state.config,
    rotation: map.rotation,
    activePalettes,
    isImageDownloadActive: Boolean(
      lodashGet(state, 'map.ui.selected')
      && !isCompareActive
      && !isDataDownloadActive,
    ),
    isCompareActive,
    hasCustomPalette: hasCustomPaletteInActiveProjection(
      activeLayersForProj,
      activePalettes,
    ),
    isRotated: Boolean(map.rotation !== 0),
    hasGraticule: Boolean(
      lodashGet(
        lodashFind(layers[activeString], { id: 'Graticule' }) || {},
        'visible',
      ),
    ),
    isDistractionFreeModeActive,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleDistractionFreeMode: () => {
    dispatch(toggleDistractionFreeMode());
  },
  refreshStateAfterImageDownload: (activePalettes, rotation, isGraticule) => {
    if (activePalettes) {
      dispatch(refreshPalettes(activePalettes));
    }
    if (rotation) {
      dispatch(refreshRotation(rotation));
    }
    if (isGraticule) {
      dispatch(refreshGraticule(isGraticule));
    }
  },
  openModal: (key, customParams, actions) => {
    dispatch(openCustomContent(
      key,
      customParams,
    ));
  },
  notify: (type, action, title) => new Promise((resolve, reject, cancel) => {
    const bodyComponentProps = {
      bodyText: notificationWarnings[type],
      cancel: () => {
        dispatch(onToggle());
      },
      accept: () => {
        dispatch(action());
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
      requestNotifications(location, REQUEST_NOTIFICATIONS, 'json'),
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
  activePalettes: PropTypes.object,
  config: PropTypes.object,
  hasCustomPalette: PropTypes.bool,
  hasGraticule: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isImageDownloadActive: PropTypes.bool,
  isRotated: PropTypes.bool,
  notificationContentNumber: PropTypes.number,
  notificationType: PropTypes.string,
  notify: PropTypes.func,
  openModal: PropTypes.func,
  refreshStateAfterImageDownload: PropTypes.func,
  requestNotifications: PropTypes.func,
  rotation: PropTypes.number,
};
