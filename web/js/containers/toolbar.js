import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ButtonToolbar, Button } from 'reactstrap';
import { openCustomContent } from '../modules/modal/actions';

class LinksContainer extends Component {
  render() {
    const {
      openModal,
      notificationType,
      notificationContentNumber
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
          onClick={() => openModal('TOOLBAR_SHARE_LINK')}
        >
          <i className="fas fa-share-square fa-2x" />
        </Button>
        <Button
          id="wv-proj-button"
          className="wv-toolbar-button"
          title="Switch projection"
          onClick={() => openModal('TOOLBAR_PROJECTION')}
        >
          <i className="fas fa-globe-asia fa-2x" />{' '}
        </Button>
        <Button
          id="wv-image-button"
          className="wv-toolbar-button"
          title="Take a snapshot"
          onClick={() => openModal('TOOLBAR_SNAPSHOT')}
        >
          <i className="fa fa-camera fa-2x" />{' '}
        </Button>
        <Button
          id="wv-info-button"
          title="Information"
          className={'wv-toolbar-button' + notificationClass}
          onClick={() => openModal('TOOLBAR_INFO')}
          datacontent={notificationContentNumber}
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
    notificationContentNumber: number
  };
}
const mapDispatchToProps = dispatch => ({
  openModal: text => {
    dispatch(openCustomContent(text));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinksContainer);

LinksContainer.propTypes = {
  openModal: PropTypes.func
};
