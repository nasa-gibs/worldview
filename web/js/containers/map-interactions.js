import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../components/map/ol-coordinates';
import {
  Polygon as OlGeomPolygon
} from 'ol/geom';
import * as olProj from 'ol/proj';
import vectorDialog from './vector-dialog';
import { onMapClickGetVectorFeatures } from '../modules/vector-styles/util';
import { openCustomContent, onClose } from '../modules/modal/actions';
import { selectVectorFeatures } from '../modules/vector-styles/actions';
import { groupBy as lodashGroupBy, debounce as lodashDebounce, get as lodashGet } from 'lodash';
import { changeCursor } from '../modules/map/actions';
import { isFromActiveCompareRegion } from '../modules/compare/util';
import {
  toggleHoveredGranule
} from '../modules/layers/actions';
export class MapInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
  }

  registerMouseListeners() {
    this.props.mouseEvents.on('mousemove', this.mouseMove);
    this.props.mouseEvents.on('singleclick', this.singleClick);
  }

  singleClick(e, map) {
    const { lastSelected, openVectorDiaglog, onCloseModal, selectVectorFeatures, modalState, getDialogObject, measureIsActive, isMobile } = this.props;
    if (measureIsActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const dialogId = isVectorModalOpen ? modalState.id : 'vector_dialog' + pixels[0] + pixels[1];

    if (metaArray.length) {
      openVectorDiaglog(dialogId, metaArray, offsetLeft, offsetTop, isMobile);
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  mouseMove(event, map, crs) {
    const { granuleCMRGeometry, granuleLayerId, hoveredGranule, toggleHoveredGranule, proj } = this.props;
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);

    if (granuleCMRGeometry) {
      let toggledGranuleFootprint;
      var gcmr = Object.keys(granuleCMRGeometry).map(key => {
        return { [key]: granuleCMRGeometry[key] };
      });

      for (let i = 0; i < gcmr.length; i++) {
        const granObj = gcmr[i];
        const date = Object.keys(granObj)[0];
        const geom = Object.values(granObj)[0];

        // string coord to num and transform is polar projections
        const geomVertices = geom.map(xy => {
          const coordNums = [parseFloat(xy[0]), parseFloat(xy[1])];
          // transform for non geographic projections
          if (crs !== 'EPSG:4326') {
            return olProj.transform(coordNums, 'EPSG:4326', crs);
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

    const { isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset } = this.props;
    const [lon, lat] = coord;
    if (lon < -250 || lon > 250 || lat < -90 || lat > 90) {
      return;
    }
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixels, function(feature, layer) {
        const def = lodashGet(layer, 'wv.def');
        if (!def) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped ? (lon > -250 || lon < 250 || lat > -90 || lat < 90) : true;
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
    const { isShowingClick, mouseEvents } = this.props;
    const mapClasses = isShowingClick ? 'wv-map' + ' cursor-pointer' : 'wv-map';

    return (
      <React.Fragment>
        <div id="wv-map" className={mapClasses} />
        <OlCoordinates mouseEvents={mouseEvents} />
      </React.Fragment>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  selectVectorFeatures: (features) => {
    setTimeout(() => {
      dispatch(selectVectorFeatures(features));
    }, 1);
  },
  changeCursor: (bool) => {
    dispatch(changeCursor(bool));
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
            dispatch(selectVectorFeatures({}));
          }, 1);
        }
      }
    ));
  },
  toggleHoveredGranule: (id, granuleDate) => {
    dispatch(toggleHoveredGranule(id, granuleDate));
  }
});
function mapStateToProps(state) {
  const { layers, modal, map, measure, vectorStyles, browser, compare, proj } = state;
  const groupName = compare.activeString;
  let swipeOffset;
  if (compare.active && compare.mode === 'swipe') {
    const percentOffset = state.compare.value || 50;
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }
  let granuleCMRGeometry;
  let granuleLayerId;
  const hoveredGranule = layers.hoveredGranule;

  // TODO: CURRENTLY RELYING ON PROVIDED LAYER ID, NEED TO SET UP GLOBAL LAYER STATE WITH CURRENT "FAMILY" OF SATELLITE/PRODUCT
  const isGranuleIdOptions = {
    VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT: true,
    'VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT': true,
    'VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1_Granule_v1_NRT': true
  };
  const isActiveGranuleVisible = layers.active.filter((layer) => layer.visible && isGranuleIdOptions[layer.id]);
  if (isActiveGranuleVisible.length && layers.granuleLayers[groupName] && layers.granuleLayers[groupName].VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT) {
    granuleCMRGeometry = layers.granuleLayers[groupName].VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT.geometry;
    granuleLayerId = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor_Granule_v1_NRT';
  }

  return {
    modalState: modal,
    isShowingClick: map.isClickable,
    getDialogObject: (pixels, map) => onMapClickGetVectorFeatures(pixels, map, state, swipeOffset),
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive,
    isMobile: browser.lessThan.medium,
    granuleCMRGeometry,
    granuleLayerId,
    hoveredGranule,
    compareState: compare,
    swipeOffset,
    proj
  };
}
MapInteractions.propTypes = {
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
  toggleHoveredGranule: PropTypes.func
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MapInteractions);
