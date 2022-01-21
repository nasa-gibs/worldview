import { connect } from 'react-redux';
import {
  debounce as lodashDebounce,
  get as lodashGet,
  includes as lodashIncludes,
  groupBy as lodashGroupBy,
} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { transform } from 'ol/proj';
import { isFromActiveCompareRegion } from '../../modules/compare/util';
import { hasNonClickableVectorLayer } from '../../modules/layers/util';
import { getActiveLayers } from '../../modules/layers/selectors';
import vectorDialog from '../vector-dialog';
import { onMapClickGetVectorFeatures } from '../../modules/vector-styles/util';
import { openCustomContent, onClose } from '../../modules/modal/actions';
import { selectVectorFeatures as selectVectorFeaturesActionCreator } from '../../modules/vector-styles/actions';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
import { ACTIVATE_VECTOR_ZOOM_ALERT, ACTIVATE_VECTOR_EXCEEDED_ALERT, DISABLE_VECTOR_EXCEEDED_ALERT } from '../../modules/alerts/constants';
import util from '../../util/util';

const { events } = util;

export class VectorInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
  }

  componentDidMount() {
    events.on('map:mousemove', this.mouseMove);
    events.on('map:singleclick', this.singleClick);
  }

  componentWillUnmount() {
    events.off('map:mousemove', this.mouseMove);
    events.off('map:singleclick', this.singleClick);
  }

  mouseMove(event, map, crs) {
    const {
      isShowingClick, changeCursor, isCoordinateSearchActive, measureIsActive, compareState, swipeOffset, proj,
    } = this.props;

    if (measureIsActive || isCoordinateSearchActive) {
      return;
    }
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixels, (feature, layer) => {
        const def = lodashGet(layer, 'wv.def');
        if (!def || lodashIncludes(def.clickDisabledFeatures, feature.getType())) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped ? lon > -250 || lon < 250 || lat > -90 || lat < 90 : true;
        if (isRenderedFeature && isFromActiveCompareRegion(pixels, layer.wv, compareState, swipeOffset)) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer) {
        changeCursor(true);
        return true;
      }
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  singleClick(e, map) {
    const {
      browser, lastSelected, openVectorDialog, onCloseModal, selectVectorFeatures,
      modalState, getDialogObject, measureIsActive, activeLayers, isCoordinateSearchActive,
      activateVectorZoomAlert, activateVectorExceededResultsAlert, clearVectorExceededResultsAlert,
      proj, isEmbedModeActive, isVectorExceededAlertPresent, isMobile,
    } = this.props;

    if (measureIsActive || isCoordinateSearchActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const exceededLengthLimit = clickObj.exceededLengthLimit || false;
    const dialogId = isVectorModalOpen ? modalState.id : `vector_dialog${pixels[0]}${pixels[1]}`;

    const mapRes = map.getView().getResolution();
    const hasNonClickableVectorLayerType = hasNonClickableVectorLayer(activeLayers, mapRes, proj.id, isMobile);

    if (metaArray.length) {
      if (hasNonClickableVectorLayerType) {
        activateVectorZoomAlert();
      } else {
        openVectorDialog(dialogId, metaArray, offsetLeft, offsetTop, browser, isEmbedModeActive);
        if (exceededLengthLimit) {
          activateVectorExceededResultsAlert();
        } else if (isVectorExceededAlertPresent) {
          clearVectorExceededResultsAlert();
        }
      }
    } else if (hasNonClickableVectorLayerType) {
      activateVectorZoomAlert();
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      if (isMobile && hasNonClickableVectorLayerType) return;
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  render() {
    return null;
  }
}

function mapStateToProps(state) {
  const {
    alerts, modal, map, measure, vectorStyles, browser, compare, locationSearch, proj, ui, embed,
  } = state;
  let swipeOffset;
  const activeLayers = getActiveLayers(state);
  if (compare.active && compare.mode === 'swipe') {
    const percentOffset = state.compare.value || 50;
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }
  const { isCoordinateSearchActive } = locationSearch;
  const { isVectorExceededAlertPresent } = alerts;
  const isMobile = browser.lessThan.medium;
  return {
    activeLayers,
    browser,
    isMobile,
    isCoordinateSearchActive,
    compareState: compare,
    getDialogObject: (pixels, olMap) => onMapClickGetVectorFeatures(pixels, olMap, state, swipeOffset),
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isEmbedModeActive: embed.isEmbedModeActive,
    isVectorExceededAlertPresent,
    isShowingClick: map.isClickable,
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive,
    modalState: modal,
    proj,
    swipeOffset,
  };
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
  activateVectorZoomAlert: () => dispatch({ type: ACTIVATE_VECTOR_ZOOM_ALERT }),
  activateVectorExceededResultsAlert: () => dispatch({ type: ACTIVATE_VECTOR_EXCEEDED_ALERT }),
  clearVectorExceededResultsAlert: () => dispatch({ type: DISABLE_VECTOR_EXCEEDED_ALERT }),
  openVectorDialog: (dialogId, metaArray, offsetLeft, offsetTop, browser, isEmbedModeActive) => {
    const { screenHeight, screenWidth } = browser;
    const isMobile = browser.lessThan.medium;
    const dialogKey = new Date().getUTCMilliseconds();
    const modalClassName = isEmbedModeActive && !isMobile ? 'vector-modal light modal-embed' : 'vector-modal light';
    const mobileTopOffset = 106;
    dispatch(openCustomContent(dialogId,
      {
        backdrop: false,
        clickableBehindModal: true,
        desktopOnly: false,
        isDraggable: !isMobile,
        wrapClassName: 'vector-modal-wrap',
        modalClassName,
        CompletelyCustomModal: vectorDialog,
        isResizable: !isMobile,
        mobileFullScreen: true,
        dragHandle: '.modal-header',
        dialogKey,
        key: dialogKey,
        vectorMetaObject: lodashGroupBy(metaArray, 'id'),
        width: isMobile ? screenWidth : 445,
        height: isMobile ? screenHeight - mobileTopOffset : 300,
        offsetLeft: isMobile ? 0 : offsetLeft,
        offsetTop: isMobile ? 40 : offsetTop,
        timeout: 0,
        onClose: () => {
          setTimeout(() => {
            dispatch(selectVectorFeaturesActionCreator({}));
          }, 1);
        },
      }));
  },
});

VectorInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDialog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  activateVectorZoomAlert: PropTypes.func,
  activateVectorExceededResultsAlert: PropTypes.func,
  clearVectorExceededResultsAlert: PropTypes.func,
  activeLayers: PropTypes.array,
  browser: PropTypes.object,
  compareState: PropTypes.object,
  isEmbedModeActive: PropTypes.bool,
  isVectorExceededAlertPresent: PropTypes.bool,
  isCoordinateSearchActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
  proj: PropTypes.object,
  swipeOffset: PropTypes.number,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VectorInteractions);
