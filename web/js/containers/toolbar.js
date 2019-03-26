import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ButtonToolbar, Button } from 'reactstrap';
import { openCustomContent } from '../modules/modal/actions';
import ImageDownload from './image-download';
import Projection from './projection';
import InfoList from './info';
import ShareLinks from './share';
import {
  requestNotifications,
  setNotifications
} from '../modules/notifications/actions';
import {
  STATUS_REQUEST_URL,
  REQUEST_NOTIFICATIONS
} from '../modules/notifications/constants';

const CUSTOM_MODAL_PROPS = {
  TOOLBAR_PROJECTION: {
    headerText: null,
    type: 'toolbar',
    modalClassName: 'toolbar-list-modal toolbar-modal',
    backdrop: true,
    bodyComponent: Projection,
    wrapClassName: 'toolbar_modal_outer toolbar_modal_outer',
    offsetRight: '40px'
  },
  TOOLBAR_SHARE_LINK: {
    headerText: 'Copy Link to Share',
    type: 'toolbar',
    backdrop: false,
    offsetRight: '198px',
    modalClassName: 'toolbar-share-modal toolbar-modal toolbar-medium-modal',
    clickableBehindModal: true,
    wrapClassName: 'clickable-behind-modal toolbar_modal_outer',
    bodyComponent: ShareLinks
  },
  TOOLBAR_INFO: {
    headerText: null,
    backdrop: false,
    type: 'toolbar',
    modalClassName: 'toolbar-list-modal toolbar-modal',
    offsetRight: '10px',
    bodyComponent: InfoList,
    wrapClassName: 'toolbar_modal_outer toolbar_modal_outer'
  },
  TOOLBAR_SNAPSHOT: {
    headerText: 'Take a Snapshot',
    backdrop: false,
    wrapClassName: 'clickable-behind-modal toolbar_modal_outer',
    type: 'selection',
    offsetRight: '70px',
    modalClassName: 'toolbar-snapshot-modal toolbar-modal toolbar-medium-modal',
    bodyComponent: ImageDownload
  }
};
class toolbarContainer extends Component {
  constructor(props) {
    super(props);
    this.requestNotifications();
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
      config
    } = this.props;
    const notificationClass = notificationType
      ? ' wv-status-' + notificationType
      : ' wv-status-hide';
    return (
      <ButtonToolbar id="wv-toolbar" className={'wv-toolbar'}>
        <Button
          id="wv-link-button"
          className="wv-toolbar-button"
          title="Share this map"
          onClick={() =>
            openModal(
              'TOOLBAR_SHARE_LINK',
              CUSTOM_MODAL_PROPS['TOOLBAR_SHARE_LINK']
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
                CUSTOM_MODAL_PROPS['TOOLBAR_PROJECTION']
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
          className="wv-toolbar-button"
          title="Take a snapshot"
          onClick={() =>
            openModal(
              'TOOLBAR_SNAPSHOT',
              CUSTOM_MODAL_PROPS['TOOLBAR_SNAPSHOT']
            )
          }
        >
          <i className="fa fa-camera fa-2x" />{' '}
        </Button>
        <Button
          id="wv-info-button"
          title="Information"
          className={'wv-toolbar-button' + notificationClass}
          onClick={() =>
            openModal('TOOLBAR_INFO', CUSTOM_MODAL_PROPS['TOOLBAR_INFO'])
          }
          data-content={notificationContentNumber}
        >
          <i className="fa fa-info-circle fa-2x" />{' '}
        </Button>
      </ButtonToolbar>
    );
  }
}
function mapStateToProps(state) {
  const { number, type } = state.notifications;

  return {
    notificationType: type,
    notificationContentNumber: number,
    config: state.config
  };
}
const mapDispatchToProps = dispatch => ({
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
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
  openModal: PropTypes.func,
  notificationType: PropTypes.string,
  notificationContentNumber: PropTypes.number,
  requestNotifications: PropTypes.func,
  config: PropTypes.object
};
