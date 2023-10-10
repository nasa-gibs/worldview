import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import NotificationBlock from '../components/notifications/notification-block';
import { getNumberOfTypeNotSeen } from '../modules/notifications/util';

function Notifications(props) {
  const { object, numberOutagesUnseen } = props;
  const {
    messages, outages, alerts,
  } = object;

  if (numberOutagesUnseen > 0) {
    return (
      <div className="wv-notify-modal">
        <NotificationBlock
          arr={outages}
          type="outage"
          numberNotSeen={getNumberOfTypeNotSeen('outage', outages)}
        />
      </div>
    );
  }
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
  const { object, numberOutagesUnseen } = state.notifications;

  return {
    object,
    numberOutagesUnseen,
  };
}

export default connect(
  mapStateToProps,
  null,
)(Notifications);

Notifications.propTypes = {
  object: PropTypes.object,
  numberOutagesUnseen: PropTypes.number,
};
