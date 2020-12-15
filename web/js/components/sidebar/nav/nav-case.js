import React from 'react';
import PropTypes from 'prop-types';
import { Nav, UncontrolledTooltip } from 'reactstrap';
import CustomNavItem from './custom-nav-item';


const tabClasses = 'sidebar-tab';

function NavCase (props) {
  const {
    tabTypes,
    isMobile,
    isCompareMode,
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
        : 'Data download'
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
      {renderEvents()}
      {renderDataDownload()}
      <div className="toggleIconHolder">
        <UncontrolledTooltip placement="right" target="accordion-toggler-button">
          Hide Sidebar
        </UncontrolledTooltip>
        <a
          id="accordion-toggler-button"
          className="accordionToggler atcollapse arrow"
          onClick={toggleSidebar}
          aria-label="Hide Sidebar"
        />
      </div>
    </Nav>
  );
}

NavCase.propTypes = {
  activeTab: PropTypes.string,
  isCompareMode: PropTypes.bool,
  isDataDisabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  onTabClick: PropTypes.func,
  tabTypes: PropTypes.object,
  toggleSidebar: PropTypes.func,
};

export default NavCase;
