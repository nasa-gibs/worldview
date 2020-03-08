import React from 'react';
import PropTypes from 'prop-types';
import { NavItem, NavLink } from 'reactstrap';

const CustomNavItem = (props) => {
  const {
    isMobile,
    shouldHideInMobile,
    isDisabled,
    title,
    className,
    onTabClick,
    id,
    iconClassName,
    text,
  } = props;
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
        id={`${id}-sidebar-tab`}
        onClick={() => onTabClick(id)}
      >
        <i className={`productsIcon selected ${iconClassName}`} />
        {text}
      </NavLink>
    </NavItem>
  );
};

CustomNavItem.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  id: PropTypes.string,
  isDisabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  onTabClick: PropTypes.func,
  shouldHideInMobile: PropTypes.bool,
  text: PropTypes.string,
  title: PropTypes.string,
};

export default CustomNavItem;
