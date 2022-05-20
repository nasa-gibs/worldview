import { connect } from 'react-redux';
import {
  throttle as lodashThrottle,
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
import { FULL_MAP_EXTENT } from '../../modules/map/constants';

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
    events.on('map:moveend', this.moveEnd);
    events.on('map:mousemove', this.mouseMove);
    events.on('map:mouseout', this.mouseOut);
    events.on('map:singleclick', this.singleClick);
  }

  componentWillUnmount() {
    events.off('map:moveend', this.moveEnd);
    events.off('map:mousemove', this.mouseMove);
    events.off('map:mouseout', this.mouseOut);
    events.off('map:singleclick', this.singleClick);
  }

  clearGranuleFootprint() {
    this.setState({ granuleDate: null, granulePlatform: null });
    events.trigger('granule-hovered', null);
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
    const polygon = new OlGeomPolygon([]);
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
        polygon.setCoordinates([points]);
        const isValidPolygon = areCoordinatesAndPolygonExtentValid(polygon, mouseCoords, visibleExtent);
        if (isValidPolygon) {
          toggledGranuleFootprint = true;
          events.trigger('granule-hovered', granulePlatform, date);
          this.setState({ granulePlatform, granuleDate: date });
        }
      });

    if (!toggledGranuleFootprint) {
      this.clearGranuleFootprint();
    }
  }

  handleCursorChange(pixel, map, lon, lat) {
    const {
      isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset, proj,
    } = this.props;
    const hasFeatures = map.hasFeatureAtPixel(pixel);

    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        const def = lodashGet(layer, 'wv.def');
        if (!def || lodashIncludes(def.clickDisabledFeatures, feature.getType())) return;
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
      events.trigger('granule-hover-update', granulePlatform, granuleDate);
    }
  }

  mouseOut = () => {
    this.mouseMove.cancel();
    events.trigger('granule-hovered', null);
  }

  mouseMove({ pixel }, map, crs) {
    const {
      isCoordinateSearchActive, measureIsActive, granuleFootprints,
    } = this.props;
    const coord = map.getCoordinateFromPixel(pixel);
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');

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
  const visibleExtent = proj.selected.crs === 'EPSG:4326' ? FULL_MAP_EXTENT : maxExtent;

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
  browser: PropTypes.object,
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
