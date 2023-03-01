import React from 'react';
import PropTypes from 'prop-types';
import { NavItem, NavLink } from 'reactstrap';
import HoverTooltip from '../../util/hover-tooltip';

function CustomNavItem(props) {
  const {
    isMobile,
    shouldHideInMobile,
    isDisabled,
    label,
    className,
    onTabClick,
    id,
    iconClassName,
    text,
  } = props;
  const tabId = `${id}-sidebar-tab`;
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
        aria-label={label}
        className={className}
        id={tabId}
        onClick={() => onTabClick(id)}
      >
        <i className={`productsIcon selected ${iconClassName}`} />
        {text}
        <HoverTooltip
          isMobile={isMobile}
          labelText={label}
          target={tabId}
          placement="top"
        />
      </NavLink>
    </NavItem>
  );
}

CustomNavItem.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  id: PropTypes.string,
  isDisabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  onTabClick: PropTypes.func,
  shouldHideInMobile: PropTypes.bool,
  text: PropTypes.string,
  label: PropTypes.string,
};

export default CustomNavItem;
