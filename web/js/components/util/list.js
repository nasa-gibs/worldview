import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem, Badge } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowCircleDown,
  faArrowCircleUp,
  faBolt,
  faCircle,
  faCode,
  faEnvelope,
  faExclamationCircle,
  faFile,
  faFlag,
  faGift,
  faRuler,
  faRulerCombined,
  faTrash,
  faTruck
} from '@fortawesome/free-solid-svg-icons';

// icons used with List by passing string as prop iconClass
const listIcons = {
  faArrowCircleDown: faArrowCircleDown,
  faArrowCircleUp: faArrowCircleUp,
  faBolt: faBolt,
  faCircle: faCircle,
  faCode: faCode,
  faEnvelope: faEnvelope,
  faExclamationCircle: faExclamationCircle,
  faFile: faFile,
  faFlag: faFlag,
  faGift: faGift,
  faRuler: faRuler,
  faRulerCombined: faRulerCombined,
  faTrash: faTrash,
  faTruck: faTruck
};

/*
 * A react reuseable list component
 *
 * @class List
 * @extends React.Component
 */
export default class List extends React.Component {
  render() {
    const { list, listClass, active, disabled, onClick, size } = this.props;
    return (
      <ListGroup className={listClass}>
        {list.map(item => {
          const iconName = item.iconName;
          const iconClass = item.iconClass;
          const isActive = item.key && active ? item.key === active : false;
          const isDisabled =
            item.key && disabled ? item.key === disabled : false;
          const badge = item.badge;
          const className = item.className ? item.className : '';
          const tagType = item.href ? 'a' : 'button';
          return (
            <ListGroupItem
              key={item.key || item.id || ''}
              tag={tagType}
              active={isActive}
              id={item.id || ''}
              className={className + ' ' + size + '-item'}
              href={item.href ? item.href : undefined}
              target={item.href ? '_blank' : undefined}
              onClick={
                item.onClick
                  ? item.onClick
                  : onClick
                    ? () => {
                      onClick(item.key || item.id);
                    }
                    : null
              }
              disabled={isDisabled}
            >
              {iconName ? <FontAwesomeIcon icon={listIcons[iconName]} className={iconClass} fixedWidth /> : ''}
              {item.text || ''}
              {badge ? <Badge pill>{item.badge}</Badge> : ''}
            </ListGroupItem>
          );
        })}
      </ListGroup>
    );
  }
}
List.defaultProps = {
  size: 'medium'
};
List.propTypes = {
  active: PropTypes.string,
  disabled: PropTypes.bool,
  list: PropTypes.array,
  listClass: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.string
};
