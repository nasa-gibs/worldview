import { connect } from 'react-redux';
import {
  throttle as lodashThrottle,
  get as lodashGet,
  includes as lodashIncludes,
  groupBy as lodashGroupBy,
} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import * as olExtent from 'ol/extent';
import { transform } from 'ol/proj';
import { isFromActiveCompareRegion } from '../../modules/compare/util';
import {
  hasNonClickableVectorLayer,
} from '../../modules/layers/util';
import { areCoordinatesAndPolygonExtentValid } from '../../map/granule/util';
import {
  getActiveLayers, getGranulePlatform, getActiveGranuleFootPrints,
} from '../../modules/layers/selectors';
import vectorDialog from '../vector-dialog';
import { onMapClickGetVectorFeatures } from '../../modules/vector-styles/util';
import { openCustomContent, onClose } from '../../modules/modal/actions';
import { selectVectorFeatures as selectVectorFeaturesActionCreator } from '../../modules/vector-styles/actions';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
import { ACTIVATE_VECTOR_ZOOM_ALERT, ACTIVATE_VECTOR_EXCEEDED_ALERT, DISABLE_VECTOR_EXCEEDED_ALERT } from '../../modules/alerts/constants';
import util from '../../util/util';
import { CRS, FULL_MAP_EXTENT } from '../../modules/map/constants';
import {
  GRANULE_HOVERED,
  GRANULE_HOVER_UPDATE,
  MAP_SINGLE_CLICK,
  MAP_MOUSE_MOVE,
  MAP_MOUSE_OUT,
  MAP_MOVE_END,
} from '../../util/constants';

const { events } = util;

export class VectorInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      granuleDate: null,
      granulePlatform: null,
    };
    const options = { leading: true, trailing: true };
    this.mouseMove = lodashThrottle(this.mouseMove.bind(this), 200, options);
    this.mouseOut = lodashThrottle(this.mouseOut.bind(this), 200, options);
    this.moveEnd = this.moveEnd.bind(this);
    this.singleClick = this.singleClick.bind(this);
  }

  componentDidMount() {
    events.on(MAP_MOVE_END, this.moveEnd);
    events.on(MAP_MOUSE_MOVE, this.mouseMove);
    events.on(MAP_MOUSE_OUT, this.mouseOut);
    events.on(MAP_SINGLE_CLICK, this.singleClick);
  }

  componentWillUnmount() {
    events.off(MAP_MOVE_END, this.moveEnd);
    events.off(MAP_MOUSE_MOVE, this.mouseMove);
    events.off(MAP_MOUSE_OUT, this.mouseOut);
    events.off(MAP_SINGLE_CLICK, this.singleClick);
  }

  clearGranuleFootprint() {
    this.setState({ granuleDate: null, granulePlatform: null });
    events.trigger(GRANULE_HOVERED, null);
  }

  /**
  * Handle mouse over granule geometry and trigger action to show granule date footprint
  *
  * @param {Array} pixels
  * @param {Array} coord
  */
  handleGranuleHover = (pixels, mouseCoords) => {
    const {
      compareState,
      granulePlatform,
      granuleFootprints,
      swipeOffset,
      visibleExtent,
    } = this.props;
    const { active: compareActive, activeString } = compareState;

    let toggledGranuleFootprint;

    // only allow hover footprints on selected side of A/B comparison
    if (compareActive && !isFromActiveCompareRegion(pixels, activeString, compareState, swipeOffset)) {
      return;
    }

    // check if coordinates and polygon extent are within and not exceeding max extent
    Object
      .keys(granuleFootprints)
      .forEach((date) => {
        const points = granuleFootprints[date];
        const isValidPolygon = areCoordinatesAndPolygonExtentValid(points, mouseCoords, visibleExtent);
        if (isValidPolygon) {
          toggledGranuleFootprint = true;
          events.trigger(GRANULE_HOVERED, granulePlatform, date);
          this.setState({ granulePlatform, granuleDate: date });
        }
      });

    if (!toggledGranuleFootprint) {
      this.clearGranuleFootprint();
    }
  };

  handleCursorChange(pixel, map, lon, lat) {
    const {
      isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset, proj,
    } = this.props;
    const hasFeatures = map.hasFeatureAtPixel(pixel);

    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        if (!layer) return;
        const def = lodashGet(layer, 'wv.def');
        const layerExtent = layer.get('extent');
        const pixelCoords = map.getCoordinateFromPixel(pixel);
        const featureOutsideExtent = layerExtent && !olExtent.containsCoordinate(layerExtent, pixelCoords);
        if (!def || lodashIncludes(def.clickDisabledFeatures, feature.getType()) || featureOutsideExtent) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped ? lon > -250 || lon < 250 || lat > -90 || lat < 90 : true;
        if (isRenderedFeature && isFromActiveCompareRegion(pixel, layer.wv.group, compareState, swipeOffset)) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer) {
        changeCursor(true);
      }
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  moveEnd() {
    const { granuleDate, granulePlatform } = this.state;
    if (granuleDate && granulePlatform) {
      events.trigger(GRANULE_HOVER_UPDATE, granulePlatform, granuleDate);
    }
  }

  mouseOut = () => {
    this.mouseMove.cancel();
    events.trigger(GRANULE_HOVERED, null);
  };

  mouseMove({ pixel }, map, crs) {
    const {
      isCoordinateSearchActive, measureIsActive, granuleFootprints,
    } = this.props;
    const coord = map.getCoordinateFromPixel(pixel);
    const [lon, lat] = transform(coord, crs, CRS.GEOGRAPHIC);

    if (measureIsActive || isCoordinateSearchActive) {
      return;
    }
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    if (granuleFootprints) {
      this.handleGranuleHover(pixel, coord);
    }
    this.handleCursorChange(pixel, map, lon, lat);
  }

  singleClick(e, map) {
    const {
      screenSize, lastSelected, openVectorDialog, onCloseModal, selectVectorFeatures,
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
    const isCoordinatesMarker = clickObj.isCoordinatesMarker || false;
    const exceededLengthLimit = clickObj.exceededLengthLimit || false;
    const dialogId = clickObj.modalShouldFollowClicks ? `vector_dialog${pixels[0]}${pixels[1]}` : isVectorModalOpen ? modalState.id : `vector_dialog${pixels[0]}${pixels[1]}`;

    if (isCoordinatesMarker) return;

    const mapRes = map.getView().getResolution();
    const hasNonClickableVectorLayerType = hasNonClickableVectorLayer(activeLayers, mapRes, proj.id, isMobile);

    if (metaArray.length) {
      if (hasNonClickableVectorLayerType) {
        activateVectorZoomAlert();
      } else {
        openVectorDialog(dialogId, metaArray, offsetLeft, offsetTop, screenSize, isEmbedModeActive);
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
    animation,
    screenSize,
    compare,
    config,
    map,
    measure,
    modal,
    proj,
    ui,
    vectorStyles,
    alerts,
    locationSearch,
    embed,
  } = state;
  const {
    active,
    mode,
    value,
  } = compare;
  const { isPlaying } = animation;
  const activeLayers = getActiveLayers(state);
  const { isCoordinateSearchActive } = locationSearch;
  const { isVectorExceededAlertPresent } = alerts;

  let swipeOffset;
  if (active && mode === 'swipe') {
    const percentOffset = value || 50;
    swipeOffset = screenSize.screenWidth * (percentOffset / 100);
  }

  const granuleFootprints = getActiveGranuleFootPrints(state);
  const granulePlatform = getGranulePlatform(state);

  const { maxExtent } = config.projections[proj.id];
  const visibleExtent = proj.selected.crs === CRS.GEOGRAPHIC ? FULL_MAP_EXTENT : maxExtent;

  return {
    activeLayers,
    screenSize,
    isCoordinateSearchActive,
    compareState: compare,
    getDialogObject: (pixels, olMap) => onMapClickGetVectorFeatures(pixels, olMap, state, swipeOffset),
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isEmbedModeActive: embed.isEmbedModeActive,
    isVectorExceededAlertPresent,
    isShowingClick: map.isClickable,
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive,
    isPlaying,
    isMobile: screenSize.isMobileDevice,
    granuleFootprints,
    granulePlatform,
    swipeOffset,
    proj,
    visibleExtent,
    modalState: modal,
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
  openVectorDialog: (dialogId, metaArray, offsetLeft, offsetTop, screenSize, isEmbedModeActive) => {
    const { screenHeight, screenWidth } = screenSize;
    const isMobile = screenSize.isMobileDevice;
    const dialogKey = new Date().getUTCMilliseconds();
    const modalClassName = isEmbedModeActive && !isMobile ? 'vector-modal light modal-embed' : 'vector-modal light';
    const mobileTopOffset = 106;
    const modalWidth = isMobile ? screenWidth : 445;
    const modalHeight = isMobile ? screenHeight - mobileTopOffset : 300;

    dispatch(openCustomContent(
      dialogId,
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
        width: modalWidth,
        height: modalHeight,
        offsetLeft: isMobile ? 0 : offsetLeft,
        offsetTop: isMobile ? 40 : offsetTop,
        timeout: 0,
        onClose: () => {
          setTimeout(() => {
            dispatch(selectVectorFeaturesActionCreator({}));
          }, 1);
        },
      },
    ));
  },
});

VectorInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  visibleExtent: PropTypes.array,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDialog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  compareState: PropTypes.object,
  granuleFootprints: PropTypes.object,
  granulePlatform: PropTypes.string,
  activateVectorZoomAlert: PropTypes.func,
  activateVectorExceededResultsAlert: PropTypes.func,
  clearVectorExceededResultsAlert: PropTypes.func,
  activeLayers: PropTypes.array,
  screenSize: PropTypes.object,
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
