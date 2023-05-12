import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Nav, NavItem, NavLink, TabContent, TabPane,
} from 'reactstrap';
import LayersContainer from './layers-container';
import { toggleActiveCompareState as toggleActiveCompareStateAction } from '../../modules/compare/actions';
import { getCompareDates } from '../../modules/compare/selectors';
import MonospaceDate from '../../components/util/monospace-date';

function CompareCase(props) {
  const {
    isActive,
    dateA,
    dateB,
    toggleActiveCompareState,
    isCompareA,
    height,
  } = props;

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
                      ? `${tabClasses} first-tab active`
                      : `${tabClasses} first-tab`
                  }
                onClick={toggleActiveCompareState}
              >
                <i className="productsIcon selected icon-layers" />
                {' A: '}
                <MonospaceDate date={dateA} />
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={
                    !isCompareA
                      ? `${tabClasses} second-tab active`
                      : `${tabClasses} second-tab`
                  }
                onClick={toggleActiveCompareState}
              >
                <i className="productsIcon selected icon-layers" />
                {' B: '}
                <MonospaceDate date={dateB} />
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={isCompareA ? '1' : '2'}>
            <TabPane tabId="1">
              <LayersContainer
                isActive={isCompareA}
                compareState="active"
                height={height}
              />
            </TabPane>
            <TabPane tabId="2">
              <LayersContainer
                isActive={!isCompareA}
                compareState="activeB"
                height={height}
              />
            </TabPane>
          </TabContent>
        </div>
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch) => ({
  toggleActiveCompareState: () => {
    dispatch(toggleActiveCompareStateAction());
  },
});

const mapStateToProps = (state) => {
  const { compare, screenSize } = state;
  const { isCompareA, active } = compare;
  const { dateA, dateB } = getCompareDates(state);
  const isMobile = screenSize.isMobileDevice;

  return {
    isCompareA,
    dateA,
    dateB,
    isActive: active,
    isMobile,
  };
};

CompareCase.propTypes = {
  dateA: PropTypes.string,
  dateB: PropTypes.string,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  isCompareA: PropTypes.bool,
  toggleActiveCompareState: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CompareCase);
