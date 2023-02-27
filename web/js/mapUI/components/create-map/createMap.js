import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  forOwn as lodashForOwn,
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
import util from '../../../util/util';
import {
  refreshRotation,
  updateRenderedState,
  updateMapUI,
} from '../../../modules/map/actions';
import { saveRotation } from '../../../map/util';
import {
  MAP_DISABLE_CLICK_ZOOM,
  MAP_ENABLE_CLICK_ZOOM,
  MAP_DRAG,
  MAP_MOVE_START,
  MAP_ZOOMING,
} from '../../../util/constants';
import { startLoading, stopLoading, MAP_LOADING } from '../../../modules/loading/actions';
import { granuleFootprint } from '../../../map/granule/util';

const { events } = util;

function CreateMap(props) {
  const {
    config,
    isMapSet,
    preloadForCompareMode,
    setGranuleFootprints,
    setMap,
    setUI,
    startLoading,
    stopLoading,
    ui,
    updateExtent,
    updateMapUI,
    updateRenderedState,
    updateRotation,
  } = props;

  const { projections } = config;
  let granuleFootprintsObj = {};
  const animationDuration = 250;
  const doubleClickZoom = new OlInteractionDoubleClickZoom({
    duration: animationDuration,
  });

  useEffect(() => {
    if (isMapSet) return;
    setMap(true);
    const uiCopy = ui;
    lodashForOwn(projections, (proj) => {
      const map = mapCreation(proj, uiCopy);
      uiCopy.proj[proj.id] = map;
    });
    setGranuleFootprints(granuleFootprintsObj);
    setUI(uiCopy);
  });

  /**
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

    const onRotate = () => {
      const radians = map.getView().getRotation();
      updateRotation(radians);
      const PI_OVER_180 = Math.PI / 180;
      const currentDeg = radians * PI_OVER_180;
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
      setTimeout(preloadForCompareMode, 250);

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

    events.on(MAP_DISABLE_CLICK_ZOOM, () => {
      doubleClickZoom.setActive(false);
    });
    events.on(MAP_ENABLE_CLICK_ZOOM, () => {
      setTimeout(() => {
        doubleClickZoom.setActive(true);
      }, 100);
    });
    return map;
  };

  return null;
}

const mapDispatchToProps = (dispatch) => ({
  updateRotation: (rotation) => {
    dispatch(refreshRotation(rotation));
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
  null,
  mapDispatchToProps,
)(CreateMap);

CreateMap.propTypes = {
  config: PropTypes.object,
  isMapSet: PropTypes.bool,
  preloadForCompareMode: PropTypes.func,
  setGranuleFootprints: PropTypes.func,
  setMap: PropTypes.func,
  setUI: PropTypes.func,
  startLoading: PropTypes.func,
  stopLoading: PropTypes.func,
  ui: PropTypes.object,
  updateExtent: PropTypes.func,
  updateMapUI: PropTypes.func,
  updateRenderedState: PropTypes.func,
  updateRotation: PropTypes.func,
};
