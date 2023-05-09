import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import OlLayerGroup from 'ol/layer/Group';
import {
  each as lodashEach,
  get as lodashGet,
} from 'lodash';
import {
  fitToLeadingExtent,
  updateMapUI,
} from '../../../modules/map/actions';
import { getLeadingExtent } from '../../../modules/map/util';
import {
  getLayers,
  getActiveLayers,
} from '../../../modules/layers/selectors';
import { getSelectedDate } from '../../../modules/date/selectors';
import util from '../../../util/util';
import { fly } from '../../../map/util';
import * as layerConstants from '../../../modules/layers/constants';
import * as compareConstants from '../../../modules/compare/constants';
import * as paletteConstants from '../../../modules/palettes/constants';
import * as vectorStyleConstants from '../../../modules/vector-styles/constants';
import { LOCATION_POP_ACTION } from '../../../redux-location-state-customs';
import { EXIT_ANIMATION, STOP_ANIMATION } from '../../../modules/animation/constants';
import { SET_SCREEN_INFO } from '../../../modules/screen-size/constants';
import { requestPalette } from '../../../modules/palettes/actions';

function UpdateProjection(props) {
  const {
    action,
    activeLayers,
    compare,
    compareMapUi,
    compareMode,
    config,
    dateCompareState,
    fitToLeadingExtent,
    getGranuleOptions,
    isMobile,
    layerState,
    map,
    models,
    preloadForCompareMode,
    proj,
    projectionTrigger,
    updateExtent,
    updateLayerVisibilities,
    updateMapUI,
    ui,
    requestPalette,
  } = props;

  useEffect(() => {
    actionSwitch();
  }, [action]);

  useEffect(() => {
    if (projectionTrigger === 1) {
      updateProjection(true);
    } else if (projectionTrigger > 1) {
      updateProjection();
    }
  }, [projectionTrigger]);

  const actionSwitch = () => {
    switch (action.type) {
      case STOP_ANIMATION:
      case EXIT_ANIMATION:
        return onStopAnimation();
      case LOCATION_POP_ACTION: {
        const newState = util.fromQueryString(action.payload.search);
        const extent = lodashGet(map, 'extent');
        const rotate = lodashGet(map, 'rotation') || 0;
        setTimeout(() => {
          updateProjection();
          if (newState.v && !newState.e && extent) {
            flyToNewExtent(extent, rotate);
          }
        }, 200); return;
      }
      case layerConstants.UPDATE_GRANULE_LAYER_OPTIONS: {
        const granuleOptions = {
          id: action.id,
          reset: null,
        };
        return reloadLayers(granuleOptions);
      }
      case layerConstants.RESET_GRANULE_LAYER_OPTIONS: {
        const granuleOptions = {
          id: action.id,
          reset: action.id,
        };
        return reloadLayers(granuleOptions);
      }
      case compareConstants.CHANGE_STATE:
        if (compareMode === 'spy') {
          return reloadLayers();
        }
        return;
      case layerConstants.REORDER_LAYERS:
      case layerConstants.REORDER_OVERLAY_GROUPS:
      case compareConstants.TOGGLE_ON_OFF:
      case compareConstants.CHANGE_MODE:
        reloadLayers();
        preloadForCompareMode();
        return;
      case layerConstants.TOGGLE_OVERLAY_GROUPS:
        return reloadLayers();
      case paletteConstants.SET_THRESHOLD_RANGE_AND_SQUASH:
      case paletteConstants.SET_CUSTOM:
      case paletteConstants.SET_DISABLED_CLASSIFICATION:
      case paletteConstants.CLEAR_CUSTOM:
      case layerConstants.ADD_LAYERS_FOR_EVENT:
        return setTimeout(reloadLayers, 100);
      case vectorStyleConstants.SET_FILTER_RANGE:
      case vectorStyleConstants.SET_VECTORSTYLE:
      case vectorStyleConstants.CLEAR_VECTORSTYLE:
      case SET_SCREEN_INFO:
        return onResize();
      default:
        break;
    }
  };

  const flyToNewExtent = function(extent, rotation) {
    const coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
    const coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
    const coordinates = [coordinateX, coordinateY];
    const resolution = ui.selected.getView().getResolutionForExtent(extent);
    const zoom = ui.selected.getView().getZoomForResolution(resolution);
    // Animate to extent, zoom & rotate:
    // Don't animate when an event is selected (Event selection already animates)
    return fly(ui.selected, proj, coordinates, zoom, rotation);
  };

  /**
 * Create a Layergroup given the date and layerGroups when compare mode is activated and
 * the group similar layers option is selected.
 *
 * @method getCompareLayerGroup
 * @static
 *
 * @param {string} compareActiveString
 * @param {string} compareDateString
 * @param {object} state object representing the layers, compare, & proj properties from global state
 * @param {object} granuleOptions object representing selected granule layer options
 */
  async function getCompareLayerGroup([compareActiveString, compareDateString], state, granuleOptions) {
    const { createLayer } = ui;
    const compareSideLayers = getActiveLayers(state, compareActiveString);
    const layers = getLayers(state, { reverse: true }, compareSideLayers)
      .map(async (def) => {
        const options = {
          ...getGranuleOptions(state, def, compareActiveString, granuleOptions),
          date: getSelectedDate(dateCompareState, compareDateString),
          group: compareActiveString,
        };
        // Check if the layer contains a palette & load if necessary
        if (def.palette) {
          requestPalette(def.id);
        }
        return createLayer(def, options);
      });
    const compareLayerGroup = await Promise.all(layers);

    return new OlLayerGroup({
      layers: compareLayerGroup,
      date: getSelectedDate(dateCompareState, compareDateString),
      group: compareActiveString,
    });
  }

  /**
  * Remove Layers from map
  *
  * @method clearLayers
  * @static
  *
  * @returns {void}
  */
  const clearLayers = function() {
    const activeLayersUI = ui.selected
      .getLayers()
      .getArray()
      .slice(0);
    lodashEach(activeLayersUI, (mapLayer) => {
      ui.selected.removeLayer(mapLayer);
    });
    ui.cache.clear();
  };

  /**
   * @method reloadLayers
   *
   * @param {Object} granuleOptions (optional: only used for granule layers)
   *   @param {Boolean} granuleDates - array of granule dates
   *   @param {Boolean} id - layer id
   * @returns {void}
   */
  async function reloadLayers(granuleOptions) {
    const mapUI = ui.selected;
    const { createLayer } = ui;

    if (!config.features.compare || !compare.active) {
      const compareMapDestroyed = !compare.active && compareMapUi.active;
      if (compareMapDestroyed) {
        compareMapUi.destroy();
      }
      clearLayers();
      const defs = getLayers(layerState, { reverse: true });
      const layerPromises = defs.map((def) => {
        const options = getGranuleOptions(layerState, def, compare.activeString, granuleOptions);
        return createLayer(def, options);
      });
      const createdLayers = await Promise.all(layerPromises);
      lodashEach(createdLayers, (l) => { mapUI.addLayer(l); });
    } else {
      const stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
      if (compare && !compare.isCompareA && compare.mode === 'spy') {
        stateArray.reverse(); // Set Layer order based on active A|B group
      }
      clearLayers();
      const stateArrayGroups = stateArray.map(async (arr) => getCompareLayerGroup(arr, layerState, granuleOptions));
      const compareLayerGroups = await Promise.all(stateArrayGroups);
      compareLayerGroups.forEach((layerGroup) => mapUI.addLayer(layerGroup));
      compareMapUi.create(mapUI, compare.mode);
    }
    updateLayerVisibilities();
  }

  const onStopAnimation = function() {
    const needsRefresh = activeLayers.some(({ type }) => type === 'granule' || type === 'vector');
    if (needsRefresh) {
      // The SELECT_DATE and STOP_ANIMATION actions happen back to back and both
      // try to modify map layers asynchronously so we need to set a timeout to allow
      // the updateDate() function to complete before trying to call reloadLayers() here
      setTimeout(reloadLayers, 100);
    }
  };

  /**
 * When page is resized set for mobile or desktop
 *
 * @method onResize
 * @static
 *
 * @returns {void}
 */
  function onResize() {
    const mapUI = ui.selected;
    if (isMobile) {
      mapUI.removeControl(mapUI.wv.scaleImperial);
      mapUI.removeControl(mapUI.wv.scaleMetric);
    } else {
      mapUI.addControl(mapUI.wv.scaleImperial);
      mapUI.addControl(mapUI.wv.scaleMetric);
    }
  }

  /**
 * Show Map
 *
 * @method showMap
 * @static
 *
 * @param {object} map - Openlayers Map obj
 *
 * @returns {void}
 */
  function showMap(map) {
    document.getElementById(`${map.getTarget()}`).style.display = 'block';
  }

  /**
 * Hide Map
 *
 * @method hideMap
 * @static
 *
 * @param {object} map - Openlayers Map obj
 *
 * @returns {void}
 */
  function hideMap(map) {
    document.getElementById(`${map.getTarget()}`).style.display = 'none';
  }


  const updateProjection = (start) => {
    if (ui.selected) {
      // Keep track of center point on projection switch
      ui.selected.previousCenter = ui.selected.center;
      hideMap(ui.selected);
    }
    ui.selected = ui.proj[proj.id];
    const map = ui.selected;

    const isProjectionRotatable = proj.id !== 'geographic' && proj.id !== 'webmerc';
    const currentRotation = isProjectionRotatable ? map.getView().getRotation() : 0;
    const rotationStart = isProjectionRotatable ? models.map.rotation : 0;
    const rotation = start ? rotationStart : currentRotation;

    updateMapUI(ui, rotation);

    reloadLayers();

    // If the browser was resized, the inactive map was not notified of
    // the event. Force the update no matter what and reposition the center
    // using the previous value.
    showMap(map);

    map.updateSize();

    if (ui.selected.previousCenter) {
      ui.selected.setCenter(ui.selected.previousCenter);
    }

    if (start) {
      const projId = proj.selected.id;
      let extent = null;
      let callback = null;
      if (models.map.extent) {
        extent = models.map.extent;
      } else if (!models.map.extent && projId === 'geographic') {
        extent = getLeadingExtent(config.pageLoadTime);
        callback = () => {
          const view = map.getView();
          const extent = view.calculateExtent(map.getSize());
          fitToLeadingExtent(extent);
        };
      }
      if (projId !== 'geographic') {
        callback = () => {
          const view = map.getView();
          view.setRotation(rotationStart);
        };
      }
      if (extent) {
        map.getView().fit(extent, {
          constrainResolution: false,
          callback,
        });
      } else if (rotationStart && projId !== 'geographic') {
        callback();
      }
    }
    updateExtent();
    onResize();
  };

  return null;
}

const mapStateToProps = (state) => {
  const {
    proj, map, screenSize, layers, compare, date,
  } = state;
  const layerState = { layers, compare, proj };
  const isMobile = screenSize.isMobileDevice;
  const dateCompareState = { date, compare };
  const activeLayers = getActiveLayers(state);
  const compareMode = compare.mode;
  return {
    activeLayers,
    compare,
    compareMode,
    dateCompareState,
    isMobile,
    layerState,
    proj,
    map,
    requestPalette,
  };
};

const mapDispatchToProps = (dispatch) => ({
  fitToLeadingExtent: (extent) => {
    dispatch(fitToLeadingExtent(extent));
  },
  updateMapUI: (ui, rotation) => {
    dispatch(updateMapUI(ui, rotation));
  },
  requestPalette: (id) => {
    dispatch(requestPalette(id));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UpdateProjection);

UpdateProjection.propTypes = {
  action: PropTypes.object,
  activeLayers: PropTypes.array,
  compare: PropTypes.object,
  compareMapUi: PropTypes.object,
  config: PropTypes.object,
  dateCompareState: PropTypes.object,
  fitToLeadingExtent: PropTypes.func,
  getGranuleOptions: PropTypes.func,
  isMobile: PropTypes.bool,
  layerState: PropTypes.object,
  map: PropTypes.object,
  models: PropTypes.object,
  preloadForCompareMode: PropTypes.func,
  proj: PropTypes.object,
  projectionTrigger: PropTypes.number,
  ui: PropTypes.object,
  updateExtent: PropTypes.func,
  updateLayerVisibilities: PropTypes.func,
  updateMapUi: PropTypes.func,
  requestPalette: PropTypes.func,
};
