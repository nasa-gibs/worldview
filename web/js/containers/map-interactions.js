import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { groupBy as lodashGroupBy, debounce as lodashDebounce, get as lodashGet } from 'lodash';
import OlCoordinates from '../components/map/ol-coordinates';
import vectorDialog from './vector-dialog';
import { onMapClickGetVectorFeatures } from '../modules/vector-styles/util';
import { openCustomContent, onClose } from '../modules/modal/actions';
import { selectVectorFeatures as selectVectorFeaturesActionCreator } from '../modules/vector-styles/actions';
import { changeCursor as changeCursorActionCreator } from '../modules/map/actions';
import { isFromActiveCompareRegion } from '../modules/compare/util';
import { hasNonClickableVectorLayer } from '../modules/layers/util';
import util from '../util/util';

export class MapInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    const { mouseEvents } = this.props;
    mouseEvents.on('mousemove', this.mouseMove);
    mouseEvents.on('singleclick', this.singleClick);
  }

  singleClick(e, map) {
    const {
      lastSelected, openVectorDiaglog, onCloseModal, selectVectorFeatures, refeshAlerts,
      modalState, getDialogObject, measureIsActive, isMobile, activeLayers,
    } = this.props;

    if (measureIsActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const dialogId = isVectorModalOpen ? modalState.id : `vector_dialog${pixels[0]}${pixels[1]}`;

    if (metaArray.length) {
      openVectorDiaglog(dialogId, metaArray, offsetLeft, offsetTop, isMobile);
    } else {
      const mapRes = map.getView().getResolution();
      const hasNonClickableVectorLayerType = hasNonClickableVectorLayer(activeLayers, mapRes);

      if (hasNonClickableVectorLayerType && util.browser.localStorage) {
        localStorage.removeItem('dismissedVectorAlert');
        refeshAlerts();
      }
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    const {
      isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset, proj,
    } = this.props;
    const [lon, lat] = coord;
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixels, (feature, layer) => {
        const def = lodashGet(layer, 'wv.def');
        if (!def) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped ? lon > -250 || lon < 250 || lat > -90 || lat < 90 : true;
        if (isRenderedFeature && isFromActiveCompareRegion(map, pixels, layer.wv, compareState, swipeOffset)) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer) changeCursor(true);
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  render() {
    const {
      isDistractionFreeModeActive,
      isShowingClick,
      mouseEvents,
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
        <OlCoordinates
          mouseEvents={mouseEvents}
        />
        )}
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
  onCloseModal: () => {
    dispatch(onClose());
  },
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
    activeLayers: layers[compare.activeString],
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
  refeshAlerts: PropTypes.func.isRequired,
  activeLayers: PropTypes.array,

};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapInteractions);
