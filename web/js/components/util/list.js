import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem, Badge } from 'reactstrap';

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
              className={className + ' ' + size + '-item'}
              href={item.href ? item.href : 'false'}
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
              {iconClass ? <i className={iconClass} /> : ''}
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
  list: PropTypes.array,
  listClass: PropTypes.string,
  active: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  size: PropTypes.string
};
