import React from 'react';
import PropTypes from 'prop-types';
import { NavItem, NavLink } from 'reactstrap';

class CustomNavItem extends React.Component {
  render() {
    const {
      isMobile,
      shouldHideInMobile,
      isDisabled,
      title,
      className,
      onTabClick,
      id,
      iconClassName,
      text
    } = this.props;
    return (
      <NavItem
        style={
          shouldHideInMobile && isMobile
            ? { display: 'none' }
            : { display: 'block' }
        }
      >
        <NavLink
          disabled={isDisabled}
          title={title}
          className={className}
          id={this.props.id + '-sidebar-tab'}
          onClick={() => onTabClick(id)}
        >
          <i className={'productsIcon selected ' + iconClassName} />
          {text}
        </NavLink>
      </NavItem>
    );
  }
}

CustomNavItem.propTypes = {
  isMobile: PropTypes.bool,
  shouldHideInMobile: PropTypes.bool,
  isDisabled: PropTypes.bool,
  title: PropTypes.string,
  className: PropTypes.string,
  onTabClick: PropTypes.func,
  id: PropTypes.string,
  iconClassName: PropTypes.string,
  text: PropTypes.string
};

export default CustomNavItem;
