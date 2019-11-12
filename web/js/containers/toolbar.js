import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ButtonToolbar, Button } from 'reactstrap';
import { openCustomContent, onToggle } from '../modules/modal/actions';
import { toggleDistractionFreeMode } from '../modules/ui/actions';
import ImageDownload from './image-download';
import Projection from './projection';
import InfoList from './info';
import ShareLinks from './share';
import ErrorBoundary from './error-boundary';
import { get as lodashGet, find as lodashFind } from 'lodash';
import {
  requestNotifications,
  setNotifications
} from '../modules/notifications/actions';
import {
  STATUS_REQUEST_URL,
  REQUEST_NOTIFICATIONS
} from '../modules/notifications/constants';
import { clearCustoms } from '../modules/palettes/actions';
import { clearRotate } from '../modules/map/actions';
import { clearGraticule } from '../modules/layers/actions';
import { notificationWarnings } from '../modules/image-download/constants';
import { Notify } from '../components/image-download/notify';
import Promise from 'bluebird';
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
    wrapClassName: 'toolbar_modal_outer toolbar_modal_outer'
  },
  TOOLBAR_SHARE_LINK: {
    headerText: 'Copy Link to Share',
    type: 'toolbar',
    backdrop: false,
    modalClassName: 'toolbar-share-modal toolbar-modal toolbar-medium-modal',
    clickableBehindModal: true,
    wrapClassName: 'toolbar_modal_outer',
    bodyComponent: ShareLinks
  },
  TOOLBAR_INFO: {
    headerText: null,
    backdrop: false,
    type: 'toolbar',
    modalClassName: 'toolbar-list-modal toolbar-info-modal toolbar-modal',
    bodyComponent: InfoList,
    wrapClassName: 'toolbar_modal_outer toolbar_modal_outer'
  },
  TOOLBAR_SNAPSHOT: {
    headerText: 'Take a Snapshot',
    backdrop: false,
    wrapClassName: 'toolbar_modal_outer',
    type: 'selection',
    modalClassName: 'toolbar-snapshot-modal toolbar-modal toolbar-medium-modal',
    bodyComponent: ImageDownload,
    desktopOnly: true,
    clickableBehindModal: true
  }
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
    } else {
      return Promise.resolve(type);
    }
  }

  openImageDownload() {
    const { openModal, hasCustomPalette, isRotated, hasGraticule } = this.props;
    this.getPromise(hasCustomPalette, 'palette', clearCustoms, 'Notice').then(
      () => {
        this.getPromise(
          isRotated,
          'rotate',
          clearRotate,
          'Reset rotation'
        ).then(() => {
          this.getPromise(
            hasGraticule,
            'graticule',
            clearGraticule,
            'Remove Graticule?'
          ).then(() => {
            openModal(
              'TOOLBAR_SNAPSHOT',
              CUSTOM_MODAL_PROPS.TOOLBAR_SNAPSHOT
            );
          });
        });
      }
    );
  }

  requestNotifications() {
    const { config, requestNotifications } = this.props;
    if (config.features.notification) {
      let notificationURL = config.features.notification.url
        ? config.features.notification.url
        : STATUS_REQUEST_URL;
      if (config.parameters.mockAlerts) {
        notificationURL =
          'mock/notify_' + config.parameters.mockAlerts + '.json';
      } else if (config.parameters.notificationURL) {
        console.log('mock notificationURL');
        notificationURL =
          'https://status.earthdata.nasa.gov/api/v1/notifications?domain=' +
          config.parameters.notificationURL;
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
      isImageDownloadActive,
      isCompareActive
    } = this.props;
    const notificationClass = notificationType
      ? ' wv-status-' + notificationType
      : ' wv-status-hide';
    return (
      <ErrorBoundary>
        <ButtonToolbar
          id="wv-toolbar"
          className={'wv-toolbar'}
        >
          {/* add custom distraction free mode icon, template, modal ? */}
          { this.props.isDistractionFreeModeActive
            ? <Button
              id="wv-link-button"
              className="wv-toolbar-button"
              title="Toggle Distraction Free Mode"
              onClick={() => this.props.toggleDistractionFreeMode() }
            >
              <i className="far fa-eye fa-2x" />
            </Button>
            : <React.Fragment>
              <Button
                id="wv-link-button"
                className="wv-toolbar-button"
                title="Share this map"
                onClick={() =>
                  openModal(
                    'TOOLBAR_SHARE_LINK',
                    CUSTOM_MODAL_PROPS.TOOLBAR_SHARE_LINK
                  )
                }
              >
                <i className="fas fa-share-square fa-2x" />
              </Button>
              {config.ui && config.ui.projections ? (
                <Button
                  id="wv-proj-button"
                  className="wv-toolbar-button"
                  title="Switch projection"
                  onClick={() =>
                    openModal(
                      'TOOLBAR_PROJECTION',
                      CUSTOM_MODAL_PROPS.TOOLBAR_PROJECTION
                    )
                  }
                >
                  <i className="fas fa-globe-asia fa-2x" />{' '}
                </Button>
              ) : (
                ''
              )}
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
                <i className="fa fa-camera fa-2x" />{' '}
              </Button>
              <Button
                id="wv-info-button"
                title="Information"
                className={'wv-toolbar-button' + notificationClass}
                onClick={() =>
                  openModal('TOOLBAR_INFO', CUSTOM_MODAL_PROPS.TOOLBAR_INFO)
                }
                data-content={notificationContentNumber}
              >
                <i className="fa fa-info-circle fa-2x" />{' '}
              </Button>
            </React.Fragment>
          }
        </ButtonToolbar>
      </ErrorBoundary>
    );
  }
}
function mapStateToProps(state) {
  const { notifications, palettes, compare, map, layers, proj, data, ui } = state;
  const isDistractionFreeModeActive = ui.isDistractionFreeModeActive;
  const { number, type } = notifications;
  const activeString = compare.activeString;
  const activeLayersForProj = getLayers(
    layers[activeString],
    { proj: proj.id },
    state
  );
  const isCompareActive = compare.active;
  const isDataDownloadActive = data.active;
  return {
    notificationType: type,
    notificationContentNumber: number,
    config: state.config,
    isImageDownloadActive: Boolean(
      lodashGet(state, 'map.ui.selected') &&
        !isCompareActive &&
        !isDataDownloadActive
    ),
    isCompareActive,
    hasCustomPalette: hasCustomPaletteInActiveProjection(
      activeLayersForProj,
      palettes[activeString]
    ),
    isRotated: Boolean(map.rotation !== 0),
    hasGraticule: Boolean(
      lodashGet(
        lodashFind(layers[activeString], { id: 'Graticule' }) || {},
        'visible'
      )
    ),
    isDistractionFreeModeActive
  };
}
const mapDispatchToProps = dispatch => ({
  toggleDistractionFreeMode: () => {
    dispatch(toggleDistractionFreeMode());
  },
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  },
  notify: (type, action, title) => {
    return new Promise((resolve, reject, cancel) => {
      const bodyComponentProps = {
        bodyText: notificationWarnings[type],
        cancel: () => {
          dispatch(onToggle());
        },
        accept: () => {
          dispatch(action());
          resolve();
        }
      };
      dispatch(
        openCustomContent('image_download_notify_' + type, {
          headerText: 'Notify',
          bodyComponent: Notify,
          size: 'sm',
          modalClassName: 'notify',
          bodyComponentProps
        })
      );
    });
  },
  requestNotifications: location => {
    const promise = dispatch(
      requestNotifications(location, REQUEST_NOTIFICATIONS, 'json')
    );
    promise.then(data => {
      const obj = JSON.parse(data);
      if (obj.notifications) {
        dispatch(setNotifications(obj.notifications));
      }
    });
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(toolbarContainer);

toolbarContainer.propTypes = {
  config: PropTypes.object,
  hasCustomPalette: PropTypes.bool,
  hasGraticule: PropTypes.bool,
  isCompareActive: PropTypes.bool,
  isImageDownloadActive: PropTypes.bool,
  isRotated: PropTypes.bool,
  notificationContentNumber: PropTypes.number,
  notificationType: PropTypes.string,
  notify: PropTypes.func,
  openModal: PropTypes.func,
  requestNotifications: PropTypes.func
};
