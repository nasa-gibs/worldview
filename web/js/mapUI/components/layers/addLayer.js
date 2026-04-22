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
      const mapLayers = ui.selected.getLayers().getArray();
      const firstLayer = mapLayers[0];

      if (firstLayer && firstLayer.get('group') && firstLayer.get('granule') !== true) {
        const activelayer = firstLayer.get('group') === activeString
          ? firstLayer
          : mapLayers[1];
        const options = {
          date,
          group: activeString,
        };
        const newLayer = await createLayer(def, options);

        // Check for and remove any existing layer with the same ID to avoid duplicates
        const groupLayers = activelayer.getLayers();
        const existingIndex = groupLayers.getArray().findIndex(
          (l) => l.wv?.id === def.id,
        );
        let adjustedIndex = index;
        if (existingIndex >= 0) {
          groupLayers.removeAt(existingIndex);
          if (existingIndex < index) adjustedIndex -= 1;
        }

        if (adjustedIndex <= groupLayers.getLength()) {
          groupLayers.insertAt(adjustedIndex, newLayer);
        } else {
          groupLayers.push(newLayer);
        }
        compareMapUi.create(ui.selected, mode);
      } else {
        const newLayer = await createLayer(def);
        const layers = ui.selected.getLayers();

        // Check for and remove any existing layer with the same ID to avoid duplicates
        const existingIndex = layers.getArray().findIndex(
          (l) => l.wv?.id === def.id,
        );
        let adjustedIndex = index;
        if (existingIndex >= 0) {
          layers.removeAt(existingIndex);
          if (existingIndex < index) adjustedIndex -= 1;
        }

        if (adjustedIndex <= layers.getLength()) {
          layers.insertAt(adjustedIndex, newLayer);
        } else {
          layers.push(newLayer);
        }
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
