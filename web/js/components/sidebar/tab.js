import React from 'react';
import PropTypes from 'prop-types';

class Tab extends React.Component {
  render() {
    const { listClasses, isActive, iconClasses, tabName, onclick } = this.props;
    return (
      <li className={isActive ? 'ui-tab-active' + listClasses : listClasses}>
        <a className={isActive ? 'tab activetab' : 'tab'} onClick={onclick}>
          <i className={iconClasses} title={tabName}>
            {tabName}
          </i>
        </a>
      </li>
    );
  }
}
Tab.propTypes = {
  isExpanded: PropTypes.bool,
  tabName: PropTypes.string,
  iconClasses: PropTypes.string,
  isActive: PropTypes.bool,
  listClasses: PropTypes.string,
  onclick: PropTypes.func
};

export default Tab;
