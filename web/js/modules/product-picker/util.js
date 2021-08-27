import safeLocalStorage from '../../util/local-storage';
import util from '../../util/util';

const { RECENT_LAYERS } = safeLocalStorage.keys;
const MAX_RECENT_LAYERS = 20;

function getDefaultObj (projections) {
  const DEFAULT_OBJ = {};
  projections.forEach((proj) => { DEFAULT_OBJ[proj] = []; });
  return DEFAULT_OBJ;
}

function getLayersCheckProjections (allProjections) {
  const recentLayersJson = safeLocalStorage.getItem(RECENT_LAYERS);
  const recentLayers = JSON.parse(recentLayersJson) || getDefaultObj(allProjections);
  if (Object.keys(recentLayers).length !== allProjections.length) {
    allProjections.forEach((proj) => {
      recentLayers[proj] = recentLayers[proj] || [];
    });
  }
  return recentLayers;
}

export function getRecentLayers(layerConfig, proj) {
  const byUse = (a, b) => {
    if (a.count > b.count) return -1;
    if (a.count < b.count) return 1;
    if (a.dateAdded > b.dateAdded) return 1;
    if (a.dateAdded < b.dateAdded) return -1;
  };

  const toLayerObj = ({ id }) => layerConfig[id];
  const filterUnknownLayers = (layerDef) => layerDef !== undefined;
  const layers = JSON.parse(safeLocalStorage.getItem(RECENT_LAYERS));
  return layers && layers[proj] ? layers[proj].sort(byUse).map(toLayerObj).filter(filterUnknownLayers) : [];
}

export function clearRecentLayers() {
  safeLocalStorage.removeItem(RECENT_LAYERS);
}

/**
 *
 * @param {*} layer - the layer being added to the map
 */
export function clearSingleRecentLayer(layer, allProjections) {
  const {
    id: layerId,
    projections: layerProjections,
  } = layer;
  const recentLayers = getLayersCheckProjections(allProjections);
  Object.keys(layerProjections).forEach((proj) => {
    const layers = recentLayers[proj];
    recentLayers[proj] = layers.filter(({ id }) => id !== layerId);
  });
  safeLocalStorage.setItem(RECENT_LAYERS, JSON.stringify(recentLayers));
}

/**
 *
 * @param {*} layer - the layer being added to the map
 */
export function updateRecentLayers(layer, allProjections) {
  if (!safeLocalStorage.enabled) {
    return;
  }
  const {
    id: layerId,
    projections: layerProjections,
  } = layer;
  const recentLayers = getLayersCheckProjections(allProjections);
  Object.keys(layerProjections).forEach((proj) => {
    const layers = recentLayers[proj];
    const existingEntry = layers.find(({ id }) => id === layerId);

    if (existingEntry) {
      existingEntry.count += 1;
      existingEntry.dateAdded = util.now().valueOf();
    } else {
      if (layers.length === MAX_RECENT_LAYERS) {
        const [lowestCountLayer] = layers.sort((a, b) => a.count - b.count);
        const filteredByCount = layers.filter(
          ({ count }) => count === lowestCountLayer.count,
        );
        const [oldestLowest] = filteredByCount.sort(
          (a, b) => a.dateAdded.valueOf() - b.dateAdded.valueOf(),
        );
        recentLayers[proj] = layers.filter(({ id }) => id !== oldestLowest.id);
      }
      recentLayers[proj].push({
        id: layerId,
        count: 1,
        dateAdded: util.now().valueOf(),
      });
    }
  });
  safeLocalStorage.setItem(RECENT_LAYERS, JSON.stringify(recentLayers));
}

export const recentLayerInfo = `Layers that you’ve recently added to the map can be found here.
  This list is sorted by frequency of use, descending.
  This information is stored locally in your browser;
  we do not track this information on our servers.`;
