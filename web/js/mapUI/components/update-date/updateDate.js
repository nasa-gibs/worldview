import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  findIndex as lodashFindIndex,
  get as lodashGet,
} from 'lodash';
import {
  getActiveLayers,
  getAllActiveLayers,
  getActiveLayerGroup,
  getGranuleCount,
} from '../../../modules/layers/selectors';
import { setStyleFunction } from '../../../modules/vector-styles/selectors';
import { getSelectedDate } from '../../../modules/date/selectors';
import * as dateConstants from '../../../modules/date/constants';
import * as layerConstants from '../../../modules/layers/constants';

function UpdateDate(props) {
  const {
    action,
    activeLayers,
    activeString,
    compareMapUi,
    config,
    dateCompareState,
    findLayer,
    getGranuleOptions,
    granuleState,
    isCompareActive,
    layerState,
    preloadNextTiles,
    state,
    ui,
    updateLayerVisibilities,
    vectorStyleState,
  } = props;

  useEffect(() => {
    actionSwitch();
  }, [action]);

  const actionSwitch = () => {
    if (action.type === dateConstants.SELECT_DATE) {
      if (ui.processingPromise) {
        return new Promise((resolve) => {
          resolve(ui.processingPromise);
        }).then(() => {
          ui.processingPromise = null;
          return updateDate(action.outOfStep);
        });
      }
      return updateDate(action.outOfStep);
    } if (action.type === layerConstants.TOGGLE_LAYER_VISIBILITY || action.type === layerConstants.TOGGLE_OVERLAY_GROUP_VISIBILITY) {
      const outOfStep = false;
      // if date not changing we do not want to recreate ttiler layer
      const skipTtiler = true;
      return updateDate(outOfStep, skipTtiler);
    }
  };

  function findLayerIndex({ id }) {
    const layerGroup = getActiveLayerGroup(layerState);
    const layers = layerGroup.getLayers().getArray();
    return lodashFindIndex(layers, {
      wv: { id },
    });
  }

  function updateVectorStyles (def) {
    const { vectorStyles } = config;
    const layerName = def.layer || def.id;
    let vectorStyleId;

    vectorStyleId = def.vectorStyle.id;
    if (activeLayers) {
      activeLayers.forEach((layer) => {
        if (layer.id === layerName && layer.custom) {
          vectorStyleId = layer.custom;
        }
      });
    }
    setStyleFunction(def, vectorStyleId, vectorStyles, null, vectorStyleState);
  }

  const handleTtilerLayer = async (def, index, createLayer, layers, options, compareLayerGroup) => {
    const layer = findLayer(def, activeString);
    if (compareLayerGroup) {
      const compareLayers = compareLayerGroup.getLayers();
      compareLayers.remove(layer);
    } else {
      ui.selected.removeLayer(layer);
    }

    const layerOptions = options || layers[index];
    return createLayer(def, layerOptions);
  };

  async function updateCompareLayer (def, index, mapLayerCollection, layers, skipTtiler) {
    const { createLayer } = ui;
    const options = {
      group: activeString,
      date: getSelectedDate(dateCompareState),
      ...getGranuleOptions(granuleState, def, activeString),
    };

    if (def.type === 'ttiler') {
      if (skipTtiler) return;

      const mapLayers = ui.selected.getLayers().getArray();
      const firstLayer = mapLayers[0];
      const compareLayerGroup = firstLayer.get('group') === activeString
        ? firstLayer
        : mapLayers[1];

      handleTtilerLayer(def, index, createLayer, layers, options, compareLayerGroup)
        .then((createdTtilerLayer) => {
          compareLayerGroup.getLayers().insertAt(index, createdTtilerLayer);
          compareMapUi.update(activeString);
        });
    } else {
      const updatedLayer = await createLayer(def, options);
      mapLayerCollection.setAt(index, updatedLayer);
      compareMapUi.update(activeString);
    }
  }

  async function updateDate(outOfStepChange, skipTtiler) {
    const { createLayer } = ui;

    const layerGroup = getActiveLayerGroup(layerState);
    const mapLayerCollection = layerGroup.getLayers();
    const layers = mapLayerCollection.getArray();
    const activeLayers = getAllActiveLayers(state);

    const visibleLayers = activeLayers.filter(
      ({ id }) => layers
        .map(({ wv }) => lodashGet(wv, 'def.id'))
        .includes(id),
    ).filter(({ visible }) => visible);

    const layerPromises = visibleLayers.map(async (def) => {
      const { id, type } = def;
      const temporalLayer = ['subdaily', 'daily', 'monthly', 'yearly']
        .includes(def.period);
      const index = findLayerIndex(def);
      const hasVectorStyles = config.vectorStyles && lodashGet(def, 'vectorStyle.id');
      if (isCompareActive && layers.length) {
        await updateCompareLayer(def, index, mapLayerCollection, layers, skipTtiler);
      } else if (temporalLayer) {
        if (def.type === 'ttiler' && !skipTtiler) {
          handleTtilerLayer(def, index, createLayer, layers)
            .then((createdTtilerLayer) => {
              ui.selected.addLayer(createdTtilerLayer);
            // mapLayerCollection.setAt(index, createdTtilerLayer);
            });
        } else if (index !== undefined && index !== -1) {
          const layerValue = layers[index];
          const layerOptions = type === 'granule'
            ? { granuleCount: getGranuleCount(granuleState, id) }
            : { previousLayer: layerValue ? layerValue.wv : null };
          const updatedLayer = await createLayer(def, layerOptions);
          mapLayerCollection.setAt(index, updatedLayer);
        }
      }
      if (hasVectorStyles && temporalLayer) {
        updateVectorStyles(def);
      }
    });
    await Promise.all(layerPromises);
    updateLayerVisibilities();
    if (!outOfStepChange) {
      preloadNextTiles();
    }
  }

  return null;
}

const mapStateToProps = (state) => {
  const {
    compare, date, layers, proj, vectorStyles, config, map,
  } = state;
  const dateCompareState = { date, compare };
  const { activeString } = compare;
  const activeLayers = getActiveLayers(state);
  const isCompareActive = compare.active;
  const granuleState = { compare, layers };
  const layerState = { compare, map };
  const vectorStyleState = { proj, vectorStyles, config };

  return {
    activeLayers,
    activeString,
    dateCompareState,
    granuleState,
    isCompareActive,
    layerState,
    state,
    vectorStyleState,
  };
};

export default connect(
  mapStateToProps,
)(UpdateDate);

UpdateDate.propTypes = {
  action: PropTypes.object,
  activeLayers: PropTypes.array,
  activeString: PropTypes.string,
  compareMapUi: PropTypes.object,
  config: PropTypes.object,
  dateCompareState: PropTypes.object,
  getGranuleOptions: PropTypes.func,
  granuleState: PropTypes.object,
  isComparActive: PropTypes.bool,
  layerState: PropTypes.object,
  preloadNextTiles: PropTypes.func,
  state: PropTypes.object,
  ui: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
  vectorStyleState: PropTypes.object,
};
