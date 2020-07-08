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
  areCoordinatesAndPolygonExtentValid,
} from '../../modules/layers/util';
import vectorDialog from '../vector-dialog';
import { onMapClickGetVectorFeatures } from '../../modules/vector-styles/util';
import { openCustomContent, onClose } from '../../modules/modal/actions';
import { toggleHoveredGranule } from '../../modules/layers/actions';
import { selectVectorFeatures as selectVectorFeaturesActionCreator } from '../../modules/vector-styles/actions';
import { changeCursor as changeCursorActionCreator } from '../../modules/map/actions';
import { ACTIVATE_VECTOR_ALERT } from '../../modules/alerts/constants';

export class VectorInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.mouseOut = lodashDebounce(this.mouseOut.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    const { mouseEvents } = this.props;
    mouseEvents.on('mousemove', this.mouseMove);
    mouseEvents.on('mouseout', this.mouseOut);
    mouseEvents.on('singleclick', this.singleClick);
  }

  /**
  * Handle mouse over granule geometry and trigger action to show granule date footprint
  *
  * @param {Object} granuleCMRGeometry
  * @param {Object} map
  * @param {String} crs
  * @param {Array} pixels
  * @param {Array} coord
  *
  * @return {Boolean}
  */
  handleGranuleHover = (granuleCMRGeometry, map, crs, pixels, coord) => {
    const {
      active,
      activeString,
      compareState,
      granuleSatelliteInstrument,
      hoveredGranule,
      maxExtent,
      swipeOffset,
      toggleHoveredGranule,
    } = this.props;

    let toggledGranuleFootprint;
    // reverse granule geometry so most recent granules are on top
    const gcmr = Object.keys(granuleCMRGeometry).reverse().map((key) => ({ [key]: granuleCMRGeometry[key] }));
    // only allow hover footprints on selected side of A/B comparison
    if (active) {
      const isOnActiveCompareSide = isFromActiveCompareRegion(map, pixels, { group: activeString }, compareState, swipeOffset);
      if (!isOnActiveCompareSide) {
        if (hoveredGranule) {
          toggleHoveredGranule(granuleSatelliteInstrument, null);
        }
        return false;
      }
    }

    const polygon = new OlGeomPolygon([]);
    for (let i = 0; i < gcmr.length; i += 1) {
      const granObj = gcmr[i];
      const date = Object.keys(granObj)[0];
      const geom = Object.values(granObj)[0];

      // string coord to num and transform is polar projections
      const geomVertices = geom.map((xy) => {
        const coordNums = [parseFloat(xy[0]), parseFloat(xy[1])];
        // transform for non geographic projections
        if (crs !== 'EPSG:4326') {
          return transform(coordNums, 'EPSG:4326', crs);
        }
        return coordNums;
      });

      // update geom polygon for precise coordinate intersect inclusion check
      polygon.setCoordinates([geomVertices]);
      // check if coordinates and polygon extent are within and not exceeding max extent
      const isValidPolygon = areCoordinatesAndPolygonExtentValid(polygon, [coord[0], coord[1]], maxExtent);
      if (isValidPolygon) {
        toggledGranuleFootprint = true;
        // prevent multiple calls if same hovered granule
        if (hoveredGranule) {
          const { granuleDate, hoveredSatelliteInstrumentGroup } = hoveredGranule;
          // if (granuleDate) {
          const granuleAlreadyHovered = granuleSatelliteInstrument === hoveredSatelliteInstrumentGroup
              && granuleDate === date
              && activeString === hoveredGranule.activeString;
          if (granuleAlreadyHovered) {
            return true;
          }
          // }
        }
        // toggle to show with map/ui
        toggleHoveredGranule(granuleSatelliteInstrument, date);
      }
    }

    if (hoveredGranule && !toggledGranuleFootprint) {
      toggleHoveredGranule(granuleSatelliteInstrument, null);
    }
    return true;
  }

  mouseOut() {
    const {
      granuleSatelliteInstrument, hoveredGranule, toggleHoveredGranule,
    } = this.props;
    if (hoveredGranule) {
      toggleHoveredGranule(granuleSatelliteInstrument, null);
    }
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    const {
      changeCursor,
      compareState,
      granuleCMRGeometry,
      isShowingClick,
      measureIsActive,
      proj,
      swipeOffset,
    } = this.props;

    // handle granule footprint hover, will break out with false return if on wrong compare A/B side
    if (granuleCMRGeometry) {
      const isValidGranule = this.handleGranuleHover(granuleCMRGeometry, map, crs, pixels, coord);
      if (!isValidGranule) {
        return;
      }
    }

    const [lon, lat] = coord;
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
        if (isRenderedFeature && isFromActiveCompareRegion(map, pixels, layer.wv, compareState, swipeOffset)) {
          isActiveLayer = true;
        }
      });
      if (isActiveLayer) changeCursor(true);
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
  }

  singleClick(e, map) {
    const {
      lastSelected, openVectorDiaglog, onCloseModal, selectVectorFeatures,
      modalState, getDialogObject, measureIsActive, isMobile, activeLayers,
      activateVectorAlert,
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

      if (hasNonClickableVectorLayerType) {
        activateVectorAlert();
      }
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
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
    browser,
    compare,
    config,
    layers,
    map,
    measure,
    modal,
    proj,
    ui,
    vectorStyles,
  } = state;
  const {
    active,
    activeString,
    mode,
    value,
  } = compare;
  const activeLayers = layers[activeString];
  let swipeOffset;
  if (active && mode === 'swipe') {
    const percentOffset = value || 50;
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }

  let granuleCMRGeometry;
  let granuleSatelliteInstrument;
  const {
    hoveredGranule,
    granuleLayers,
    granuleGeometry,
    granuleSatelliteInstrumentGroup,
  } = layers;
  const { maxExtent } = config.projections[proj.id];
  const isActiveGranuleVisible = layers.active.filter((layer) => layer.visible && layer.isGranule);
  if (isActiveGranuleVisible.length && granuleLayers[activeString]) {
    granuleSatelliteInstrument = granuleSatelliteInstrumentGroup[activeString];
    granuleCMRGeometry = granuleGeometry[activeString];
  }

  return {
    modalState: modal,
    isShowingClick: map.isClickable,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    getDialogObject: (pixels, olMap) => onMapClickGetVectorFeatures(pixels, olMap, state, swipeOffset),
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive,
    isMobile: browser.lessThan.medium,
    granuleCMRGeometry,
    granuleSatelliteInstrument,
    hoveredGranule,
    compareState: compare,
    swipeOffset,
    proj,
    maxExtent,
    active,
    activeString,
    activeLayers,
  };
} const mapDispatchToProps = (dispatch) => ({
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
  toggleHoveredGranule: (id, granuleDate) => {
    dispatch(toggleHoveredGranule(id, granuleDate));
  },
});
VectorInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDiaglog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  active: PropTypes.bool,
  activeString: PropTypes.string,
  compareState: PropTypes.object,
  granuleCMRGeometry: PropTypes.object,
  granuleSatelliteInstrument: PropTypes.string,
  hoveredGranule: PropTypes.object,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
  maxExtent: PropTypes.array,
  proj: PropTypes.object,
  swipeOffset: PropTypes.number,
  activeLayers: PropTypes.array,
  activateVectorAlert: PropTypes.func,
  toggleHoveredGranule: PropTypes.func,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(VectorInteractions);
