import { connect } from 'react-redux';
import {
  throttle as lodashThrottle,
  get as lodashGet,
  includes as lodashIncludes,
  groupBy as lodashGroupBy,
} from 'lodash';
import { useState, useEffect, useRef } from 'react';
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
import usePrevious from '../../util/customHooks';
import {
  GRANULE_HOVERED,
  GRANULE_HOVER_UPDATE,
  MAP_SINGLE_CLICK,
  MAP_MOUSE_MOVE,
  MAP_MOUSE_OUT,
  MAP_MOVE_END,
} from '../../util/constants';

const { events } = util;

export function VectorInteractions(props) {
  const {
    granuleFootprints,
    compareState,
    granulePlatform,
    swipeOffset,
    visibleExtent,
    isShowingClick,
    changeCursor,
    measureIsActive,
    proj,
    isCoordinateSearchActive,
    isMobile,
    screenSize,
    lastSelected,
    openVectorDialog,
    onCloseModal,
    selectVectorFeatures,
    modalState,
    getDialogObject,
    activeLayers,
    activateVectorZoomAlert,
    activateVectorExceededResultsAlert,
    clearVectorExceededResultsAlert,
    isEmbedModeActive,
    isVectorExceededAlertPresent,
  } = props;

  const [granuleDate, setGranuleDate] = useState(null);
  const [, setGranulePlatformState] = useState(null);

  const granuleDateRef = useRef(granuleDate);
  const granulePlatformRef = useRef(granulePlatform);
  const granuleFootprintsRef = useRef(granuleFootprints);
  const isShowingClickRef = useRef(isShowingClick);

  const prevGranuleFootprints = usePrevious(granuleFootprints);

  function mouseOut() {
    mouseMoveThrottled.cancel();
    events.trigger(GRANULE_HOVERED, null);
  };

  function mouseMove({ pixel }, map, crs) {
    const coord = map.getCoordinateFromPixel(pixel);
    const [lon, lat] = transform(coord, crs, CRS.GEOGRAPHIC);

    if (measureIsActive || isCoordinateSearchActive) {
      return;
    }
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    if (granuleFootprints && !isMobile) {
      handleGranuleHover(pixel, coord);
    }
    handleCursorChange(pixel, map, lon, lat);
  }

  const options = { leading: true, trailing: true };
  const mouseMoveThrottled = lodashThrottle(mouseMove, 200, options);
  const mouseOutThrottled = lodashThrottle(mouseOut, 200, options);

  useEffect(() => {
    events.on(MAP_MOVE_END, moveEnd);
    events.on(MAP_MOUSE_MOVE, mouseMoveThrottled);
    events.on(MAP_MOUSE_OUT, mouseOutThrottled);
    events.on(MAP_SINGLE_CLICK, singleClick);

    return () => {
      events.off(MAP_MOVE_END, moveEnd);
      events.off(MAP_MOUSE_MOVE, mouseMoveThrottled);
      events.off(MAP_MOUSE_OUT, mouseOutThrottled);
      events.off(MAP_SINGLE_CLICK, singleClick);
    };
  }, []);

  useEffect(() => {
    if (granuleDate && prevGranuleFootprints !== granuleFootprints) {
      clearGranuleFootprint();
    }
  }, [granuleDate, granuleFootprints]);

  useEffect(() => {
    granuleDateRef.current = granuleDate;
  }, [granuleDate]);

  useEffect(() => {
    granulePlatformRef.current = granulePlatform;
  }, [granulePlatform]);

  useEffect(() => {
    granuleFootprintsRef.current = granuleFootprints;
  }, [granuleFootprints]);

  useEffect(() => {
    isShowingClickRef.current = isShowingClick;
  }, [isShowingClick]);

  function clearGranuleFootprint() {
    setGranuleDate(null);
    setGranulePlatformState(null);
    events.trigger(GRANULE_HOVERED, null);
  }

  /**
  * Handle mouse over granule geometry and trigger action to show granule date footprint
  *
  * @param {Array} pixels
  * @param {Array} coord
  */
  function handleGranuleHover(pixels, mouseCoords) {
    const { active: compareActive, activeString } = compareState;

    let toggledGranuleFootprint;

    // only allow hover footprints on selected side of A/B comparison
    if (compareActive &&
      !isFromActiveCompareRegion(pixels, activeString, swipeOffset, compareState)) {
      return;
    }

    // check if coordinates and polygon extent are within and not exceeding max extent
    Object
      .keys(granuleFootprintsRef.current)
      .forEach((date) => {
        const points = granuleFootprintsRef.current[date];
        const isValidPolygon = areCoordinatesAndPolygonExtentValid(
          points,
          mouseCoords,
          visibleExtent,
        );
        if (isValidPolygon) {
          toggledGranuleFootprint = true;
          events.trigger(GRANULE_HOVERED, granulePlatformRef.current, date);
          setGranuleDate(date);
          setGranulePlatformState(granulePlatformRef.current);
        }
      });

    if (!toggledGranuleFootprint) {
      clearGranuleFootprint();
    }
  };

  function handleCursorChange(pixel, map, lon, lat) {
    const hasFeatures = map.hasFeatureAtPixel(pixel);

    if (hasFeatures && !isShowingClickRef.current && !measureIsActive) {
      let isActiveLayer = false;
      let isReferenceLayer = false;
      map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        if (!layer) return;
        const def = lodashGet(layer, 'wv.def');
        if (!def) return;
        if (def?.layergroup === 'Reference') isReferenceLayer = true;
        const layerExtent = layer.get('extent');
        const pixelCoords = map.getCoordinateFromPixel(pixel);
        const featureOutsideExtent = layerExtent &&
        !olExtent.containsCoordinate(layerExtent, pixelCoords);
        if (lodashIncludes(def.clickDisabledFeatures, feature.getGeometry().getType()) ||
          featureOutsideExtent) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped
          ? lon > -250 ||
        lon < 250 || lat > -90 || lat < 90
          : true;
        if (isRenderedFeature &&
          isFromActiveCompareRegion(pixel, layer.wv.group, swipeOffset, compareState)) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer && !isReferenceLayer) {
        changeCursor(true);
      }
    } else if (!hasFeatures && isShowingClickRef.current) {
      changeCursor(false);
    }
  }

  function moveEnd() {
    if (granuleDateRef.current && granulePlatformRef.current) {
      events.trigger(GRANULE_HOVER_UPDATE, granulePlatformRef.current, granuleDateRef.current);
    }
  }

  function singleClick(e, map) {
    if (measureIsActive || isCoordinateSearchActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    let clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const isAeronet = !!metaArray[0] && metaArray[0].id.includes('AERONET');
    const aeronetMobileSize = isAeronet ? 250 : 445;
    clickObj = getDialogObject(pixels, map, isMobile
      ? screenSize.screenWidth
      : aeronetMobileSize);
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const isCoordinatesMarker = clickObj.isCoordinatesMarker || false;
    const exceededLengthLimit = clickObj.exceededLengthLimit || false;
    const vectorModalOpenId = isVectorModalOpen ? modalState.id : `vector_dialog${pixels[0]}${pixels[1]}`;
    const dialogId = clickObj.modalShouldFollowClicks ? `vector_dialog${pixels[0]}${pixels[1]}` : vectorModalOpenId;

    if (isCoordinatesMarker) return;

    const mapRes = map.getView().getResolution();
    const hasNonClickableVectorLayerType = hasNonClickableVectorLayer(
      activeLayers,
      mapRes,
      proj.id,
      isMobile,
    );

    if (isMobile) {
      const coord = map.getCoordinateFromPixel(pixels);
      handleGranuleHover(pixels, coord);
    }

    if (metaArray.length) {
      if (hasNonClickableVectorLayerType && !isAeronet) {
        activateVectorZoomAlert();
      } else {
        openVectorDialog(
          dialogId,
          metaArray,
          offsetLeft,
          offsetTop,
          screenSize,
          isEmbedModeActive,
          isAeronet,
        );
        if (exceededLengthLimit) {
          activateVectorExceededResultsAlert();
        } else if (isVectorExceededAlertPresent) {
          clearVectorExceededResultsAlert();
        }
      }
    } else if (hasNonClickableVectorLayerType) {
      activateVectorZoomAlert();
    }
    if (Object.entries(selected).length ||
    (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      if (isMobile && hasNonClickableVectorLayerType) return;
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  return null;
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
    getDialogObject: (pixels, olMap, modalWidth) => onMapClickGetVectorFeatures(
      pixels,
      olMap,
      state,
      swipeOffset,
      modalWidth,
    ),
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
  openVectorDialog: (
    dialogId,
    metaArray,
    offsetLeft,
    offsetTop,
    screenSize,
    isEmbedModeActive,
    isAeronet,
  ) => {
    const { screenHeight, screenWidth } = screenSize;
    const isMobile = screenSize.isMobileDevice;
    const dialogKey = new Date().getUTCMilliseconds();
    const modalClassName = isEmbedModeActive && !isMobile ? 'vector-modal light modal-embed' : 'vector-modal light';
    const mobileTopOffset = 106;
    const aeroNetModalWidth = isAeronet ? 250 : 445;
    const modalWidth = isMobile ? screenWidth : aeroNetModalWidth;
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
  visibleExtent: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  onCloseModal: PropTypes.func.isRequired,
  openVectorDialog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  compareState: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  granuleFootprints: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  granulePlatform: PropTypes.string,
  activateVectorZoomAlert: PropTypes.func,
  activateVectorExceededResultsAlert: PropTypes.func,
  clearVectorExceededResultsAlert: PropTypes.func,
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  screenSize: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  isEmbedModeActive: PropTypes.bool,
  isVectorExceededAlertPresent: PropTypes.bool,
  isCoordinateSearchActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  proj: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  swipeOffset: PropTypes.number,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VectorInteractions);
