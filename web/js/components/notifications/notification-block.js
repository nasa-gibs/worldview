import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faExclamationCircle,
  faGift
} from '@fortawesome/free-solid-svg-icons';

// icons used with NotificationBlock by passing string as prop type
const listIcons = {
  alert: faBolt,
  message: faGift,
  outage: faExclamationCircle
};

class NotificationBlock extends React.Component {
  render() {
    const { arr, type, numberNotSeen } = this.props;
    return (
      <ul>
        {arr.map((notification, i) => {
          const dateObject = new Date(notification.created_at);
          const date =
            dateObject.getDate() +
            ' ' +
            util.giveMonth(dateObject) +
            ' ' +
            dateObject.getFullYear();
          const activeClass =
            numberNotSeen > i ? type + '-notification-item' : '';
          return (
            <li key={type + i} className={activeClass}>
              <h2>
                <FontAwesomeIcon icon={listIcons[type]} />
                <span>{'Posted ' + date}</span>
              </h2>
              <p dangerouslySetInnerHTML={{ __html: notification.message }} />
            </li>
          );
        })}
      </ul>
    );
  }
}

export default NotificationBlock;

NotificationBlock.propTypes = {
  arr: PropTypes.array.isRequired,
  numberNotSeen: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired
};
