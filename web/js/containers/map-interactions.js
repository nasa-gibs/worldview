import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  groupBy as lodashGroupBy,
} from 'lodash';
import OlCoordinates from '../components/map/ol-coordinates';
import vectorDialog from './vector-dialog';
import { onMapClickGetVectorFeatures } from '../modules/vector-styles/util';
import { openCustomContent, onClose } from '../modules/modal/actions';
import { selectVectorFeatures as selectVectorFeaturesActionCreator } from '../modules/vector-styles/actions';
import { changeCursor as changeCursorActionCreator } from '../modules/map/actions';
import { ACTIVATE_VECTOR_ALERT } from '../modules/alerts/constants';
import OlVectorInteractions from '../components/map/ol-vector-interactions';

class MapInteractions extends React.PureComponent {
  render() {
    const {
      isDistractionFreeModeActive,
      isShowingClick,
      mouseEvents,
      changeCursor,
      getDialogObject,
      measureIsActive,
      modalState,
      onCloseModal,
      openVectorDiaglog,
      selectVectorFeatures,
      compareState,
      isMobile,
      lastSelected,
      proj,
      swipeOffset,
      activeLayers,
      activateVectorAlert,
    } = this.props;
    let mapClasses = isShowingClick
      ? 'wv-map cursor-pointer'
      : 'wv-map';
    mapClasses = isDistractionFreeModeActive
      ? `${mapClasses} distraction-free-active`
      : mapClasses;

    return (
      <>
        <div id="wv-map" className={mapClasses} />
        {!isDistractionFreeModeActive && (
          <>
            <OlCoordinates
              mouseEvents={mouseEvents}
            />
          </>

        )}
        <OlVectorInteractions
          changeCursor={changeCursor}
          getDialogObject={getDialogObject}
          isShowingClick={isShowingClick}
          measureIsActive={measureIsActive}
          modalState={modalState}
          mouseEvents={mouseEvents}
          onCloseModal={onCloseModal}
          openVectorDiaglog={openVectorDiaglog}
          selectVectorFeatures={selectVectorFeatures}
          compareState={compareState}
          isMobile={isMobile}
          lastSelected={lastSelected}
          proj={proj}
          swipeOffset={swipeOffset}
          activeLayers={activeLayers}
          activateVectorAlert={activateVectorAlert}
        />
      </>
    );
  }
}
const mapDispatchToProps = (dispatch) => ({
  selectVectorFeatures: (features) => {
    setTimeout(() => {
      dispatch(selectVectorFeaturesActionCreator(features));
    }, 1);
  },
  changeCursor: (bool) => {
    dispatch(changeCursorActionCreator(bool));
  },
  openCustomAlertModal: ({ id, props }) => {
    dispatch(openCustomContent(id, props));
  },
  onCloseModal: () => {
    dispatch(onClose());
  },
  activateVectorAlert: () => dispatch({ type: ACTIVATE_VECTOR_ALERT }),
  openVectorDiaglog: (dialogId, metaArray, offsetLeft, offsetTop, isMobile) => {
    const dialogKey = new Date().getUTCMilliseconds();
    dispatch(openCustomContent(dialogId,
      {
        backdrop: false,
        clickableBehindModal: true,
        desktopOnly: true,
        isDraggable: true,
        wrapClassName: 'vector-modal-wrap',
        modalClassName: 'vector-modal light',
        CompletelyCustomModal: vectorDialog,
        isResizable: true,
        dragHandle: '.modal-header',
        dialogKey,
        key: dialogKey,
        vectorMetaObject: lodashGroupBy(metaArray, 'id'),
        width: isMobile ? 250 : 445,
        height: 300,
        offsetLeft,
        offsetTop,
        timeout: 0,
        onClose: () => {
          setTimeout(() => {
            dispatch(selectVectorFeaturesActionCreator({}));
          }, 1);
        },
      }));
  },
});
function mapStateToProps(state) {
  const {
    modal, map, measure, vectorStyles, browser, compare, proj, ui, layers,
  } = state;
  let swipeOffset;
  const activeLayers = layers[compare.activeString];
  if (compare.active && compare.mode === 'swipe') {
    const percentOffset = state.compare.value || 50;
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }

  return {
    modalState: modal,
    isShowingClick: map.isClickable,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    getDialogObject: (pixels, olMap) => onMapClickGetVectorFeatures(pixels, olMap, state, swipeOffset),
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive,
    isMobile: browser.lessThan.medium,
    compareState: compare,
    swipeOffset,
    proj,
    activeLayers,
  };
}
MapInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isDistractionFreeModeActive: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDiaglog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  compareState: PropTypes.object,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
  proj: PropTypes.object,
  swipeOffset: PropTypes.number,
  activeLayers: PropTypes.array,
  activateVectorAlert: PropTypes.func,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapInteractions);
