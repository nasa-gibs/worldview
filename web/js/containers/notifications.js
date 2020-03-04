import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import NotificationBlock from '../components/notifications/notification-block';
import { getNumberOfTypeNotSeen } from '../modules/notifications/util';

class Notifications extends Component {
  render() {
    const { object } = this.props;
    return (
      <div className="wv-notify-modal">
        <NotificationBlock
          arr={object.outages}
          type="outage"
          numberNotSeen={getNumberOfTypeNotSeen('outage', object.outages)}
        />
        <NotificationBlock
          arr={object.alerts}
          type="alert"
          numberNotSeen={getNumberOfTypeNotSeen('alert', object.alerts)}
        />
        <NotificationBlock
          arr={object.messages}
          type="message"
          numberNotSeen={getNumberOfTypeNotSeen('message', object.messages)}
        />
      </div>
    );
  }
}
function mapStateToProps(state) {
  const { object } = state.notifications;

  return {
    object,
  };
}

export default connect(
  mapStateToProps,
  null,
)(Notifications);

Notifications.propTypes = {
  object: PropTypes.object,
};
