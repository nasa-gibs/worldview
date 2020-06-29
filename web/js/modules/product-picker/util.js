import safeLocalStorage from '../../util/local-storage';

const { RECENT_LAYERS } = safeLocalStorage.keys;
const MAX_RECENT_LAYERS = 20;

export function getRecentLayers() {
  return JSON.parse(safeLocalStorage.getItem(RECENT_LAYERS));
}

export function clearRecentLayers() {
  safeLocalStorage.removeItem(RECENT_LAYERS);
}

/**
 *
 * @param {*} layer - the layer being added to the map
 */
export function updateRecentLayers({ id: layerId, projections }) {
  const defaultObj = {
    geographic: [],
    arctic: [],
    antarctic: [],
  };
  const recentLayersJson = safeLocalStorage.getItem(RECENT_LAYERS);
  const recentLayers = JSON.parse(recentLayersJson) || defaultObj;

  Object.keys(projections).forEach((proj) => {
    const layers = recentLayers[proj];
    const existingEntry = layers.find(({ id }) => id === layerId);

    if (existingEntry) {
      existingEntry.count += 1;
      existingEntry.dateAdded = new Date().valueOf();
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
        dateAdded: new Date().valueOf(),
      });
    }
  });
  safeLocalStorage.setItem(RECENT_LAYERS, JSON.stringify(recentLayers));
}

export const recentLayerInfo = `Layers that you’ve recently added to the map can be found here.
  This list is sorted by frequency of use, descending.
  This information is stored locally in your browser;
  we do not track this information on our servers.`;
