import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Nav, NavItem, NavLink, TabContent, TabPane,
} from 'reactstrap';
import Layers from './layers';
import { getLayers } from '../../modules/layers/selectors';
import { toggleActiveCompareState } from '../../modules/compare/actions';
import util from '../../util/util';
import AlertUtil from '../../components/util/alert';
import { CompareAlertModalBody } from '../../components/compare/alert';
import { openCustomContent } from '../../modules/modal/actions';

const tabHeight = 32;
class CompareCase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlert: props.showAlert,
    };
    this.dismissAlert = this.dismissAlert.bind(this);
  }

  dismissAlert() {
    localStorage.setItem('dismissedCompareAlert', true);
    this.setState({ showAlert: false });
  }

  render() {
    const {
      isActive,
      dateStringA,
      dateStringB,
      toggleActiveCompareState,
      isCompareA,
      height,
      layersA,
      layersB,
      openAlertModal,
      checkerBoardPattern,
    } = this.props;
    const { showAlert } = this.state;

    const outerClass = 'layer-container sidebar-panel';
    const tabClasses = 'ab-tab';
    return (
      <div className={isActive ? '' : 'hidden '}>
        {showAlert ? (
          <AlertUtil
            isOpen
            onClick={openAlertModal}
            onDismiss={this.dismissAlert}
            message="You are now in comparison mode."
          />
        )
          : ''}
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
                  {` A: ${dateStringA}`}
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
                  {` B: ${dateStringB}`}
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={isCompareA ? '1' : '2'}>
              <TabPane tabId="1">
                <Layers
                  isActive={isCompareA}
                  activeOverlays={layersA}
                  layerGroupName="active"
                  height={height - tabHeight}
                  checkerBoardPattern={checkerBoardPattern}
                />
              </TabPane>
              <TabPane tabId="2">
                <Layers
                  isActive={!isCompareA}
                  activeOverlays={layersB}
                  layerGroupName="activeB"
                  height={height - tabHeight}
                  checkerBoardPattern={checkerBoardPattern}
                />
              </TabPane>
            </TabContent>
          </div>
        </div>
      </div>
    );
  }
}
const mapDispatchToProps = (dispatch) => ({
  toggleActiveCompareState: () => {
    dispatch(toggleActiveCompareState());
  },
  openAlertModal: () => {
    dispatch(
      openCustomContent('compare_mode_info', {
        headerText: 'You are now in comparison mode',
        backdrop: false,
        size: 'lg',
        clickableBehindModal: true,
        bodyComponent: CompareAlertModalBody,
        desktopOnly: true,
      }),
    );
  },
});
function mapStateToProps(state, ownProps) {
  const {
    layers, compare, date, browser,
  } = state;
  const showAlert = util.browser.localStorage
    && browser.greaterThan.small
    && !localStorage.getItem('dismissedCompareAlert');

  return {
    isCompareA: compare.isCompareA,
    layersA: getLayers(layers.active, { group: 'all', proj: 'all' }, state),
    layersB: getLayers(layers.activeB, { group: 'all', proj: 'all' }, state),
    dateStringA: util.toISOStringDate(date.selected),
    dateStringB: util.toISOStringDate(date.selectedB),
    isActive: compare.active,
    height: ownProps.height,
    showAlert,
  };
}
CompareCase.propTypes = {
  checkerBoardPattern: PropTypes.object,
  dateStringA: PropTypes.string,
  dateStringB: PropTypes.string,
  height: PropTypes.number,
  isActive: PropTypes.bool,
  isCompareA: PropTypes.bool,
  layersA: PropTypes.object,
  layersB: PropTypes.object,
  openAlertModal: PropTypes.func,
  showAlert: PropTypes.bool,
  toggleActiveCompareState: PropTypes.func,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CompareCase);
