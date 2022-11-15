import React, {
  useEffect, useState,
} from 'react';
import { connect } from 'react-redux';
/* eslint-disable no-multi-assign */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import {
  throttle as lodashThrottle,
  forOwn as lodashForOwn,
  each as lodashEach,
  findIndex as lodashFindIndex,
  get as lodashGet,
  debounce as lodashDebounce,
  cloneDeep as lodashCloneDeep,
  find as lodashFind,
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
import OlLayerGroup from 'ol/layer/Group';
import * as olProj from 'ol/proj';
import Cache from 'cachai';
// eslint-disable-next-line import/no-unresolved
import PQueue from 'p-queue';
import AddLayer from './Components/Layers/AddLayer';
import RemoveLayer from './Components/Layers/RemoveLayer';
import CreateMap from './Components/CreateMap/CreateMap';
import GranuleHover from './Components/GranuleHover/GranuleHover';
import Markers from './Components/Markers/Markers';
import UpdateDate from './Components/UpdateDate/UpdateDate';
import UpdateOpacity from './Components/UpdateOpacity/UpdateOpacity';
import UpdateProjection from './Components/UpdateProjection/UpdateProjection';
import MouseMoveEvents from './Components/MouseMoveEvents/MouseMoveEvents';
import mapLayerBuilder from '../map/layerbuilder';

import { fly, saveRotation } from '../map/util';
import mapCompare from '../map/compare/compare';
import { granuleFootprint } from '../map/granule/util';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { SET_SCREEN_INFO } from '../modules/screen-size/constants';
import {
  REMOVE_MARKER,
  SET_MARKER,
  TOGGLE_DIALOG_VISIBLE,
} from '../modules/location-search/constants';
import { setGeocodeResults, removeMarker } from '../modules/location-search/actions';
import * as dateConstants from '../modules/date/constants';
import util from '../util/util';
import * as layerConstants from '../modules/layers/constants';
import * as compareConstants from '../modules/compare/constants';
import * as paletteConstants from '../modules/palettes/constants';
import * as vectorStyleConstants from '../modules/vector-styles/constants';
import { setStyleFunction } from '../modules/vector-styles/selectors';
import {
  getLayers,
  getActiveLayers,
  getActiveLayerGroup,
  isRenderable as isRenderableLayer,
  getMaxZoomLevelLayerCollection,
  getAllActiveLayers,
  getGranuleCount,
  getGranuleLayer,
  getActiveGranuleFootPrints,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import { getNumberStepsBetween, getNextDateTime } from '../modules/date/util';
import { EXIT_ANIMATION, STOP_ANIMATION } from '../modules/animation/constants';
import {
  RENDERED, UPDATE_MAP_UI, UPDATE_MAP_EXTENT, UPDATE_MAP_ROTATION, FITTED_TO_LEADING_EXTENT, REFRESH_ROTATE, CLEAR_ROTATE,
} from '../modules/map/constants';
import { getLeadingExtent, promiseImageryForTime } from '../modules/map/util';
import { updateVectorSelection } from '../modules/vector-styles/util';
import { animateCoordinates, getCoordinatesMarker, areCoordinatesWithinExtent } from '../modules/location-search/util';
import { getNormalizedCoordinate } from '../components/location-search/util';
import { reverseGeocode } from '../modules/location-search/util-api';
import { startLoading, stopLoading, MAP_LOADING } from '../modules/loading/actions';
import {
  MAP_DISABLE_CLICK_ZOOM,
  MAP_ENABLE_CLICK_ZOOM,
  REDUX_ACTION_DISPATCHED,
  GRANULE_HOVERED,
  GRANULE_HOVER_UPDATE,
  MAP_DRAG,
  MAP_MOUSE_MOVE,
  MAP_MOUSE_OUT,
  MAP_MOVE_START,
  MAP_ZOOMING,
} from '../util/constants';
import {
  fitToLeadingExtent,
  refreshRotation,
  updateMapExtent,
  updateRenderedState,
  updateMapUI,
} from '../modules/map/actions';
import { clearPreload, setPreload } from '../modules/date/actions';

const { events } = util;

const MapUI = (props) => {
  const {
    proj, embed, layers, palettes, vectorStyles,
    activeLayers,
    activeLayersState,
    activeString,
    arrowDown,
    clearPreload,
    compare,
    compareMapUi,
    config,
    date,
    dateCompareState,
    lastArrowDirection,
    lastPreloadDate,
    layerQueue,
    models,
    nextDate,
    preloaded,
    prevDate,
    promiseImageryState,
    renderableLayersState,
    selectedDate,
    selectedDateB,
    setPreload,
    setUI,
    ui,
    updateMapExtent,
    vectorStylesState,
  } = props;

  const [isMapSet, setMap] = useState(false);
  const [projectionTrigger, setProjectionTrigger] = useState(0);
  const [projectionAction, setProjectionAction] = useState({});
  const [addLayerAction, setAddLayerAction] = useState({});
  const [removeLayersAction, setRemoveLayersAction] = useState({});
  const [dateAction, setDateAction] = useState({});
  const [opacityAction, setOpacityAction] = useState({});
  const [markerAction, setMarkerAction] = useState({});
  const [granuleFootprints, setGranuleFootprints] = useState({});

  const subscribeToStore = function(action) {
    switch (action.type) {
      case CHANGE_PROJECTION: {
        return setProjectionTrigger((projectionTrigger) => projectionTrigger + 1);
      }
      case layerConstants.ADD_LAYER:
        return setAddLayerAction(action);
      case STOP_ANIMATION:
      case EXIT_ANIMATION:
      case LOCATION_POP_ACTION:
      case layerConstants.UPDATE_GRANULE_LAYER_OPTIONS:
      case layerConstants.RESET_GRANULE_LAYER_OPTIONS:
      case compareConstants.CHANGE_STATE:
      case layerConstants.REORDER_LAYERS:
      case layerConstants.REORDER_OVERLAY_GROUPS:
      case compareConstants.TOGGLE_ON_OFF:
      case compareConstants.CHANGE_MODE:
      case layerConstants.TOGGLE_OVERLAY_GROUPS:
      case paletteConstants.SET_THRESHOLD_RANGE_AND_SQUASH:
      case paletteConstants.SET_CUSTOM:
      case paletteConstants.SET_DISABLED_CLASSIFICATION:
      case paletteConstants.CLEAR_CUSTOM:
      case layerConstants.ADD_LAYERS_FOR_EVENT:
      case vectorStyleConstants.SET_FILTER_RANGE:
      case vectorStyleConstants.SET_VECTORSTYLE:
      case vectorStyleConstants.CLEAR_VECTORSTYLE:
      case SET_SCREEN_INFO:
        console.log(action.type);
        return setProjectionAction(action);
      case layerConstants.REMOVE_GROUP:
      case layerConstants.REMOVE_LAYER:
        return setRemoveLayersAction(action);
      case dateConstants.SELECT_DATE:
      case layerConstants.TOGGLE_LAYER_VISIBILITY:
      case layerConstants.TOGGLE_OVERLAY_GROUP_VISIBILITY:
        return setDateAction(action);
      case layerConstants.UPDATE_OPACITY:
        return setOpacityAction(action);
      case REMOVE_MARKER:
      case SET_MARKER:
      case TOGGLE_DIALOG_VISIBLE:
        return setMarkerAction(action);
      case CLEAR_ROTATE: {
        ui.selected.getView().animate({
          duration: 500,
          rotation: 0,
        });
        return;
      }
      case REFRESH_ROTATE: {
        ui.selected.getView().animate({
          rotation: action.rotation,
          duration: 500,
        });
        return;
      }
      case vectorStyleConstants.SET_SELECTED_VECTORS: {
        console.log(action.type);
        const type = 'selection';
        const newSelection = action.payload;
        updateVectorSelection(
          action.payload,
          ui.selectedVectors,
          activeLayers,
          type,
          vectorStylesState,
        );
        ui.selectedVectors = newSelection;
        return;
      }
      case dateConstants.CHANGE_CUSTOM_INTERVAL:
      case dateConstants.CHANGE_INTERVAL:
        return preloadNextTiles();
      case dateConstants.ARROW_DOWN:
        bufferQuickAnimate(action.value);
        break;
      default:
        break;
    }
  };

  events.on(REDUX_ACTION_DISPATCHED, subscribeToStore);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { setProjectionTrigger((projectionTrigger) => projectionTrigger + 1); }, 200);
  });

  // Initial hook that initiates the map after it has been created in CreateMap.js
  useEffect(() => {
    if (document.getElementById('app')) {
      console.log('2. Initiating Hook');
      setProjectionTrigger(1);
    }
  }, [ui]);

  // useEffect(() => {
  //   if(ui.proj){
  //     console.log("HUUUUUTTTTTT")
  //     // preloadForCompareMode()
  //   }
  // }, [])

  const updateExtent = () => {
    const map = ui.selected;
    const view = map.getView();
    const extent = view.calculateExtent();
    updateMapExtent(extent);
    if (map.isRendered()) {
      clearPreload();
    }
  };

  const updateLayerVisibilities = () => {
    const layerGroup = ui.selected.getLayers();

    const setRenderable = (layer, parentCompareGroup) => {
      const { id, group } = layer.wv;
      const dateGroup = layer.get('date') || group === 'active' ? 'selected' : 'selectedB';
      const date = getSelectedDate(dateCompareState, dateGroup);
      const layers = getActiveLayers(activeLayersState, parentCompareGroup || group);
      const renderable = isRenderableLayer(id, layers, date, null, renderableLayersState);
      layer.setVisible(renderable);
    };

    layerGroup.forEach((layer) => {
      const compareActiveString = layer.get('group');
      const granule = layer.get('granuleGroup');

      // Not in A|B
      if (layer.wv && !granule) {
        setRenderable(layer);

      // If in A|B layer-group will have a 'group' string
      } else if (compareActiveString || granule) {
        const compareGrouplayers = layer.getLayers().getArray();

        compareGrouplayers.forEach((subLayer) => {
          if (!subLayer.wv) {
            return;
          }
          // TileLayers within granule LayerGroup
          if (subLayer.get('granuleGroup')) {
            const granuleLayers = subLayer.getLayers().getArray();
            granuleLayers.forEach((l) => setRenderable(l));
            subLayer.setVisible(true);
          }
          setRenderable(subLayer, compareActiveString);
        });

        layer.setVisible(true);
      }
    });
  };

  const findLayer = (def, activeCompareState) => {
    const layers = ui.selected.getLayers().getArray();
    let layer = lodashFind(layers, {
      wv: {
        id: def.id,
      },
    });

    if (!layer && layers.length && (layers[0].get('group') || layers[0].get('granuleGroup'))) {
      let olGroupLayer;
      const layerKey = `${def.id}-${activeCompareState}`;
      lodashEach(layers, (layerGroup) => {
        if (layerGroup.get('layerId') === layerKey || layerGroup.get('group') === activeCompareState) {
          olGroupLayer = layerGroup;
        }
      });
      const subGroup = olGroupLayer.getLayers().getArray();
      layer = lodashFind(subGroup, {
        wv: {
          id: def.id,
        },
      });
    }
    return layer;
  };

  /**
 * Get granule options for layerBuilding. Passed to multiple components.
 * @param {object} state
 * @param {Object} def
 * @param {String} layerGroupStr
 * @param {Object} options
 * @returns {Object}
 */
  const getGranuleOptions = (state, { id, count, type }, activeString, options) => {
    if (type !== 'granule') return {};
    const reset = options && options.reset === id;

    const granuleState = getGranuleLayer(state, id, activeString);
    let granuleDates;
    let granuleCount;
    let geometry;
    if (granuleState) {
      granuleDates = !reset ? granuleState.dates : false;
      granuleCount = granuleState.count;
      geometry = granuleState.geometry;
    }
    return {
      granuleDates,
      granuleCount: granuleCount || count,
      geometry,
    };
  };

  function preloadForCompareMode() {
    preloadNextTiles(selectedDate, 'active');
    if (compare.active) {
      preloadNextTiles(selectedDateB, 'activeB');
    }
  }

  async function bufferQuickAnimate(arrowDown) {

    const BUFFER_SIZE = 8;
    const preloadPromises = [];
    const selectedDate = getSelectedDate(dateCompareState);
    const currentBuffer = preloaded ? getNumberStepsBetween(date, selectedDate, lastPreloadDate) : 0;

    if (currentBuffer >= BUFFER_SIZE) {
      return;
    }

    const currentDate = preloaded ? lastPreloadDate : selectedDate;
    const direction = arrowDown === 'right' ? 1 : -1;
    let nextDate = getNextDateTime(dateCompareState, direction, currentDate);

    for (let step = 1; step <= BUFFER_SIZE; step += 1) {
      preloadPromises.push(promiseImageryForTime(promiseImageryState, nextDate));
      if (step !== BUFFER_SIZE) {
        nextDate = getNextDateTime(dateCompareState, direction, nextDate);
      }
    }
    await Promise.all(preloadPromises);
    setPreload(true, nextDate);
  }

  async function preloadNextTiles(date, compareString) {
    const map = {ui};
    const state = { proj, embed, layers, palettes, vectorStyles, compare, map}
    const useActiveString = compareString || activeString;
    const subsequentDate = lastArrowDirection === 'right' ? nextDate : prevDate;
    if (preloaded && lastArrowDirection) {
      setPreload(true, subsequentDate);
      layerQueue.add(() => promiseImageryForTime(state, subsequentDate, useActiveString));
      return;
    }
    layerQueue.add(() => promiseImageryForTime(state, nextDate, useActiveString));
    layerQueue.add(() => promiseImageryForTime(state, prevDate, useActiveString));
    if (!date && !arrowDown) {
      preloadNextTiles(subsequentDate, useActiveString);
    }
  }

  const testFunction = () => {
  // console.log('map', map.ui.selected.getLayers() )
    // console.log('map state', map);
    // console.log('ui', ui);
    // console.log('promiseImageryState', promiseImageryState.palettes.rendered)
    // preloadNextTiles(selectedDate, 'active')
    preloadForCompareMode()
  };

  const buttonStyle = {
    zIndex: '99',
  };

  return (
    <>
      <div className="d-flex justify-content-center w-100">
        <button className="btn btn-success" onClick={testFunction} style={buttonStyle}>
          MAP/UI/SELECTED DATE
        </button>
      </div>
      <CreateMap
        compareMapUi={compareMapUi}
        isMapSet={isMapSet}
        setMap={setMap}
        ui={ui}
        setUI={setUI}
        config={config}
        setGranuleFootprints={setGranuleFootprints}
        layerQueue={layerQueue}
        updateExtent={updateExtent}
        preloadForCompareMode={preloadForCompareMode}
      />
      <UpdateProjection
        action={projectionAction}
        compareMapUi={compareMapUi}
        config={config}
        getGranuleOptions={getGranuleOptions}
        models={models}
        preloadForCompareMode={preloadForCompareMode}
        projectionTrigger={projectionTrigger}
        ui={ui}
        updateExtent={updateExtent}
        updateLayerVisibilities={updateLayerVisibilities}
      />
      <RemoveLayer
        action={removeLayersAction}
        compareMapUi={compareMapUi}
        updateLayerVisibilities={updateLayerVisibilities}
        findLayer={findLayer}
      />
      <AddLayer
        action={addLayerAction}
        preloadNextTiles={preloadNextTiles}
        updateLayerVisibilities={updateLayerVisibilities}
        ui={ui}
      />
      <UpdateDate
        action={dateAction}
        ui={ui}
        compareMapUi={compareMapUi}
        config={config}
        preloadNextTiles={preloadNextTiles}
        updateLayerVisibilities={updateLayerVisibilities}
        getGranuleOptions={getGranuleOptions}
      />
      <UpdateOpacity
        action={opacityAction}
        findLayer={findLayer}
        ui={ui}
        updateLayerVisibilities={updateLayerVisibilities}
      />
      <Markers action={markerAction} ui={ui} config={config} />
      <GranuleHover granuleFootprints={granuleFootprints} ui={ui} />
      <MouseMoveEvents ui={ui} compareMapUi={compareMapUi} />
    </>
  );
};

const mapStateToProps = (state) => {
  const {
    compare, config, date, embed, layers, map, palettes, proj, screenSize, vectorStyles,
  } = state;
  const {
    arrowDown, lastArrowDirection, lastPreloadDate, preloaded, selected, selectedB,
  } = date;

  const layerState = { layers, compare, proj };
  const vectorStylesState = {
    config, map, proj, vectorStyles,
  };
  const promiseImageryState = {
    map, proj, embed, compare, layers, palettes, vectorStyles,
  };
  const renderableLayersState = {
    date, compare, config, proj,
  };
  const dateCompareState = { date, compare };
  const activeLayersState = { embed, compare, layers };
  const isMobile = screenSize.isMobileDevice;
  const activeLayers = getActiveLayers(state);
  const selectedDate = selected;
  const selectedDateB = selectedB;
  const { activeString } = compare;
  const useDate = selectedDate || (preloaded ? lastPreloadDate : getSelectedDate(state));
  const nextDate = getNextDateTime(state, 1, useDate);
  const prevDate = getNextDateTime(state, -1, useDate);
  const layerGroup = getActiveLayerGroup(state);
  const allActiveLayers = getAllActiveLayers(state);
  const compareMode = compare.mode;

  return {
    proj, embed, layers, palettes, vectorStyles,
    activeLayers,
    activeLayersState,
    activeString,
    allActiveLayers,
    arrowDown,
    compare,
    compareMode,
    date,
    dateCompareState,
    isMobile,
    lastArrowDirection,
    layerGroup,
    layers,
    layerState,
    lastPreloadDate,
    map,
    nextDate,
    preloaded,
    prevDate,
    proj,
    promiseImageryState,
    renderableLayersState,
    selectedDate,
    selectedDateB,
    vectorStylesState,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearPreload: () => {
    dispatch(clearPreload());
  },
  fitToLeadingExtent: (extent) => {
    dispatch(fitToLeadingExtent(extent));
  },
  updateMapExtent: (extent) => {
    dispatch(updateMapExtent(extent));
  },
  updateMapUI: (ui, rotation) => {
    dispatch(updateMapUI(ui, rotation));
  },
  setPreload: (preloaded, lastPreloadDate) => {
    dispatch(setPreload(preloaded, lastPreloadDate));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapUI);
