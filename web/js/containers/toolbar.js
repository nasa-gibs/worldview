import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ButtonToolbar, Button } from 'reactstrap';
import {
  get as lodashGet,
  find as lodashFind,
  cloneDeep as lodashCloneDeep,
} from 'lodash';
import Promise from 'bluebird';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShareSquare, faGlobeAsia, faCamera, faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
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
  STATUS_REQUEST_URL,
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

  openImageDownload() {
    const {
      openModal, hasCustomPalette, isRotated, hasGraticule, activePalettes, rotation, refreshStateAfterImageDownload,
    } = this.props;

    const paletteStore = lodashCloneDeep(activePalettes);
    this.getPromise(hasCustomPalette, 'palette', clearCustoms, 'Notice').then(
      () => {
        this.getPromise(
          isRotated,
          'rotate',
          clearRotate,
          'Reset rotation',
        ).then(() => {
          this.getPromise(
            hasGraticule,
            'graticule',
            clearGraticule,
            'Remove Graticule?',
          ).then(() => {
            openModal(
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
          });
        });
      },
    );
  }

  requestNotifications() {
    const { config, requestNotifications } = this.props;
    const { parameters, features } = config;
    const { notification } = features;
    const domain = window.location.origin;

    if (notification) {
      let notificationURL = notification.url && !domain.includes('localhost')
        // Use the deployed domain (SIT, UAT, PROD) when possible
        ? `${notification.url}?domain=${domain}`
        // Use the PROD domain when running locally
        : STATUS_REQUEST_URL;

      if (parameters.mockAlerts) {
        notificationURL = `mock/notify_${parameters.mockAlerts}.json`;
      } else if (parameters.notificationURL) {
        notificationURL = `${notification.url}?domain=${parameters.notificationURL}`;
      }
      requestNotifications(notificationURL);
    }
  }

  render() {
    const {
      openModal,
      notificationType,
      notificationContentNumber,
      config,
      isDistractionFreeModeActive,
      isImageDownloadActive,
      isCompareActive,
    } = this.props;
    const notificationClass = notificationType
      ? ` wv-status-${notificationType}`
      : ' wv-status-hide';
    return (
      <ErrorBoundary>
        <ButtonToolbar
          id="wv-toolbar"
          className="wv-toolbar"
        >
          { !isDistractionFreeModeActive && (
            <>
              <Button
                id="wv-link-button"
                className="wv-toolbar-button"
                title="Share this map"
                onClick={() => openModal(
                  'TOOLBAR_SHARE_LINK',
                  CUSTOM_MODAL_PROPS.TOOLBAR_SHARE_LINK,
                )}
              >
                <FontAwesomeIcon icon={faShareSquare} size="2x" />
              </Button>
              {config.ui && config.ui.projections ? (
                <Button
                  id="wv-proj-button"
                  className="wv-toolbar-button"
                  title="Switch projection"
                  onClick={() => openModal(
                    'TOOLBAR_PROJECTION',
                    CUSTOM_MODAL_PROPS.TOOLBAR_PROJECTION,
                  )}
                >
                  <FontAwesomeIcon icon={faGlobeAsia} size="2x" />
                </Button>
              )
                : ''}
              <Button
                id="wv-image-button"
                className={
                  isImageDownloadActive
                    ? 'wv-toolbar-button'
                    : 'wv-toolbar-button disabled'
                }
                disabled={!isImageDownloadActive}
                title={
                  isCompareActive
                    ? 'You must exit comparison mode to use the snapshot feature'
                    : !isImageDownloadActive
                      ? 'You must exit data download mode to use the snapshot feature'
                      : 'Take a snapshot'
                }
                onClick={this.openImageDownload}
              >
                <FontAwesomeIcon icon={faCamera} size="2x" />
              </Button>
            </>
          )}
          <Button
            id="wv-info-button"
            title="Information"
            className={`wv-toolbar-button${notificationClass} ${isDistractionFreeModeActive ? 'wv-info-button-distraction-free-mode' : ''}`}
            onClick={() => openModal('TOOLBAR_INFO', CUSTOM_MODAL_PROPS.TOOLBAR_INFO)}
            data-content={notificationContentNumber}
          >
            <FontAwesomeIcon icon={faInfoCircle} size="2x" />
          </Button>
        </ButtonToolbar>
      </ErrorBoundary>
    );
  }
}
function mapStateToProps(state) {
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
}
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
