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
import { hasNonClickableVectorLayer } from '../../modules/layers/util';
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
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    const { mouseEvents } = this.props;
    mouseEvents.on('mousemove', this.mouseMove);
    mouseEvents.on('singleclick', this.singleClick);
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    const {
      isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset, proj,
      granuleCMRGeometry, granuleLayerId, hoveredGranule, toggleHoveredGranule,
    } = this.props;

    if (granuleCMRGeometry) {
      let toggledGranuleFootprint;
      const gcmr = Object.keys(granuleCMRGeometry).map((key) => ({ [key]: granuleCMRGeometry[key] }));

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
        const polygon = new OlGeomPolygon([geomVertices]);
        const areCoordsWithinPolygon = polygon.intersectsCoordinate([coord[0], coord[1]]);

        // if coordinates within granule footprint, toggle to show with map/ui
        if (areCoordsWithinPolygon) {
          //! MULTIPLE POLYGONS CONTAIN COORDS, BUT ONLY MOST RECENT DATE IS DISPLAYED
          //! SHOULD THIS BEHAVIOR BE BLOCKED/DEBOUNCED?
          toggledGranuleFootprint = true;
          toggleHoveredGranule(granuleLayerId, date);
        }
      }

      if (hoveredGranule && !toggledGranuleFootprint) {
        toggleHoveredGranule(granuleLayerId, null);
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
      activateVectorAlert, proj,
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
      const hasNonClickableVectorLayerType = hasNonClickableVectorLayer(activeLayers, mapRes, proj.id);

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
    modal, map, measure, vectorStyles, browser, compare, proj, ui, layers,
  } = state;
  let swipeOffset;
  const groupName = compare.activeString;
  const activeLayers = layers[groupName];
  if (compare.active && compare.mode === 'swipe') {
    const percentOffset = state.compare.value || 50;
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }

  let granuleCMRGeometry;
  let granuleLayerId;
  const { hoveredGranule } = layers;

  // TODO: CURRENTLY RELYING ON PROVIDED LAYER ID, NEED TO SET UP GLOBAL LAYER STATE WITH CURRENT "FAMILY" OF SATELLITE/PRODUCT

  // determine how the granules can be grouped - is any granule that starts with 'VIIRS_NOAA20_CorrectedReflectance_' in the layer ID enough?
  // when granule is added, that CMR data is added to family object instead of individual layer object
  // when ALL are removed, that family object is destroyed
  // cannot have more than one family object at a time

  const isGranuleIdOptions = {
    VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT: true,
    'VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT': true,
    'VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1_Granule_v1_NRT': true,
  };
  const isActiveGranuleVisible = layers.active.filter((layer) => layer.visible && isGranuleIdOptions[layer.id]);
  if (isActiveGranuleVisible.length && layers.granuleLayers[groupName] && layers.granuleLayers[groupName].VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT) {
    granuleCMRGeometry = layers.granuleLayers[groupName].VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT.geometry;
    granuleLayerId = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT';
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
    granuleLayerId,
    hoveredGranule,
    compareState: compare,
    swipeOffset,
    proj,
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
  compareState: PropTypes.object,
  granuleCMRGeometry: PropTypes.object,
  granuleLayerId: PropTypes.string,
  hoveredGranule: PropTypes.object,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
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
