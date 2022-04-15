import { connect } from 'react-redux';
import {
  debounce as lodashDebounce,
  get as lodashGet,
  includes as lodashIncludes,
  groupBy as lodashGroupBy,
} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Polygon as OlGeomPolygon } from 'ol/geom';
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

const { events } = util;

export class VectorInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.mouseOut = lodashDebounce(this.mouseOut.bind(this), 8);
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

  /**
  * Handle mouse over granule geometry and trigger action to show granule date footprint
  *
  * @param {Object} granuleFootprints
  * @param {Object} map
  * @param {String} crs
  * @param {Array} pixels
  * @param {Array} coord
  *
  * @return {Boolean} to indicate if valid for parent mouseMove function
  */
  handleGranuleHover = (crs, pixels, mouseCoords) => {
    const {
      compareState,
      granulePlatform,
      granuleFootprints,
      maxExtent,
      swipeOffset,
    } = this.props;
    const { active, activeString } = compareState;
    const polygon = new OlGeomPolygon([]);
    let toggledGranuleFootprint;

    // reverse granule geometry so most recent granules are on top
    const footprints = Object
      .keys(granuleFootprints)
      .reverse()
      .map((key) => ({ [key]: granuleFootprints[key] }));

    // only allow hover footprints on selected side of A/B comparison
    if (active) {
      const isOnActiveCompareSide = isFromActiveCompareRegion(pixels, activeString, compareState, swipeOffset);
      if (!isOnActiveCompareSide) {
        events.trigger('granule-hovered', null);
        return false;
      }
    }

    // check if coordinates and polygon extent are within and not exceeding max extent
    footprints.forEach((footprint) => {
      const [date] = Object.keys(footprint);
      const [points] = Object.values(footprint);
      polygon.setCoordinates([points]);
      const isValidPolygon = areCoordinatesAndPolygonExtentValid(polygon, mouseCoords, maxExtent);
      if (isValidPolygon) {
        toggledGranuleFootprint = true;
        events.trigger('granule-hovered', granulePlatform, date);
      }
    });

    if (!toggledGranuleFootprint) {
      events.trigger('granule-hovered', granulePlatform, null);
    }
    return true;
  }

  mouseOut() {
    const {
      granulePlatform,
    } = this.props;
    events.trigger('granule-hovered', granulePlatform);
  }

  mouseMove(event, map, crs) {
    const {
      isShowingClick, changeCursor, isCoordinateSearchActive, measureIsActive, compareState, swipeOffset, proj, granuleFootprints,
    } = this.props;

    if (measureIsActive || isCoordinateSearchActive) {
      return;
    }
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    // handle granule footprint hover, will break out with false return if on wrong compare A/B side
    if (granuleFootprints) {
      const isValidGranule = this.handleGranuleHover(crs, pixels, coord);
      if (!isValidGranule) {
        return;
      }
    }

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
        if (isRenderedFeature && isFromActiveCompareRegion(pixels, layer.wv.group, compareState, swipeOffset)) {
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
    animation,
    browser,
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
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }

  const granuleFootprints = getActiveGranuleFootPrints(state);
  const granulePlatform = getGranulePlatform(state);

  const { maxExtent } = config.projections[proj.id];

  return {
    activeLayers,
    browser,
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
    isMobile: browser.lessThan.medium,
    granuleFootprints,
    granulePlatform,
    swipeOffset,
    proj,
    maxExtent,
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
  compareState: PropTypes.object,
  granuleFootprints: PropTypes.object,
  granulePlatform: PropTypes.string,
  activateVectorZoomAlert: PropTypes.func,
  activateVectorExceededResultsAlert: PropTypes.func,
  clearVectorExceededResultsAlert: PropTypes.func,
  activeLayers: PropTypes.array,
  browser: PropTypes.object,
  isEmbedModeActive: PropTypes.bool,
  isVectorExceededAlertPresent: PropTypes.bool,
  isCoordinateSearchActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
  maxExtent: PropTypes.array,
  proj: PropTypes.object,
  swipeOffset: PropTypes.number,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VectorInteractions);
