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
    getGranuleOptions,
    granuleState,
    isCompareActive,
    layerState,
    preloadNextTiles,
    allActiveLayersState,
    ui,
    updateLayerVisibilities,
    vectorStyleState,
  } = props;

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

  async function updateCompareLayer(
    def, index, mapLayerCollection, isStale, groupOverride, extraOptions,
  ) {
    const { createLayer } = ui;
    const group = groupOverride || activeString;
    const options = {
      group,
      date: getSelectedDate(dateCompareState, group === 'activeB' ? 'selectedB' : 'selected'),
      ...getGranuleOptions(granuleState, def, group),
      ...extraOptions,
    };
    const updatedLayer = await createLayer(def, options);
    if (isStale()) return;
    // Re-read current group after await since reloadLayers may have restructured it.
    let targetCollection = mapLayerCollection;
    let targetIndex = index;
    if (isCompareActive && ui.selected) {
      const allGroups = ui.selected.getLayers().getArray();
      const currentGroupLayer = allGroups.find((lg) => lg.get('group') === group);
      if (currentGroupLayer?.getLayers) {
        const freshCollection = currentGroupLayer.getLayers();
        // Re-find by id after await since concurrent rebuilds can shift indices.
        const freshArr = freshCollection.getArray();
        const freshIndex = lodashFindIndex(
          freshArr, { wv: { def: { id: def.id } } },
        );
        if (freshIndex === -1) return;
        targetCollection = freshCollection;
        targetIndex = freshIndex;
      }
    }
    targetCollection.setAt(targetIndex, updatedLayer);
    compareMapUi.update(group);
  }

  // Rebuild empty granule layers on a specific compare side.
  const MAX_CMR_REBUILD_ATTEMPTS = 3;
  async function rebuildEmptyCompareGranules(targetString, isStale) {
    if (!isCompareActive || !ui.selected) return;
    if (ui.processingPromise) {
      await ui.processingPromise;
      if (isStale()) return;
    }

    const allGroups = ui.selected.getLayers().getArray();
    const targetGroup = allGroups.find((g) => g.get('group') === targetString);
    if (!targetGroup) return;

    const targetCollection = targetGroup.getLayers();
    const targetLayers = targetCollection.getArray();

    // Use live OL layers, not the Redux snapshot which may be stale.
    const rebuildCandidates = targetLayers
      .map((layer, index) => ({ layer, index }))
      .filter(({ layer }) => {
        const { wv } = layer;
        return wv?.def?.type === 'granule' &&
          wv.pendingCmrRebuild &&
          (wv.cmrRebuildAttempts || 0) < MAX_CMR_REBUILD_ATTEMPTS;
      });

    await Promise.allSettled(rebuildCandidates.map(async ({ layer, index }) => {
      const extra = { cmrRebuildAttempts: layer.wv.cmrRebuildAttempts || 0 };
      await updateCompareLayer(layer.wv.def, index, targetCollection, isStale, targetString, extra);
    }));
  }

  // Rebuild empty granule layers on both compare sides.
  async function rebuildAllEmptyCompareGranules(isStale) {
    const inactiveString = activeString === 'active' ? 'activeB' : 'active';
    await Promise.allSettled([
      rebuildEmptyCompareGranules(activeString, isStale),
      rebuildEmptyCompareGranules(inactiveString, isStale),
    ]);
  }

  // Rebuild empty granule layers in non-compare (flat) mode.
  async function rebuildEmptyNonCompareGranules(isStale) {
    if (isCompareActive || !ui.selected) return;
    const { createLayer } = ui;

    const layerGroup = getActiveLayerGroup(layerState);
    const mapLayerCollection = layerGroup.getLayers();
    const layers = mapLayerCollection.getArray();

    const rebuildCandidates = layers
      .map((layer, index) => ({ layer, index }))
      .filter(({ layer }) => {
        const { wv } = layer;
        return wv?.def?.type === 'granule' &&
          wv.pendingCmrRebuild &&
          (wv.cmrRebuildAttempts || 0) < MAX_CMR_REBUILD_ATTEMPTS;
      });

    await Promise.allSettled(rebuildCandidates.map(async ({ layer }) => {
      const def = layer.wv.def;
      const layerOptions = {
        granuleCount: getGranuleCount(granuleState, def.id),
        cmrRebuildAttempts: layer.wv.cmrRebuildAttempts || 0,
      };
      const updatedLayer = await createLayer(def, layerOptions);
      if (isStale()) return;
      const freshLayers = mapLayerCollection.getArray();
      const freshIndex = freshLayers.findIndex(({ wv }) => wv?.def?.id === def.id);
      if (freshIndex === -1) return;
      mapLayerCollection.setAt(freshIndex, updatedLayer);
    }));
  }

  async function updateDate(outOfStepChange) {
    const { createLayer } = ui;

    // Sequence counter to discard stale results from rapid date changes.
    ui.dateUpdateSeq = (ui.dateUpdateSeq || 0) + 1;
    const mySeq = ui.dateUpdateSeq;
    const isStale = () => ui.dateUpdateSeq !== mySeq;

    const layerGroup = getActiveLayerGroup(layerState);
    const mapLayerCollection = layerGroup.getLayers();
    const layers = mapLayerCollection.getArray();
    const activeLayersArray = getAllActiveLayers(allActiveLayersState);

    const visibleLayers = activeLayersArray.filter(({ id, visible }) => layers
      .findIndex(({ wv }) => wv?.def?.id === id) !== -1 && visible);

    const layerPromises = visibleLayers.map(async (def) => {
      const { id, type } = def;
      const temporalLayer = ['subdaily', 'daily', 'monthly', 'yearly']
        .includes(def.period);
      const index = findLayerIndex(def);
      const hasVectorStyles = config.vectorStyles && lodashGet(def, 'vectorStyle.id');
      if (isCompareActive && layers.length && (temporalLayer || type === 'granule')) {
        await updateCompareLayer(def, index, mapLayerCollection, isStale);
      } else if (temporalLayer) {
        if (index !== undefined && index !== -1) {
          const layerValue = layers[index];
          const layerOptions = type === 'granule'
            ? { granuleCount: getGranuleCount(granuleState, id) }
            : { previousLayer: layerValue ? layerValue.wv : null };
          const updatedLayer = await createLayer(def, layerOptions);
          if (isStale()) return;
          const freshIndex = findLayerIndex(def);
          if (freshIndex === undefined || freshIndex === -1) return;
          mapLayerCollection.setAt(freshIndex, updatedLayer);
        }
      }
      if (hasVectorStyles && temporalLayer) {
        updateVectorStyles(def);
      }
    });
    await Promise.allSettled(layerPromises);
    if (isStale()) return;
    updateLayerVisibilities();
    if (!outOfStepChange) {
      preloadNextTiles();
    }
  }

  const actionSwitch = () => {
    if (action.type === dateConstants.SELECT_DATE) {
      // Show already-loaded layers right away while CMR requests are in flight.
      updateLayerVisibilities();

      if (ui.processingPromise) {
        const waitedPromise = ui.processingPromise;
        return new Promise((resolve) => {
          resolve(waitedPromise);
        }).then(() => {
          if (ui.processingPromise === waitedPromise) {
            ui.processingPromise = null;
          }
          return updateDate(action.outOfStep);
        });
      }
      return updateDate(action.outOfStep);
    }
    if (action.type === layerConstants.TOGGLE_LAYER_VISIBILITY ||
      action.type === layerConstants.TOGGLE_OVERLAY_GROUP_VISIBILITY) {
      const outOfStep = false;
      return updateDate(outOfStep);
    }
    // Rebuild layers when date ranges arrive late (L2/TEMPO, NRT).
    // Separate counter so SELECT_DATE doesn't stale-abort CMR rebuilds.
    if (action.type === layerConstants.ADD_GRANULE_DATE_RANGES) {
      ui.cmrRebuildSeq = (ui.cmrRebuildSeq || 0) + 1;
      const mySeq = ui.cmrRebuildSeq;
      const isStale = () => ui.cmrRebuildSeq !== mySeq;
      updateLayerVisibilities();
      const rebuildPromise = isCompareActive
        ? rebuildAllEmptyCompareGranules(isStale)
        : rebuildEmptyNonCompareGranules(isStale);
      return rebuildPromise.then(() => {
        if (!isStale()) updateLayerVisibilities();
      });
    }
    return undefined;
  };

  useEffect(() => {
    actionSwitch()?.catch((error) => {
      console.warn('updateDate actionSwitch failed:', error);
    });
  }, [action]);

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
  // Minimal slice for getAllActiveLayers — avoids passing entire Redux state
  // which defeats React-Redux shallow equality checks.
  const allActiveLayersState = { proj, compare, layers };

  return {
    activeLayers,
    activeString,
    allActiveLayersState,
    dateCompareState,
    granuleState,
    isCompareActive,
    layerState,
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
  isCompareActive: PropTypes.bool,
  layerState: PropTypes.object,
  preloadNextTiles: PropTypes.func,
  allActiveLayersState: PropTypes.object,
  ui: PropTypes.object,
  updateLayerVisibilities: PropTypes.func,
  vectorStyleState: PropTypes.object,
};
