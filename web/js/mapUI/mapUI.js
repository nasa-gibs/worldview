import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
/* eslint-disable no-multi-assign */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import { each as lodashEach, find as lodashFind } from 'lodash';
import AddLayer from './components/layers/addLayer';
import RemoveLayer from './components/layers/removeLayer';
import CreateMap from './components/create-map/createMap';
import GranuleHover from './components/granule-hover/granuleHover';
import Markers from './components/markers/markers';
import UpdateDate from './components/update-date/updateDate';
import UpdateOpacity from './components/update-opacity/updateOpacity';
import UpdateProjection from './components/update-projection/updateProjection';
import MouseMoveEvents from './components/mouse-move-events/mouseMoveEvents';
import BufferQuickAnimate from './components/buffer-quick-animate/bufferQuickAnimate';
import KioskAnimations from './components/kiosk/kiosk-animations/kiosk-animations';
import TileMeasurement from './components/kiosk/tile-measurement/tile-measurement';
import TravelMode from './components/kiosk/travel-mode/travelMode';
import EIC from './components/eic/eic';
import UpdateCollections from './components/update-collections/updateCollections';
import DevTestButton from './components/dev-test-mode/dev-test-button';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { SET_SCREEN_INFO } from '../modules/screen-size/constants';
import {
  REMOVE_MARKER,
  SET_MARKER,
  TOGGLE_DIALOG_VISIBLE,
} from '../modules/location-search/constants';
import * as dateConstants from '../modules/date/constants';
import util from '../util/util';
import * as layerConstants from '../modules/layers/constants';
import * as compareConstants from '../modules/compare/constants';
import * as paletteConstants from '../modules/palettes/constants';
import * as vectorStyleConstants from '../modules/vector-styles/constants';
import {
  getActiveLayers,
  isRenderable as isRenderableLayer,
  getGranuleLayer,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import { getNextDateTime } from '../modules/date/util';
import { EXIT_ANIMATION, STOP_ANIMATION } from '../modules/animation/constants';
import { REFRESH_ROTATE, CLEAR_ROTATE } from '../modules/map/constants';
import { promiseImageryForTime } from '../modules/map/util';
import { updateVectorSelection } from '../modules/vector-styles/util';
import { REDUX_ACTION_DISPATCHED } from '../util/constants';
import { updateMapExtent } from '../modules/map/actions';
import { clearPreload, setPreload } from '../modules/date/actions';
import { DISPLAY_STATIC_MAP } from '../modules/ui/constants';

const { events } = util;

function MapUI(props) {
  const {
    activeLayers,
    activeLayersState,
    activeString,
    arrowDown,
    clearPreload,
    compare,
    compareMapUi,
    config,
    dateCompareState,
    embed,
    isEICModeActive,
    isStaticMapActive,
    isTravelModeActive,
    lastArrowDirection,
    layerQueue,
    lastPreloadDate,
    layers,
    models,
    palettes,
    preloaded,
    proj,
    renderableLayersState,
    selectedDate,
    selectedDateB,
    setPreload,
    setUI,
    ui,
    updateMapExtent,
    vectorStyles,
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
  const [quickAnimateAction, setQuickAnimateAction] = useState({});
  const [vectorActions, setVectorActions] = useState({});
  const [preloadAction, setPreloadAction] = useState({});

  // eslint-disable-next-line no-unused-vars
  const [devTestMode, setDevTestMode] = useState(false);

  const subscribeToStore = function(action) {
    switch (action.type) {
      case CHANGE_PROJECTION: {
        return setProjectionTrigger((projectionTrigger) => projectionTrigger + 1);
      }
      case layerConstants.ADD_LAYER:
      case layerConstants.UPDATE_DDV_LAYER:
      case DISPLAY_STATIC_MAP:
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
      case vectorStyleConstants.SET_SELECTED_VECTORS:
        return setVectorActions(action);
      case dateConstants.CHANGE_CUSTOM_INTERVAL:
      case dateConstants.CHANGE_INTERVAL:
        return setPreloadAction(action);
      case dateConstants.ARROW_DOWN:
        setQuickAnimateAction(action);
        break;
      default:
        break;
    }
  };

  const updateVectorSelections = () => {
    const type = 'selection';
    const newSelection = vectorActions.payload;
    updateVectorSelection(
      vectorActions.payload,
      ui.selectedVectors,
      activeLayers,
      type,
      vectorStylesState,
    );
    ui.selectedVectors = newSelection;
  };

  events.on(REDUX_ACTION_DISPATCHED, subscribeToStore);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { setProjectionTrigger((projectionTrigger) => projectionTrigger + 1); }, 200);
  });

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
 * Get granule options for layerBuilding
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

  async function preloadNextTiles(date, compareString) {
    const map = { ui };
    const state = {
      proj, embed, layers, palettes, vectorStyles, compare, map, ui,
    };
    const { dislayStaticMap } = ui;
    if (dislayStaticMap) return;
    const useActiveString = compareString || activeString;
    const useDate = date || (preloaded ? lastPreloadDate : getSelectedDate(dateCompareState));
    const nextDate = getNextDateTime(dateCompareState, 1, useDate);
    const prevDate = getNextDateTime(dateCompareState, -1, useDate);
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

  function preloadForCompareMode() {
    preloadNextTiles(selectedDate, 'active');
    if (compare.active) {
      preloadNextTiles(selectedDateB, 'activeB');
    }
  }

  // Initial hook that initiates the map after it has been created in CreateMap.js
  useEffect(() => {
    if (document.getElementById('app')) {
      setProjectionTrigger(1);
    }
  }, [ui]);

  useEffect(() => {
    if (vectorActions.type === vectorStyleConstants.SET_SELECTED_VECTORS) {
      updateVectorSelections();
    }
  }, [vectorActions]);

  useEffect(() => {
    if (preloadAction.type === dateConstants.CHANGE_INTERVAL) {
      preloadNextTiles();
    }
  }, [preloadAction]);

  return (
    <>
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
        updateLayerVisibilities={updateLayerVisibilities}
        findLayer={findLayer}
        ui={ui}
      />
      <AddLayer
        action={addLayerAction}
        compareMapUi={compareMapUi}
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
        findLayer={findLayer}
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
      <BufferQuickAnimate action={quickAnimateAction} />
      <UpdateCollections />
      { isEICModeActive
      && (
      <>
        <EIC />
        <KioskAnimations ui={ui} />
        <TileMeasurement ui={ui} />
        { (isTravelModeActive && !isStaticMapActive) && <TravelMode /> }
      </>
      )}
      {devTestMode && <DevTestButton />}

    </>
  );
}

const mapStateToProps = (state) => {
  const {
    compare, config, date, embed, layers, map, palettes, proj, vectorStyles, ui,
  } = state;
  const {
    arrowDown, lastArrowDirection, lastPreloadDate, preloaded, selected, selectedB,
  } = date;

  const vectorStylesState = {
    config, map, proj, vectorStyles,
  };
  const renderableLayersState = {
    date, compare, config, proj,
  };
  const dateCompareState = { date, compare };
  const activeLayersState = { embed, compare, layers };
  const activeLayers = getActiveLayers(state);
  const selectedDate = selected;
  const selectedDateB = selectedB;
  const { activeString } = compare;
  const useDate = selectedDate || (preloaded ? lastPreloadDate : getSelectedDate(state));
  const nextDate = getNextDateTime(state, 1, useDate);
  const prevDate = getNextDateTime(state, -1, useDate);
  const isEICModeActive = ui.eic !== '';
  const isTravelModeActive = ui.travelMode !== '';
  const isStaticMapActive = ui.displayStaticMap;

  return {
    activeLayers,
    activeLayersState,
    activeString,
    arrowDown,
    compare,
    dateCompareState,
    embed,
    isEICModeActive,
    isStaticMapActive,
    isTravelModeActive,
    lastArrowDirection,
    lastPreloadDate,
    layers,
    nextDate,
    palettes,
    preloaded,
    prevDate,
    proj,
    renderableLayersState,
    selectedDate,
    selectedDateB,
    vectorStyles,
    vectorStylesState,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearPreload: () => {
    dispatch(clearPreload());
  },
  updateMapExtent: (extent) => {
    dispatch(updateMapExtent(extent));
  },
  setPreload: (preloaded, lastPreloadDate) => {
    dispatch(setPreload(preloaded, lastPreloadDate));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapUI);

MapUI.propTypes = {
  activeLayers: PropTypes.array,
  activeLayersState: PropTypes.object,
  activeString: PropTypes.string,
  arrowDown: PropTypes.string,
  clearPreload: PropTypes.func,
  compare: PropTypes.object,
  compareMapUi: PropTypes.object,
  config: PropTypes.object,
  dateCompareState: PropTypes.object,
  embed: PropTypes.object,
  isEICModeActive: PropTypes.bool,
  lastArrowDirection: PropTypes.string,
  layerQueue: PropTypes.object,
  layers: PropTypes.object,
  lastPreloadDate: PropTypes.object,
  models: PropTypes.object,
  palettes: PropTypes.object,
  preloaded: PropTypes.bool,
  proj: PropTypes.object,
  renderableLayersState: PropTypes.object,
  selectedDate: PropTypes.object,
  selectedDateB: PropTypes.object,
  setPreload: PropTypes.func,
  setUI: PropTypes.func,
  ui: PropTypes.object,
  updateMapExtent: PropTypes.func,
  vectorStyles: PropTypes.object,
  vectorStylesState: PropTypes.object,
};
