import React from 'react';
import PropTypes from 'prop-types';
import { Nav } from 'reactstrap';
import CustomNavItem from './nav-item';

const tabClasses = 'sidebar-tab';
class NavCase extends React.Component {
  renderDataDownload() {
    const {
      tabTypes,
      isMobile,
      isCompareMode,
      onTabClick,
      activeTab,
      isDataDisabled,
    } = this.props;
    if (tabTypes.download) {
      return (
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
    }
  }

  renderEvents() {
    const {
      tabTypes,
      isMobile,
      isCompareMode,
      onTabClick,
      activeTab,
    } = this.props;
    if (tabTypes.events) {
      return (
        <CustomNavItem
          isMobile={isMobile}
          shouldHideInMobile={false}
          isDisabled={!!isCompareMode}
          onTabClick={onTabClick}
          text="Events"
          id="events"
          iconClassName="icon-events"
          disabled={!!isCompareMode}
          title={
            isCompareMode
              ? 'You must exit comparison mode to use the natural events feature'
              : 'Events'
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
    }
  }

  render() {
    const {
      isMobile, onTabClick, activeTab, toggleSidebar,
    } = this.props;

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
          title="Layers"
          className={
            activeTab === 'layers'
              ? `${tabClasses} first-tab active`
              : `${tabClasses} first-tab`
          }
        />
        {this.renderEvents()}
        {this.renderDataDownload()}
        <div className="toggleIconHolder">
          <a
            id="accordionTogglerButton"
            className="accordionToggler atcollapse arrow"
            onClick={toggleSidebar}
            title="Hide"
          />
        </div>
      </Nav>
    );
  }
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
