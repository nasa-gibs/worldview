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
  faDownload,
  faEnvelope,
  faEye,
  faExclamationCircle,
  faFile,
  faFlag,
  faGift,
  faRuler,
  faRulerCombined,
  faTrash,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';

// icons used with List by passing string as prop iconClass
const listIcons = {
  faArrowCircleDown,
  faArrowCircleUp,
  faBolt,
  faCircle,
  faCode,
  faDownload,
  faEnvelope,
  faExclamationCircle,
  faEye,
  faFile,
  faFlag,
  faGift,
  faRuler,
  faRulerCombined,
  faTrash,
  faTruck,
};

/*
 * A react reuseable list component
 *
 * @class List
 * @extends React.Component
 */
export default function List(props) {
  const {
    list, listClass, active, disabled, onClick, size,
  } = props;
  return (
    <ListGroup className={listClass}>
      {list.map((item) => {
        const {
          id, iconName, iconClass, className, hidden, key, href, badge, text,
        } = item;
        const isActive = key && active ? key === active : false;
        const isDisabled = key && disabled ? key === disabled : false;
        const itemClass = className || '';
        const tagType = href ? 'a' : 'button';
        const propsOnClick = onClick
          ? () => onClick(key || id)
          : null;
        const onClickFn = item.onClick ? item.onClick : propsOnClick;


        return !hidden && (
          <ListGroupItem
            key={key || id || ''}
            tag={tagType}
            active={isActive}
            id={id || ''}
            className={`${itemClass} ${size}-item`}
            href={href || undefined}
            target={href ? '_blank' : undefined}
            onClick={onClickFn}
            disabled={isDisabled}
          >
            {iconName ? <FontAwesomeIcon icon={listIcons[iconName]} className={iconClass} fixedWidth /> : ''}
            {text || ''}
            {badge ? <Badge pill>{badge}</Badge> : ''}
          </ListGroupItem>
        );
      })}
    </ListGroup>
  );
}
List.defaultProps = {
  size: 'medium',
};
List.propTypes = {
  active: PropTypes.string,
  disabled: PropTypes.bool,
  list: PropTypes.array,
  listClass: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.string,
};
