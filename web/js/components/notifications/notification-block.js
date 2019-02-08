import React from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';

const CLASS_MATCHING_OBJ = {
  alert: 'bolt',
  message: 'gift',
  outage: 'exclamation-circle'
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
                <i className={'fa fa-' + CLASS_MATCHING_OBJ[type]} />
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
  type: PropTypes.string.isRequired,
  numberNotSeen: PropTypes.number.isRequired
};
