import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  findIndex as lodashFindIndex,
  find as lodashFind,
} from 'lodash';
import { getLayers } from '../../../modules/layers/selectors';
import * as layerConstants from '../../../modules/layers/constants';
import { clearPreload as clearPreloadAction } from '../../../modules/date/actions';
import { DISPLAY_STATIC_MAP } from '../../../modules/ui/constants';

function AddLayer(props) {
  const {
    action,
    activeString,
    clearPreload: dispatchClearPreload,
    compareDate,
    compareMapUi,
    mode,
    preloadNextTiles,
    projFilteredLayers,
    updateLayerVisibilities,
    ui,
  } = props;

  /**
  * Initiates the adding of a layer
  * @param {object} def - layer Specs
  * @param {string|object} layerDate - optional date override
  * @param {array} activeLayersParam - optional active layers
  * @returns {void}
  */
  const addLayer = async function(def, layerDate, activeLayersParam) {
    // Immediately update visibility for already-loaded layers before async layer creation
    updateLayerVisibilities();

    try {
      const { createLayer } = ui;
      const date = layerDate || compareDate;
      const reverseLayers = projFilteredLayers;
      const index = lodashFindIndex(reverseLayers, { id: def.id });
      if (index === -1) return;
      const targetOrder = reverseLayers.map((l) => l.id);
      const mapLayers = ui.selected.getLayers().getArray();
      const firstLayer = mapLayers[0];

      const isGrouped = firstLayer && firstLayer.get('group') && firstLayer.get('granule') !== true;

      let targetGroup;
      if (isGrouped) {
        const activeLayerGroup = firstLayer.get('group') === activeString
          ? firstLayer
          : mapLayers[1];
        targetGroup = activeLayerGroup.getLayers();
      } else {
        targetGroup = ui.selected.getLayers();
      }

      const options = isGrouped ? { date, group: activeString } : undefined;
      const newLayer = await createLayer(def, options);

      const currentOlLayers = targetGroup.getArray();

      // Check for and remove existing layer instance with same ID
      const existingIndex = currentOlLayers.findIndex((l) => l.wv?.id === def.id);
      if (existingIndex >= 0) {
        targetGroup.removeAt(existingIndex);
      }

      const updatedOlLayers = targetGroup.getArray();
      const insertPosition = getRelativeOlIndex(updatedOlLayers, targetOrder, index);

      if (insertPosition < targetGroup.getLength()) {
        targetGroup.insertAt(insertPosition, newLayer);
      } else {
        targetGroup.push(newLayer);
      }

      if (isGrouped) {
        compareMapUi.create(ui.selected, mode);
      }

      updateLayerVisibilities();
      preloadNextTiles();
    } catch (error) {
      console.warn(`addLayer failed for ${def?.id}:`, error);
    }
  };

  const granuleLayerAdd = (def) => {
    // Chain onto any in-flight processingPromise so concurrent operations
    // (e.g. reloadLayers building compare groups) are not clobbered.
    const previous = ui.processingPromise || Promise.resolve();
    const layerPromise = previous
      .catch(() => {})
      .then(() => addLayer(def));
    ui.processingPromise = layerPromise;
  };

  // add static layer for kiosk mode in case of gibs/dns failure
  const addStaticLayer = async() => {
    const { createLayer } = ui;
    const newLayer = await createLayer();
    ui.selected.getLayers().insertAt(0, newLayer);
  };

  /**
  * Helper to calculate the relative OpenLayers insertion index based on current Redux target order.
  * @param {array} currentOlLayers - Array of current OL layer instances
  * @param {array} targetOrder - Array of layer IDs in desired order (e.g. projFilteredLayers IDs)
  * @param {number} targetIndex - Index of the layer being inserted in targetOrder
  * @returns {number} Calculated OpenLayers insertion index
  */
  const getRelativeOlIndex = (currentOlLayers, targetOrder, targetIndex) => {
    let hasValidIds = false;
    const targetId = targetOrder[targetIndex];

    for (let i = 0; i < currentOlLayers.length; i += 1) {
      const currentOlLayerId = currentOlLayers[i]?.wv?.id || currentOlLayers[i]?.id;
      if (currentOlLayerId && currentOlLayerId !== targetId) {
        const currentReduxIndex = targetOrder.indexOf(currentOlLayerId);
        if (currentReduxIndex !== -1) {
          hasValidIds = true;
          if (currentReduxIndex > targetIndex) {
            return i;
          }
        }
      }
    }

    if (!hasValidIds) return targetIndex;

    // If no higher layer was found, fall back to targetIndex
    return currentOlLayers.length;
  };

  useEffect(() => {
    if (action.type === layerConstants.ADD_LAYER ||
      action.type === layerConstants.UPDATE_DDV_LAYER) {
      const def = lodashFind(action.layers, { id: action.id });
      if (def.type === 'granule') {
        return granuleLayerAdd(def);
      }
      dispatchClearPreload();
      addLayer(def);
    } else if (action.type === DISPLAY_STATIC_MAP) {
      addStaticLayer();
    }
    return undefined;
  }, [action]);

  return null;
}

const mapStateToProps = (state) => {
  const { compare, date, layers, proj } = state;
  const { activeString, mode } = compare;
  const { selected, selectedB } = date;
  const layerState = { layers, compare, proj };
  const projFilteredLayers = getLayers(layerState, { reverse: true });
  const compareDate = compare.active && activeString === 'activeB' ? selectedB : selected;
  return {
    projFilteredLayers,
    compareDate,
    activeString,
    mode,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearPreload: () => {
    dispatch(clearPreloadAction());
  },
});

export default React.memo(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(AddLayer),
);

AddLayer.propTypes = {
  activeString: PropTypes.string,
  action: PropTypes.object,
  clearPreload: PropTypes.func,
  compareDate: PropTypes.instanceOf(Date),
  compareMapUi: PropTypes.object,
  mode: PropTypes.string,
  preloadNextTiles: PropTypes.func,
  projFilteredLayers: PropTypes.array,
  selected: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
  ui: PropTypes.object,
};
