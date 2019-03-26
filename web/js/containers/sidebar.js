import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Products from '../components/sidebar/products/products';
import Events from '../components/sidebar/events/events';
import Data from '../components/sidebar/data/data';
import CompareCase from '../components/sidebar/compare';
import FooterContent from '../components/sidebar/footer-content';
import { TabContent, TabPane } from 'reactstrap';
import CollapsedButton from '../components/sidebar/collapsed-button';
import NavCase from '../components/sidebar/nav/nav-case';
import googleTagManager from 'googleTagManager';
import { getCheckerboard } from '../modules/palettes/util';
import { getLayers } from '../modules/layers/selectors';

import util from '../util/util';
import {
  changeTab,
  toggleSidebarCollapse,
  collapseSidebar,
  expandSidebar
} from '../modules/sidebar/actions';

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { subComponentHeight: 700 };
    this.checkerBoardPattern = getCheckerboard();
  }
  componentDidMount() {
    // this.updateDimensions();
    // prevent browserzooming in safari
    if (util.browser.safari) {
      let onGestureCallback = e => {
        e.preventDefault();
        e.stopPropagation();
      };
      this.iconElement.addEventListener('gesturestart', onGestureCallback);
      this.sideBarCase.addEventListener('gesturestart', onGestureCallback);
    }
  }
  componentDidUpdate() {
    // this.updateDimensions();
  }
  updateDimensions() {
    const { subComponentHeight } = this.state;
    const { isMobile, screenHeight } = this.props;

    if (!isMobile) {
      let newHeight;
      let iconHeight = this.iconElement.clientHeight;
      let topOffset = Math.abs(this.iconElement.getBoundingClientRect().top);
      let footerHeight = this.footerElement.clientHeight;
      let tabHeight = 32;
      let basePadding = 110;
      newHeight =
        screenHeight -
        (iconHeight + topOffset + tabHeight + basePadding + footerHeight);
      // Issue #1415: This was checking for subComponentHeight !== newHeight.
      // Sometimes it would get stuck in a loop in which the newHeight
      // would vary by a single pixel on each render. Hack fix is to
      // only update when changed by more than a single pixel. This probably
      // needs a refactoring.
      if (Math.abs(subComponentHeight - newHeight) > 1) {
        this.setState({ subComponentHeight: newHeight });
      }
    } else {
      let newHeight;
      let tabHeight = 32;
      let footerHeight = this.footerElement.clientHeight;
      newHeight = screenHeight - (tabHeight + footerHeight);
      // See note above
      if (Math.abs(subComponentHeight - newHeight) > 1) {
        this.setState({ subComponentHeight: newHeight });
      }
    }
  }
  selectEvent(id, date) {
    this.state.selectEvent(id, date);
    if (this.props.isMobile) {
      this.props.collapseSidebar();
    }
  }
  toggleSidebar() {
    const { isCollapsed, collapseExpandToggle, hasLocalStorage } = this.props;
    var isNowCollapsed = !isCollapsed;
    googleTagManager.pushEvent({
      event: 'sidebar_chevron'
    });
    if (hasLocalStorage) {
      let storageValue = isNowCollapsed ? 'collapsed' : 'expanded';
      localStorage.setItem('sidebarState', storageValue);
    }
    collapseExpandToggle();
  }
  getProductsToRender(activeTab, isCompareMode) {
    const { subComponentHeight } = this.state;
    if (isCompareMode) {
      return (
        <CompareCase
          isActive={activeTab === 'layers'}
          height={subComponentHeight}
          checkerBoardPattern={this.checkerBoardPattern}
        />
      );
    } else if (!isCompareMode) {
      return (
        <Products
          height={subComponentHeight}
          isActive={activeTab === 'layers'}
          layerGroupName="A"
          checkerBoardPattern={this.checkerBoardPattern}
        />
      );
    }
  }

  render() {
    const { subComponentHeight } = this.state;
    const {
      onTabClick,
      numberOfLayers,
      screenHeight,
      isCollapsed,
      isCompareMode,
      activeTab
    } = this.props;
    const wheelCallBack = util.browser.chrome ? util.preventPinch : null;
    return (
      <section id="wv-sidebar">
        <a
          href="/"
          title="Click to Reset Worldview to Defaults"
          id="wv-logo"
          ref={iconElement => (this.iconElement = iconElement)}
          onWheel={wheelCallBack}
        />
        <CollapsedButton
          isCollapsed={isCollapsed}
          onclick={this.toggleSidebar.bind(this)}
          numberOfLayers={numberOfLayers}
        />
        <div
          id="productsHolder"
          className="products-holder-case"
          ref={el => {
            this.sideBarCase = el;
          }}
          style={
            isCollapsed
              ? { maxHeight: '0' }
              : { maxHeight: screenHeight + 'px' }
          }
          onWheel={wheelCallBack}
        >
          {/* <NavCase activeTab={activeTab} onTabClick={onTabClick} /> */}
          <TabContent activeTab={'events'}>
            <TabPane tabId="layers">
              {this.getProductsToRender(activeTab, isCompareMode)}
            </TabPane>
            <TabPane tabId="events">
              <Events
                isActive={activeTab === 'events'}
                height={subComponentHeight}
              />
            </TabPane>
            {/* <TabPane tabId="download">
              <Data
                isActive={activeTab === 'download'}
                height={subComponentHeight}
              />
            </TabPane>
            <footer ref={footerElement => (this.footerElement = footerElement)}>
              <FooterContent />
            </footer> */}
          </TabContent>
        </div>
      </section>
    );
  }
}
function mapStateToProps(state) {
  const { browser, sidebar, compare, layers } = state;
  const { screenHeight } = browser;
  const { activeTab } = sidebar;
  const { activeString } = layers;
  const numberOfLayers = getLayers(layers[activeString], {}, state).length;
  return {
    activeTab,
    isMobile: browser.is.small,
    hasLocalStorage: util.browser.localStorage,
    screenHeight: screenHeight,
    isCompareMode: compare.active,
    numberOfLayers
  };
}
const mapDispatchToProps = dispatch => ({
  onTabClick: str => {
    dispatch(changeTab(str));
  },
  collapseExpandToggle: () => {
    dispatch(toggleSidebarCollapse());
  },
  collapseSidebar: () => {
    dispatch(collapseSidebar());
  },
  expandSidebar: () => {
    dispatch(expandSidebar());
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);

Sidebar.defaultProps = {
  maxHeight: 700,
  visibleEvents: {}
};
Sidebar.propTypes = {
  isMobile: PropTypes.bool,
  hasLocalStorage: PropTypes.bool,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  onTabClick: PropTypes.func,
  numberOfLayers: PropTypes.number,
  activeTab: PropTypes.string,
  isCollapsed: PropTypes.bool,
  isCompareMode: PropTypes.bool,
  collapseSidebar: PropTypes.func,
  collapseExpandToggle: PropTypes.func
};
