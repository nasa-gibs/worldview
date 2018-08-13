import React from 'react';
import PropTypes from 'prop-types';
import Products from './products/products';

import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
const tabHeight = 32;
class CompareCase extends React.Component {
  render() {
    const {
      isActive,
      firstDateObject,
      secondDateObject,
      toggleComparisonObject,
      isCompareA,
      height
    } = this.props;
    const outerClass = 'layer-container sidebar-panel';
    const tabClasses = 'ab-tab';
    return (
      <div className={isActive ? '' : 'hidden '}>
        <div className={outerClass}>
          <div className="ab-tabs-case">
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={
                    isCompareA
                      ? tabClasses + ' first-tab active'
                      : tabClasses + ' first-tab'
                  }
                  onClick={toggleComparisonObject}
                >
                  <i className="productsIcon selected icon-layers" />
                  {' A: ' + firstDateObject.dateString}
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={
                    !isCompareA
                      ? tabClasses + ' second-tab active'
                      : tabClasses + ' second-tab'
                  }
                  onClick={toggleComparisonObject}
                >
                  <i className="productsIcon selected icon-layers" />
                  {' B: ' + secondDateObject.dateString}
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={isCompareA ? '1' : '2'}>
              <TabPane tabId="1">
                <Products
                  isActive={isCompareA}
                  activeOverlays={firstDateObject.layers}
                  layerGroupName="active"
                  height={height - tabHeight}
                />
              </TabPane>
              <TabPane tabId="2">
                <Products
                  isActive={!isCompareA}
                  activeOverlays={secondDateObject.layers}
                  layerGroupName="activeB"
                  height={height - tabHeight}
                />
              </TabPane>
            </TabContent>
          </div>
        </div>
      </div>
    );
  }
}
CompareCase.propTypes = {
  activeOverlays: PropTypes.object,
  updateLayer: PropTypes.func,
  getNames: PropTypes.func,
  isActive: PropTypes.bool,
  firstDateObject: PropTypes.object,
  secondDateObject: PropTypes.object,
  onClickCompareTab: PropTypes.func,
  isFirstDateActive: PropTypes.bool,
  getAvailability: PropTypes.func,
  toggleActiveCompare: PropTypes.func,
  toggleComparisonObject: PropTypes.func,
  children: PropTypes.node,
  isCompareA: PropTypes.bool,
  height: PropTypes.number
};

export default CompareCase;
