import React from 'react';
import PropTypes from 'prop-types';
import Products from './products/products';
import Events from './events/events';
import Data from './data/data';
import CompareCase from './compare';
import FooterContent from './footer-content';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { SidebarProvider as Provider } from './provider';
import CollapsedButton from './collapsed-button';

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    var wasCollapsedRequested = this.wasCollapsedRequested();
    this.state = {
      activeTab: props.activeTab,
      isCompareMode: props.isCompareMode,
      isCollapsed: wasCollapsedRequested || props.isMobile,
      layers: props.layers,
      firstDateObject: props.firstDateObject,
      secondDateObject: props.secondDateObject,
      isCompareA: props.isCompareA,
      isCollapsedRequested: wasCollapsedRequested,
      comparisonType: props.comparisonType,
      runningLayers: props.runningLayers,
      zotsObject: props.zotsObject,
      isMobile: props.isMobile,
      windowHeight: window.innerHeight,
      subComponentHeight: 700,
      visibleEvents: props.visibleEvents,
      showListAllButton: props.showListAllButton,
      eventsData: props.eventsData,
      selectedEvent: props.selectedEvent,
      selectEvent: props.selectEvent,
      deselectEvent: props.deselectEvent,
      filterEventList: props.filterEventList,
      getDataSelectionCounts: props.getDataSelectionCounts,
      dataDownloadObject: {},
      selectedDataProduct: props.selectedDataProduct,
      showDataUnavailableReason: props.showDataUnavailableReason
    };
  }
  componentDidMount() {
    this.updateDimensions();
  }
  componentDidUpdate() {
    this.updateDimensions();
  }
  updateDimensions() {
    const { isMobile, subComponentHeight, windowHeight } = this.state;

    if (!isMobile) {
      let newHeight;
      let iconHeight = this.iconElement.clientHeight;
      let topOffset = Math.abs(this.iconElement.getBoundingClientRect().top);
      let footerHeight = this.footerElement.clientHeight;
      let tabHeight = 32;
      let basePadding = 110;
      newHeight =
        windowHeight -
        (iconHeight + topOffset + tabHeight + basePadding + footerHeight);
      if (subComponentHeight !== newHeight) {
        this.setState({ subComponentHeight: newHeight });
      }
    } else {
      let newHeight;
      let tabHeight = 32;
      let footerHeight = this.footerElement.clientHeight;
      newHeight = windowHeight - (tabHeight + footerHeight);
      if (subComponentHeight !== newHeight) {
        this.setState({ subComponentHeight: newHeight });
      }
    }
  }
  wasCollapsedRequested() {
    if (this.props.localStorage) {
      return localStorage.getItem('sidebarState') === 'collapsed';
    }
    return false;
  }
  toggleSidebar() {
    var isNowCollapsed = !this.state.isCollapsed;
    if (this.props.localStorage) {
      let storageValue = isNowCollapsed ? 'collapsed' : 'expanded';
      localStorage.setItem('sidebarState', storageValue);
    }
    this.setState({
      isCollapsed: isNowCollapsed,
      isCollapsedRequested: isNowCollapsed
    });
  }
  getProductsToRender(activeTab, isCompareMode) {
    const {
      layers,
      firstDateObject,
      secondDateObject,
      isCompareA,
      subComponentHeight,
      isMobile
    } = this.state;
    const { toggleComparisonObject } = this.props;
    if (isCompareMode) {
      return (
        <CompareCase
          isActive={activeTab === 'layers'}
          firstDateObject={firstDateObject}
          secondDateObject={secondDateObject}
          height={subComponentHeight}
          toggleComparisonObject={toggleComparisonObject}
          isCompareA={isCompareA}
        />
      );
    } else if (!isCompareMode) {
      return (
        <Products
          height={subComponentHeight}
          isActive={activeTab === 'layers'}
          activeOverlays={layers}
          isMobile={isMobile}
          layerGroupName={isCompareA ? 'active' : 'activeB'}
        />
      );
    }
  }

  render() {
    const {
      activeTab,
      isCompareMode,
      runningLayers,
      zotsObject,
      isMobile,
      isCollapsed,
      layers,
      visibleEvents,
      eventsData,
      selectedEvent,
      selectEvent,
      subComponentHeight,
      secondDateObject,
      firstDateObject,
      deselectEvent,
      isCompareA,
      dataDownloadObject,
      selectedDataProduct,
      showDataUnavailableReason,
      showListAllButton,
      comparisonType,
      onGetData,
      filterEventList
    } = this.state;
    const {
      onTabClick,
      palettePromise,
      updateLayer,
      getNames,
      getAvailability,
      getLegend,
      replaceSubGroup,
      getDataSelectionCounts,
      selectDataProduct,
      toggleMode,
      addLayers,
      getDataSelectionSize,
      changeCompareMode,
      checkerBoardPattern
    } = this.props;
    const tabClasses = 'sidebar-tab';
    return (
      <Provider
        palettePromise={palettePromise}
        updateLayer={updateLayer}
        getNames={getNames}
        getAvailability={getAvailability}
        runningLayers={runningLayers}
        getLegend={getLegend}
        zotsObject={zotsObject}
        replaceSubGroup={replaceSubGroup}
        isMobile={isMobile}
        checkerBoardPattern={checkerBoardPattern}
      >
        <a
          href="/"
          title="Click to Reset Worldview to Defaults"
          id="wv-logo"
          ref={iconElement => (this.iconElement = iconElement)}
        />
        <CollapsedButton
          isCollapsed={isCollapsed}
          onclick={this.toggleSidebar.bind(this)}
          numberOfLayers={
            !isCompareMode
              ? layers.baselayers.length + layers.overlays.length
              : isCompareA
                ? firstDateObject.layers.overlays.length +
                  firstDateObject.layers.baselayers.length
                : secondDateObject.layers.overlays.length +
                  secondDateObject.layers.baselayers.length
          }
        />
        <div id="productsHolder" style={isCollapsed ? { display: 'none' } : {}}>
          <Nav tabs className="main-nav">
            <NavItem>
              <NavLink
                title="layers"
                className={
                  activeTab === 'layers'
                    ? tabClasses + ' first-tab active'
                    : tabClasses + ' first-tab'
                }
                onClick={() => onTabClick('layers')}
              >
                <i className="productsIcon selected icon-layers" />
                Layers
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                disabled={!!isCompareMode}
                title={
                  isCompareMode
                    ? 'You must exit comparison mode to use the natural events feature'
                    : 'Events'
                }
                className={
                  activeTab === 'events'
                    ? tabClasses + ' second-tab active'
                    : isCompareMode
                      ? tabClasses + ' second-tab disabled'
                      : tabClasses + ' second-tab'
                }
                onClick={() => onTabClick('events')}
              >
                <i className="productsIcon selected icon-events" />
                Events
              </NavLink>
            </NavItem>
            <NavItem
              style={isMobile ? { display: 'none' } : { display: 'block' }}
            >
              <NavLink
                disabled={!!isCompareMode}
                title={
                  isCompareMode
                    ? 'You must exit comparison mode to download data'
                    : 'events'
                }
                className={
                  activeTab === 'download'
                    ? tabClasses + ' first-tab active'
                    : isCompareMode
                      ? tabClasses + ' third-tab disabled'
                      : tabClasses + ' third-tab'
                }
                onClick={() => onTabClick('download')}
              >
                <i className="productsIcon selected icon-download" />
                Data
              </NavLink>
            </NavItem>
            <div className="toggleIconHolder">
              <a
                id="accordionTogglerButton"
                className="accordionToggler atcollapse arrow"
                onClick={this.toggleSidebar.bind(this)}
                title="Hide"
              />
            </div>
          </Nav>
          <TabContent activeTab={activeTab}>
            <TabPane tabId="layers">
              {this.getProductsToRender(activeTab, isCompareMode)}
            </TabPane>
            <TabPane tabId="events">
              <Events
                isActive={activeTab === 'events'}
                visibleEvents={visibleEvents}
                events={eventsData.events}
                sources={eventsData.sources}
                selectedEvent={selectedEvent}
                selectEvent={selectEvent}
                deselectEvent={deselectEvent}
                height={subComponentHeight}
              />
            </TabPane>
            <TabPane tabId="download">
              <Data
                isActive={activeTab === 'download'}
                data={dataDownloadObject}
                getCounts={getDataSelectionCounts}
                selected={selectedDataProduct}
                selectProduct={selectDataProduct}
                showUnavailableReason={showDataUnavailableReason}
                height={subComponentHeight}
              />
            </TabPane>
            <footer ref={footerElement => (this.footerElement = footerElement)}>
              <FooterContent
                showListAllButton={showListAllButton}
                isCompareMode={isCompareMode}
                comparisonType={comparisonType}
                isMobile={isMobile}
                eventsData={eventsData}
                activeTab={activeTab}
                filterEventList={filterEventList}
                onGetData={onGetData}
                changeCompareMode={changeCompareMode}
                addLayers={addLayers}
                toggleMode={toggleMode}
                getDataSelectionCounts={getDataSelectionCounts}
                getDataSelectionSize={getDataSelectionSize}
              />
            </footer>
          </TabContent>
        </div>
      </Provider>
    );
  }
}
Sidebar.defaultProps = {
  maxHeight: 700,
  visibleEvents: {}
};
Sidebar.propTypes = {
  activeTab: PropTypes.string,
  isCompareMode: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  toggleSidebar: PropTypes.func,
  updateLayer: PropTypes.func,
  onTabClick: PropTypes.func,
  tabTypes: PropTypes.object,
  layers: PropTypes.object,
  getNames: PropTypes.func,
  firstDateObject: PropTypes.object,
  secondDateObject: PropTypes.object,
  addLayers: PropTypes.func,
  toggleComparisonMode: PropTypes.func,
  getAvailability: PropTypes.func,
  isCompareA: PropTypes.bool,
  toggleComparisonObject: PropTypes.func,
  comparisonType: PropTypes.string,
  toggleMode: PropTypes.func,
  runningLayers: PropTypes.object,
  changeCompareMode: PropTypes.func,
  palettePromise: PropTypes.func,
  localStorage: PropTypes.bool,
  getLegend: PropTypes.func,
  zotsObject: PropTypes.object,
  isMobile: PropTypes.bool,
  replaceSubGroup: PropTypes.func,
  maxHeight: PropTypes.number,
  getDataSelectionCounts: PropTypes.func,
  selectDataProduct: PropTypes.func,
  getDataSelectionSize: PropTypes.func,
  checkerBoardPattern: PropTypes.object,
  visibleEvents: PropTypes.array,
  showListAllButton: PropTypes.func,
  eventsData: PropTypes.object,
  selectedEvent: PropTypes.string,
  selectEvent: PropTypes.func,
  deselectEvent: PropTypes.func,
  filterEventList: PropTypes.func,
  selectedDataProduct: PropTypes.string,
  showDataUnavailableReason: PropTypes.func
};

export default Sidebar;
