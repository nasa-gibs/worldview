import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  forOwn as lodashForOwn,
  throttle as lodashThrottle,
  debounce as lodashDebounce,
} from 'lodash';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlKinetic from 'ol/Kinetic';
import OlControlScaleLine from 'ol/control/ScaleLine';
import { altKeyOnly } from 'ol/events/condition';
import OlInteractionPinchRotate from 'ol/interaction/PinchRotate';
import OlInteractionDragRotate from 'ol/interaction/DragRotate';
import OlInteractionDoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import OlInteractionPinchZoom from 'ol/interaction/PinchZoom';
import OlInteractionDragPan from 'ol/interaction/DragPan';
import OlInteractionMouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import OlInteractionDragZoom from 'ol/interaction/DragZoom';
import * as olProj from 'ol/proj';
import mapCompare from '../../../map/compare/compare';
import { getSelectedDate } from '../../../modules/date/selectors';
import util from '../../../util/util';
import {
  refreshRotation,
  updateMapExtent,
  updateRenderedState,
  updateMapUI,
} from '../../../modules/map/actions';
import { saveRotation } from '../../../map/util';
import { clearPreload, setPreload } from '../../../modules/date/actions';
import {
  MAP_DRAG,
  MAP_MOUSE_MOVE,
  MAP_MOUSE_OUT,
  MAP_MOVE_START,
  MAP_ZOOMING,
} from '../../../util/constants';
import { startLoading, stopLoading, MAP_LOADING } from '../../../modules/loading/actions';
import { getNextDateTime } from '../../../modules/date/util';
import { promiseImageryForTime } from '../../../modules/map/util';
import { granuleFootprint } from '../../../map/granule/util';

const { events } = util;

const CreateMap = (props) => {
  const {
    clearPreload,
    compareMapUi,
    config,
    isCoordinateSearchActive,
    isEventsTabActive,
    isMapAnimating,
    isMapSet,
    isMeasureActive,
    isMobile,
    layerQueue,
    preloadForCompareMode,
    setGranuleFootprints,
    setMap,
    setUI,
    sidebarActiveTab,
    startLoading,
    stopLoading,
    ui,
    updateMapExtent,
    updateMapUI,
    updateRenderedState,
    updateRotation,
  } = props;

  const { projections } = config;
  let granuleFootprintsObj = {};

  useEffect(() => {
    if (isMapSet) return;
    console.log('1. Creating Map');
    setMap(true);
    const uiCopy = ui;
    lodashForOwn(projections, (proj) => {
      const map = mapCreation(proj, uiCopy);
      uiCopy.proj[proj.id] = map;
    });
    setGranuleFootprints(granuleFootprintsObj);
    setUI(uiCopy);
  });

  /*
   * Create map object
   *
   * @method createMap
   * @static
   *
   * @param {object} proj - Projection properties
   * @param {object} dateSelected
   *
   * @returns {object} OpenLayers Map Object
   */
  const mapCreation = (proj, uiCopy) => {
    const animationDuration = 250;

    const doubleClickZoom = new OlInteractionDoubleClickZoom({
      duration: animationDuration,
    });
    //= ======================================
    const mapContainerEl = document.getElementById('wv-map');
    const mapEl = document.createElement('div');
    const id = `wv-map-${proj.id}`;

    mapEl.setAttribute('id', id);
    mapEl.setAttribute('data-proj', proj.id);
    mapEl.classList.add('wv-map');
    mapEl.style.display = 'none';
    mapContainerEl.insertAdjacentElement('afterbegin', mapEl);

    const scaleMetric = new OlControlScaleLine({
      className: 'wv-map-scale-metric',
      units: 'metric',
    });
    const scaleImperial = new OlControlScaleLine({
      className: 'wv-map-scale-imperial',
      units: 'imperial',
    });
    const rotateInteraction = new OlInteractionDragRotate({
      condition: altKeyOnly,
      duration: animationDuration,
    });
    const mobileRotation = new OlInteractionPinchRotate({
      duration: animationDuration,
    });
    const map = new OlMap({
      view: new OlView({
        maxResolution: proj.resolutions[0],
        projection: olProj.get(proj.crs),
        center: proj.startCenter,
        zoom: proj.startZoom,
        maxZoom: proj.numZoomLevels,
        enableRotation: true,
        extent: proj.id === 'geographic' ? [-250, -90, 250, 90] : proj.maxExtent,
        constrainOnlyCenter: true,
      }),
      target: id,
      renderer: ['canvas'],
      logo: false,
      controls: [scaleMetric, scaleImperial],
      interactions: [
        doubleClickZoom,
        new OlInteractionDragPan({
          kinetic: new OlKinetic(-0.005, 0.05, 100),
        }),
        new OlInteractionPinchZoom({
          duration: animationDuration,
        }),
        new OlInteractionMouseWheelZoom({
          duration: animationDuration,
        }),
        new OlInteractionDragZoom({
          duration: animationDuration,
        }),
      ],
      loadTilesWhileAnimating: true,
      loadTilesWhileInteracting: true,
      maxTilesLoading: 32,
    });
    map.wv = {
      scaleMetric,
      scaleImperial,
    };
    map.proj = proj.id;
    createMousePosSel(map, uiCopy);
    map.getView().on('change:resolution', () => {
      events.trigger(MAP_MOVE_START);
    });

    // This component is inside the map viewport container. Allowing
    // mouse move events to bubble up displays map coordinates--let those
    // be blank when over a component.
    document.querySelector('.wv-map-scale-metric').addEventListener('mousemove', (e) => e.stopPropagation());
    document.querySelector('.wv-map-scale-imperial').addEventListener('mousemove', (e) => e.stopPropagation());

    // Allow rotation by dragging for polar projections
    if (proj.id !== 'geographic' && proj.id !== 'webmerc') {
      map.addInteraction(rotateInteraction);
      map.addInteraction(mobileRotation);
    }

    const updateExtent = () => {
      const map = ui.selected;
      const view = map.getView();
      const extent = view.calculateExtent();
      updateMapExtent(extent);
      if (map.isRendered()) {
        clearPreload();
      }
    };

    const onRotate = () => {
      const radians = map.getView().getRotation();
      updateRotation(radians);
      const currentDeg = radians * (180.0 / Math.PI);
      saveRotation(currentDeg, map.getView());
      updateExtent();
    };

    // Set event listeners for changes on the map view (when rotated, zoomed, panned)
    const debouncedUpdateExtent = lodashDebounce(updateExtent, 300);
    const debouncedOnRotate = lodashDebounce(onRotate, 300);

    map.getView().on('change:center', debouncedUpdateExtent);
    map.getView().on('change:resolution', debouncedUpdateExtent);
    map.getView().on('change:rotation', debouncedOnRotate);

    map.on('pointerdrag', () => {
      uiCopy.mapIsbeingDragged = true;
      events.trigger(MAP_DRAG);
    });
    map.getView().on('propertychange', (e) => {
      switch (e.key) {
        case 'resolution':
          uiCopy.mapIsbeingZoomed = true;
          events.trigger(MAP_ZOOMING);
          break;
        default:
          break;
      }
    });
    map.on('moveend', (e) => {
      setTimeout(() => {
        uiCopy.mapIsbeingDragged = false;
        uiCopy.mapIsbeingZoomed = false;
      }, 200);
    });
    const onRenderComplete = () => {
      updateRenderedState();
      updateMapUI(uiCopy, uiCopy.selected.getView().getRotation());
      setTimeout(preloadForCompareMode, 250, layerQueue);
      map.un('rendercomplete', onRenderComplete);
    };

    map.on('loadstart', () => {
      startLoading(MAP_LOADING);
    });
    map.on('loadend', () => {
      stopLoading(MAP_LOADING);
    });
    map.on('rendercomplete', onRenderComplete);

    granuleFootprintsObj = { ...granuleFootprintsObj, [proj.crs]: granuleFootprint(map) };

    window.addEventListener('resize', () => {
      map.getView().changed();
    });

    return map;
  };

  function createMousePosSel(map, uiCopy) {
    const throttledOnMouseMove = lodashThrottle(({ pixel }) => {
      const coords = map.getCoordinateFromPixel(pixel);

      if (map.proj !== ui.selected.proj) return;
      if (ui.mapIsbeingZoomed) return;
      if (ui.mapIsbeingDragged) return;
      if (compareMapUi && compareMapUi.dragging) return;
      if (isMobile) return;
      if (isMeasureActive) return;
      if (isCoordinateSearchActive) return;
      if (!coords) return;
      if (isEventsTabActive || isMapAnimating || sidebarActiveTab === 'download') return;

      uiCopy.runningdata.newPoint(pixel, map);
    }, 300);

    events.on(MAP_MOUSE_MOVE, throttledOnMouseMove);
    events.on(MAP_MOUSE_OUT, (e) => {
      throttledOnMouseMove.cancel();
      uiCopy.runningdata.clearAll();
    });
  }

  return null;
};

const mapStateToProps = (state) => {
  const {
    events, locationSearch, sidebar, animation, measure, screenSize, date, compare,
  } = state;
  const { isCoordinateSearchActive } = locationSearch;
  const {
    selected, selectedB, lastPreloadDate, preloaded, lastArrowDirection, arrowDown,
  } = date;
  const isMeasureActive = measure.isActive;
  const isEventsTabActive = typeof events !== 'undefined' && events.active;
  const isMobile = screenSize.isMobileDevice;
  const isMapAnimating = animation.isPlaying;
  const sidebarActiveTab = sidebar.activeTab;
  const isCompareActive = compare.active;
  const activeString = compare;
  const compareMapUi = mapCompare(state);
  const useDate = selected || (preloaded ? lastPreloadDate : getSelectedDate(state));
  const nextDate = getNextDateTime(state, 1, useDate);
  const prevDate = getNextDateTime(state, -1, useDate);

  async function preloadNextTiles(date, compareString, layerQueue) {
    const useActiveString = compareString || activeString;
    const subsequentDate = lastArrowDirection === 'right' ? nextDate : prevDate;
    if (preloaded && lastArrowDirection) {
      setPreload(preloaded, subsequentDate);
      layerQueue.add(() => promiseImageryForTime(state, subsequentDate, useActiveString));
      return;
    }
    layerQueue.add(() => promiseImageryForTime(state, nextDate, useActiveString));
    layerQueue.add(() => promiseImageryForTime(state, prevDate, useActiveString));
    if (!date && !arrowDown) {
      preloadNextTiles(subsequentDate, useActiveString);
    }
  }

  function preloadForCompareMode(layerQueue) {
    preloadNextTiles(selected, 'active', layerQueue);
    if (isCompareActive) {
      preloadNextTiles(selectedB, 'activeB');
    }
  }

  return {
    compareMapUi,
    isCoordinateSearchActive,
    isEventsTabActive,
    isMapAnimating,
    isMeasureActive,
    isMobile,
    lastPreloadDate,
    preloadForCompareMode,
    sidebarActiveTab,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateRotation: (rotation) => {
    dispatch(refreshRotation(rotation));
  },
  clearPreload: () => {
    dispatch(clearPreload());
  },
  updateMapExtent: (extent) => {
    dispatch(updateMapExtent(extent));
  },
  setPreload: (preloaded, lastPreloadDate) => {
    dispatch(setPreload(preloaded, lastPreloadDate));
  },
  updateRenderedState: () => {
    dispatch(updateRenderedState());
  },
  updateMapUI: (ui, rotation) => {
    dispatch(updateMapUI(ui, rotation));
  },
  startLoading: (key) => {
    dispatch(startLoading(key));
  },
  stopLoading: (key) => {
    dispatch(stopLoading(key));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CreateMap);

CreateMap.propTypes = {
  clearPreload: PropTypes.func,
  compareMapUi: PropTypes.object,
  config: PropTypes.object,
  isCompareActive: PropTypes.bool,
  isCoordinateSearchActive: PropTypes.bool,
  isEventsTabActive: PropTypes.bool,
  isMapAnimating: PropTypes.bool,
  isMapSet: PropTypes.bool,
  isMeasureActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  layerQueue: PropTypes.object,
  preloadForCompareMode: PropTypes.func,
  setGranuleFootprints: PropTypes.func,
  setMap: PropTypes.func,
  setUI: PropTypes.func,
  sidebarActiveTab: PropTypes.string,
  startLoading: PropTypes.func,
  stopLoading: PropTypes.func,
  ui: PropTypes.object,
  updateMapExtent: PropTypes.func,
  updateMapUI: PropTypes.func,
  updateRenderedState: PropTypes.func,
  updateRotation: PropTypes.func,
};
