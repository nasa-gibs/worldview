import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import util from '../../util/util';

// icons used with NotificationBlock by passing string as prop type
const listIcons = {
  alert: ['fas', 'bolt'],
  message: 'gift',
  outage: 'exclamation-circle',
};

function NotificationBlock(props) {
  const { arr, type, numberNotSeen } = props;
  return (
    <ul>
      {arr.map((notification, i) => {
        const dateObject = new Date(notification.created_at);
        const date = `${dateObject.getDate()
        } ${
          util.giveMonth(dateObject)
        } ${
          dateObject.getFullYear()}`;
        const activeClass = numberNotSeen > i ? `${type}-notification-item` : '';
        return (
        /* eslint react/no-array-index-key: 1 */
          <li key={type + i} className={activeClass}>
            <h2>
              <FontAwesomeIcon icon={listIcons[type]} />
              <span>{`Posted ${date}`}</span>
            </h2>
            <p dangerouslySetInnerHTML={{ __html: notification.message }} />
          </li>
        );
      })}
    </ul>
  );
}

export default NotificationBlock;

NotificationBlock.propTypes = {
  arr: PropTypes.array.isRequired,
  numberNotSeen: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
};
