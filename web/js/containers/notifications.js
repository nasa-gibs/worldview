import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import NotificationBlock from '../components/notifications/notification-block';
import { getNumberOfTypeNotSeen } from '../modules/notifications/util';

function Notifications(props) {
  const { object } = props;
  const {
    messages, outages, alerts,
  } = object;
  return (
    <div className="wv-notify-modal">
      <NotificationBlock
        arr={outages}
        type="outage"
        numberNotSeen={getNumberOfTypeNotSeen('outage', outages)}
      />
      <NotificationBlock
        arr={alerts}
        type="alert"
        numberNotSeen={getNumberOfTypeNotSeen('alert', alerts)}
      />
      <NotificationBlock
        arr={messages}
        type="message"
        numberNotSeen={getNumberOfTypeNotSeen('message', messages)}
      />
    </div>
  );
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
