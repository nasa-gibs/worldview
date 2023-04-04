import React from 'react';
import PropTypes from 'prop-types';
import { Nav, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomNavItem from './nav-item';

const tabClasses = 'sidebar-tab';

function NavCase (props) {
  const {
    tabTypes,
    isMobile,
    isCompareMode,
    isEventsTabDisabledEmbed,
    onTabClick,
    activeTab,
    isDataDisabled,
    toggleSidebar,
  } = props;

  const renderDataDownload = () => tabTypes.download && (
    <CustomNavItem
      isMobile={isMobile}
      shouldHideInMobile
      isDisabled={!!isCompareMode || isDataDisabled}
      onTabClick={onTabClick}
      text="Data"
      id="download"
      iconClassName="icon-download"
      disabled={!!isCompareMode}
      label={
        isCompareMode
          ? 'You must exit comparison mode to download data'
          : 'Data Download'
      }
      className={
        activeTab === 'download'
          ? `${tabClasses} third-tab active`
          : isCompareMode
            ? `${tabClasses} third-tab disabled`
            : `${tabClasses} third-tab`
      }
    />
  );

  const renderEvents = () => tabTypes.events && (
    <CustomNavItem
      id="events"
      isMobile={isMobile}
      shouldHideInMobile={false}
      isDisabled={!!isCompareMode}
      onTabClick={onTabClick}
      text="Events"
      iconClassName="icon-events"
      disabled={!!isCompareMode}
      label={
        isCompareMode
          ? 'You must exit comparison mode to use the natural events feature'
          : 'Natural Events'
      }
      className={
        activeTab === 'events'
          ? `${tabClasses} second-tab active`
          : isCompareMode
            ? `${tabClasses} second-tab disabled`
            : `${tabClasses} second-tab`
      }
    />
  );
  const sidebarCollapseMobile = isMobile ? {
    height: '48px',
    width: '45px',
  } : null;
  const collapseIconMobile = isMobile ? {
    height: '30px',
    width: '30px',
    color: '#fff',
  } : null;
  const fontAwesomeStyle = isMobile ? 'times' : 'caret-up';

  return (
    <Nav tabs className="main-nav">
      <CustomNavItem
        id="layers"
        isMobile={isMobile}
        shouldHideInMobile={false}
        onTabClick={onTabClick}
        text="Layers"
        iconClassName="icon-layers"
        disabled={false}
        label="Map Layers"
        className={
          activeTab === 'layers'
            ? `${tabClasses} first-tab active`
            : `${tabClasses} first-tab`
        }
      />
      {!isEventsTabDisabledEmbed && renderEvents()}
      {renderDataDownload()}

      <div
        id="toggleIconHolder"
        className="sidebar-collapse"
        onClick={toggleSidebar}
        style={sidebarCollapseMobile}
      >
        <FontAwesomeIcon
          className="collapse-icon"
          icon={fontAwesomeStyle}
          aria-label="Hide sidebar"
          style={collapseIconMobile}
        />
        <UncontrolledTooltip id="center-align-tooltip" placement="right" target="toggleIconHolder">
          Hide sidebar
        </UncontrolledTooltip>
      </div>
    </Nav>
  );
}

NavCase.propTypes = {
  activeTab: PropTypes.string,
  isEventsTabDisabledEmbed: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  isDataDisabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  onTabClick: PropTypes.func,
  tabTypes: PropTypes.object,
  toggleSidebar: PropTypes.func,
};

export default NavCase;
