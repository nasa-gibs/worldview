import {
  each as lodashEach,
  get as lodashGet,
  filter as lodashFilter,
  find as lodashFind,
  cloneDeep as lodashCloneDeep,
  isUndefined as lodashIsUndefined,
  findIndex as lodashFindIndex,
  memoize as lodashMemoize,
} from 'lodash';
import { createSelector } from 'reselect';
import update from 'immutability-helper';
import util from '../../util/util';
import { getLayerNoticesForLayer } from '../notifications/util';
import { getSelectedDate } from '../date/selectors';

const getConfigParameters = ({ config }) => (config ? config.parameters : {});
const getProjState = ({ proj }) => proj;
const getCompareState = ({ compare }) => compare;
const getLayerState = ({ layers }) => layers;
const getConfig = ({ config }) => config;
const getLayerId = (state, { layer }) => layer && layer.id;

export const getStartingLayers = createSelector([getConfig], (config) => resetLayers(config));

export const isGroupingEnabled = ({ compare, layers }) => layers[compare.activeString].groupOverlays;

/**
 * Return a list of layers for the currently active compare state
 * regardless of projection
 */
export const getActiveLayers = (state, activeString) => {
  const { embed, compare, layers } = state;
  if (embed && embed.isEmbedModeActive) {
    return getActiveLayersEmbed(state, activeString);
  }
  return layers[activeString || compare.activeString].layers;
};

export const getActiveLayerGroup = (state) => {
  const { compare, map } = state;
  const { active, activeString } = compare || {};
  if (active) {
    const layerGroups = map.ui.selected.getLayers().getArray();
    if (layerGroups.length > 1) {
      return layerGroups[0].get('group') === activeString
        ? layerGroups[0]
        : layerGroups[1].get('group') === activeString
          ? layerGroups[1]
          : null;
    }
  }
  return map.ui.selected;
};

export const getActiveGranuleLayers = (state, activeString) => {
  const { compare, layers } = state;
  const { granuleLayers } = layers[activeString || compare.activeString] || {};
  return granuleLayers;
};

export const getGranuleLayer = (state, id, activeString) => {
  const granuleLayers = getActiveGranuleLayers(state, activeString);
  return granuleLayers ? granuleLayers[id] : false;
};

export const getGranuleCount = (state, id) => {
  const layer = getGranuleLayer(state, id);
  return layer ? layer.count : 20;
};

export const getActiveGranuleFootPrints = (state) => {
  const { layers, compare: { activeString } } = state;
  const granuleLayers = getActiveGranuleLayers(state);
  const { granuleFootprints } = layers[activeString];
  const granulePlatform = getGranulePlatform(state);

  const isActiveGranuleVisible = getActiveLayers(state).filter((layer) => {
    const { visible, type, subtitle } = layer;
    const isGranule = type === 'granule';
    return visible && isGranule && subtitle === granulePlatform;
  });

  return isActiveGranuleVisible.length && granuleLayers ? granuleFootprints : {};
};

export const getGranulePlatform = (state, activeString) => {
  const { compare, layers } = state;
  const { granulePlatform } = layers[activeString || compare.activeString];
  return granulePlatform;
};

export const getGranuleLayersOfActivePlatform = (platform, activeLayers) => {
  const activeLayersArray = Object.entries(activeLayers);
  const platformLayers = [];
  activeLayersArray.forEach(([key, value]) => {
    if (value.granulePlatform === platform) {
      platformLayers.push(key);
    }
  });
  return platformLayers;
};

/**
 * Return an array of overlay groups for the currently active compare state
 * that are available for the currently active projection
 */
export const getActiveOverlayGroups = (state) => {
  const {
    embed, compare, layers, proj,
  } = state;
  const { overlayGroups } = layers[compare.activeString];
  if (embed && embed.isEmbedModeActive) {
    return getActiveOverlayGroupsEmbed(state);
  }
  const activeLayersMap = getActiveLayersMap(state);
  return (overlayGroups || []).filter(
    (group) => group.layers.filter(
      (id) => !!activeLayersMap[id].projections[proj.id],
    ).length,
  );
};

/**
 * Return a list of layers for the currently active compare state
 * regardless of projection (no hidden layers)
 */
const getActiveLayersEmbed = (state, activeString) => {
  const { compare, layers } = state;
  const activeLayers = layers[activeString || compare.activeString].layers;
  return activeLayers.filter((layer) => layer.visible);
};

/**
 * Return an array of filtered overlay groups for the currently active compare state
 * that are available for the currently active projection (no hidden or reference layers)
 *
 * @param {Object} state
 */
const getActiveOverlayGroupsEmbed = (state) => {
  const {
    compare, layers, proj,
  } = state;
  const { overlayGroups } = layers[compare.activeString];
  const activeLayersMap = getActiveLayersMap(state);
  const overlayGroupsFiltered = overlayGroups.filter((group) => group.groupName !== 'Reference');
  return (overlayGroupsFiltered || []).filter(
    (group) => group.layers.filter(
      (id) => !!activeLayersMap[id] && !!activeLayersMap[id].projections[proj.id]
          && !!activeLayersMap[id].visible,
    ).length,
  );
};

/**
 * Return a list of layer groups that filter out removed, hidden layers
 */
export const getFilteredOverlayGroups = (overlayGroups, overlays) => {
  const overlaysLayerIds = overlays.map((layer) => layer.id);
  // remove reference layers and revise overlay layers group
  return overlayGroups
    .filter((group) => group.groupName !== 'Reference')
    .map((group) => {
      const filteredLayers = group.layers.filter((layer) => overlaysLayerIds.includes(layer));
      const filteredGroup = { ...group };
      filteredGroup.layers = filteredLayers;
      return filteredGroup;
    });
};

/**
 * Return a map of active layers where key is layer id
 */
export const getActiveLayersMap = createSelector(
  [getActiveLayers],
  (activeLayers) => {
    const activeLayerMap = {};
    activeLayers.forEach((layer) => { activeLayerMap[layer.id] = layer; });
    return activeLayerMap;
  },
);

export const getAllActiveLayers = createSelector(
  [getProjState, getCompareState, getLayerState],
  (proj, compare, layers) => getLayers({ proj, compare, layers }, {}),
);

export const getAllActiveOverlaysBaselayers = createSelector(
  [getProjState, getCompareState, getLayerState],
  (proj, compare, layers) => getLayers({ proj, compare, layers }, { group: 'all' }),
);

export const getActiveVisibleLayersAtDate = (state, date, activeString) => {
  const { proj } = state;
  const layers = getActiveLayers(state, activeString);
  const baseLayers = layers.filter(({ group }) => group === 'baselayers');
  return layers.filter(
    (l) => !!l.projections[proj.id] && isRenderable(l.id, layers, date, baseLayers, {}),
  );
};

export function hasMeasurementSource(current, config, projId) {
  let hasSource;
  Object.values(current.sources).forEach((source) => {
    if (hasMeasurementSetting(current, source, config, projId)) {
      hasSource = true;
    }
  });
  return hasSource;
}

/**
 * Look up the measurement description path for a given layer
 * so that metadata can be shown in the layer info modal.  Ignore
 * Orbital Track layers since they will be in multiple measurements.
 */
export const makeGetDescription = () => createSelector(
  [getConfig, getLayerId],
  ({ layers, measurements }, layerId) => {
    if (!layerId) return;
    const { layergroup } = layers[layerId];
    if (layergroup === 'Orbital Track') {
      return;
    }
    const [setting] = Object.keys(measurements)
      .filter((key) => !key.includes('Featured'))
      .map((key) => measurements[key])
      .flatMap(({ sources }) => Object.values(sources))
      .filter(({ settings }) => settings.find((id) => id === layerId));
    return (setting || {}).description;
  },
);

/**
 * var hasMeasurementSetting - Checks the (current) measurement's source
 *  for a setting and returns true if present.
 *
 * @param  {string} current The current config.measurements measurement.
 * @param  {string} source  The current measurement source.
 * @return {boolean}         Return true if the source contains settings.
 *
 */
export function hasMeasurementSetting(current, source, config, projId) {
  let hasSetting;
  Object.values(source.settings).forEach((setting) => {
    const layer = config.layers[setting];
    if (layer) {
      const proj = layer.projections;
      if (layer.id === setting && Object.keys(proj).indexOf(projId) > -1) {
        if (layer.layergroup === 'Orbital Track') {
          if (current.id === 'orbital-track') {
            hasSetting = true;
          }
          // Don't output sources with only orbit tracks
        } else {
          hasSetting = true;
        }
      }
    }
  });
  return hasSetting;
}

/**
 * See if an array of layers has a subdaily
 * product in it
 * @param {Array} layers
 */
export function hasSubDaily(layers) {
  if (layers && layers.length) {
    for (let i = 0; i < layers.length; i += 1) {
      if (layers[i].period === 'subdaily') {
        return true;
      }
    }
  }
  return false;
}

export const subdailyLayersActive = createSelector(
  [getActiveLayers],
  (layers) => hasSubDaily(layers),
);

export function addLayer(id, spec = {}, layersParam, layerConfig, overlayLength, projection, groupOverlays) {
  let layers = lodashCloneDeep(layersParam);
  if (projection) {
    layers = layers.filter((layer) => layer.projections[projection]);
  }
  if (lodashFind(layers, { id })) {
    return layers;
  }
  const def = lodashCloneDeep(layerConfig[id]);
  if (!def) {
    throw new Error(`No such layer: ${id}`);
  }

  // Set layer properties
  def.visible = spec.visible || true;
  def.min = spec.min || undefined;
  def.custom = spec.custom || undefined;
  def.max = spec.max || undefined;
  def.squash = spec.squash || undefined;
  def.disabled = spec.disabled || undefined;
  def.count = spec.count || undefined;

  if (!lodashIsUndefined(spec.visible)) {
    def.visible = spec.visible;
  } else if (!lodashIsUndefined(spec.hidden)) {
    def.visible = !spec.hidden;
  }
  def.opacity = lodashIsUndefined(spec.opacity) ? 1.0 : spec.opacity;

  // Place new layer in the appropriate array position
  if (def.group === 'overlays') {
    // TODO assuming first group in the array again here
    const groupIdx = layers.findIndex(({ layergroup }) => layergroup === def.layergroup);

    const findLastRefLayer = (layers) => {
      let lastRefIndex = 0;
      let index = 0;

      layers.forEach((layer) => {
        if (layer.layergroup === 'Reference') {
          lastRefIndex = index;
        }
        index += 1;
      });
      if (lastRefIndex === 0) {
        return lastRefIndex;
      }
      return lastRefIndex + 1;
    };

    const lastReferenceLayerIndex = findLastRefLayer(layers);

    if (groupOverlays && groupIdx >= 0) {
      layers.splice(groupIdx, 0, def);
    } else if (def.layergroup === 'Reference') {
      layers.unshift(def);
    } else {
      layers.splice(lastReferenceLayerIndex, 0, def);
    }
  } else {
    const overlaysLength = overlayLength || layers.filter((layer) => layer.group === 'overlays').length;
    layers.splice(overlaysLength, 0, def);
  }

  return layers;
}

/**
 * Reset to starting layers
 * @param {*} startingLayers
 * @param {*} layerConfig
 */
export function resetLayers(config) {
  const { defaults: { startingLayers, projection }, layers: layerConfig } = config;
  let layers = [];
  if (startingLayers) {
    lodashEach(startingLayers, (start) => {
      layers = addLayer(start.id, start, layers, layerConfig, null, projection);
    });
  }
  return layers;
}

/**
 *
 * @param {*} config
 * @param {*} layerId
 * @param {*} projId
 */
export function getTitles(config, layerId, projId) {
  try {
    let title;
    let subtitle;
    let tags;
    const forProj = lodashGet(
      config,
      `layers.${layerId}.projections.${projId}`,
    );
    if (forProj) {
      title = forProj.title;
      subtitle = forProj.subtitle;
      tags = forProj.tags;
    }
    const forLayer = config.layers[layerId];
    title = title || forLayer.title || `[${layerId}]`;
    subtitle = subtitle || forLayer.subtitle || '';
    tags = tags || forLayer.tags || '';
    return {
      title,
      subtitle,
      tags,
    };
  } catch (err) {
    throw new Error(`error in layer ${layerId}: ${err}`);
  }
}

/**
 *
 * @param {*} layers
 * @param {*} spec
 * @param {*} state
 */
export function getLayers(state, spec = {}, layersParam) {
  const layers = layersParam || getActiveLayers(state);
  const baselayers = forGroup('baselayers', spec, layers, state);
  const overlays = forGroup('overlays', spec, layers, state);
  if (spec.group === 'baselayers') {
    return baselayers;
  }
  if (spec.group === 'overlays') {
    return overlays;
  }
  if (spec.group === 'all') {
    return { baselayers, overlays };
  }
  if (spec.group) {
    throw new Error(`Invalid layer group: ${spec.group}`);
  }
  return baselayers.concat(overlays);
}

function forGroup(group, spec = {}, activeLayers, state) {
  const projId = state.proj.id;
  let results = [];
  const defs = lodashFilter(activeLayers, { group });
  lodashEach(defs, (def) => {
    const notInProj = !def.projections[projId];
    const notRenderable = spec.renderable
      && !isRenderable(def.id, activeLayers, spec.date, null, state);
    if (notInProj || notRenderable) {
      return;
    }
    results.push(def);
  });
  if (spec.reverse) {
    results = results.reverse();
  }
  return results;
}

/**
 * Build end date for future layer
 *
 * @method getFutureLayerEndDate
 * @param  {Object} layer
 * @returns {Object} date object
 */
export function getFutureLayerEndDate(layer) {
  const { futureTime } = layer;
  const max = util.now();
  const dateType = futureTime.slice(-1);
  const dateInterval = futureTime.slice(0, -1);

  if (dateType === 'D') {
    max.setUTCDate(max.getUTCDate() + parseInt(dateInterval, 10));
  } else if (dateType === 'M') {
    max.setUTCMonth(max.getUTCMonth() + parseInt(dateInterval, 10));
  } else if (dateType === 'Y') {
    max.setUTCFullYear(max.getUTCFullYear() + parseInt(dateInterval, 10));
  }
  return util.roundTimeQuarterHour(max);
}

/**
 * Determine date range for layers
 * @param {*} spec
 * @param {*} activeLayers
 * @param {*} config
 */
export function dateRange({ layer }, activeLayers, parameters = {}) {
  const now = util.now();
  const { debugGIBS, ignoreDateRange } = parameters;
  if (debugGIBS || ignoreDateRange) {
    return {
      start: new Date(Date.UTC(1970, 0, 1)),
      end: now,
    };
  }

  let min = Number.MAX_VALUE;
  let max = 0;
  let range = false;
  const maxDates = [];
  // Use the minute ceiling of the current time so that we don't run into an issue where
  // seconds value of current appNow time is greater than a layer's available time range
  const minuteCeilingCurrentTime = util.now().setSeconds(59);
  const layers = layer
    ? [lodashFind(activeLayers, { id: layer })]
    : activeLayers;

  layers.forEach((def) => {
    if (!def) {
      return;
    }
    const {
      startDate, endDate, ongoing, futureTime,
    } = def;

    if (startDate) {
      range = true;
      const start = util.parseDateUTC(startDate).getTime();
      min = Math.min(min, start);
    }

    // For now, we assume that any layer with an end date is
    // an ongoing product unless it is marked as inactive.
    if (futureTime && endDate) {
      range = true;
      max = util.parseDateUTC(endDate).getTime();
      maxDates.push(new Date(max));
    } else if (!ongoing && endDate) {
      range = true;
      const end = util.parseDateUTC(endDate).getTime();
      max = Math.max(max, end);
      maxDates.push(new Date(max));
    } else if (endDate) {
      range = true;
      max = minuteCeilingCurrentTime;
      maxDates.push(new Date(max));
    }

    // If there is a start date but no end date, this is a
    // product that is currently being created each day, set
    // the max day to today.
    if (futureTime && !endDate) {
      // Calculate endDate + parsed futureTime from layer JSON
      max = getFutureLayerEndDate(def);
      maxDates.push(new Date(max));
    } else if (startDate && !endDate) {
      max = minuteCeilingCurrentTime;
      maxDates.push(new Date(max));
    }
  });

  if (range) {
    if (max === 0) {
      max = minuteCeilingCurrentTime;
      maxDates.push(max);
    }
    const maxDate = Math.max.apply(max, maxDates);
    return {
      start: new Date(min),
      end: new Date(maxDate),
    };
  }
}

/**
 * Determine if a given layer is available
 * @param {*} id
 * @param {*} date
 * @param {*} layers
 * @param {*} config
 */
export function available(id, date, layers, parameters) {
  const range = dateRange({ layer: id }, layers, parameters);
  if (range && (date < range.start || date > range.end)) {
    return false;
  }
  return true;
}

/**
 * Determine if a given layer is available
 * @param {*} id - the layer id
 */
export const memoizedAvailable = createSelector(
  [getSelectedDate, getActiveLayers, getConfigParameters],
  (currentDate, activeLayers, parameters) => lodashMemoize((id) => available(id, currentDate, activeLayers, parameters)),
);

/**
 * Determine if a layer should be rendered if it would be visible
 *
 * @param {*} id
 * @param {*} activeLayers
 * @param {*} date
 * @param {*} state
 */
export function isRenderable(id, layers, date, bLayers, state) {
  const { parameters } = state.config || {};
  date = date || getSelectedDate(state);
  const def = lodashFind(layers, { id });
  const notAvailable = !available(id, date, layers, parameters);

  if (!def || notAvailable || !def.visible || def.opacity === 0) {
    return false;
  }
  if (def.group === 'overlays') {
    return true;
  }
  let obscured = false;
  const baselayers = bLayers || getLayers(state, { group: 'baselayers' }, layers);
  lodashEach(
    baselayers,
    (otherDef) => {
      if (otherDef.id === def.id) {
        return false;
      }
      if (
        otherDef.visible
        && otherDef.opacity === 1.0
        && available(otherDef.id, date, layers, parameters)
      ) {
        obscured = true;
        return false;
      }
    },
  );
  return !obscured;
}

export const findEventLayers = (originalLayers, newLayers) => {
  const uniqueLayers = [];

  newLayers.forEach((newLayer) => {
    if (!originalLayers.some((originalLayer) => originalLayer.id === newLayer.id)) {
      uniqueLayers.push(newLayer.id);
    }
  });

  return uniqueLayers;
};

export function activateLayersForEventCategory(state, category) {
  const {
    config: { naturalEvents: { layers } },
    layers: { layerConfig },
    proj: { id: projection },
  } = state;

  const categoryLayers = layers[projection][category];

  let newLayers = getActiveLayers(state);
  if (!categoryLayers) {
    return newLayers;
  }
  // Turn off all layers in list first
  newLayers.forEach((layer, index) => {
    newLayers = update(newLayers, {
      [index]: { visible: { $set: false } },
    });
  });
  // Turn on or add new layers
  categoryLayers.forEach((layer) => {
    const [id, visible] = layer;
    const index = lodashFindIndex(newLayers, { id });
    if (index >= 0) {
      newLayers = update(newLayers, {
        [index]: { visible: { $set: visible } },
      });
    } else {
      const overlays = getLayers(state, { group: 'overlays' }, newLayers);
      newLayers = addLayer(
        id,
        { visible },
        newLayers,
        layerConfig,
        overlays.length,
        projection,
        null,
      );
    }
  });
  return newLayers;
}

export function pushToBottom(id, layers, layerSplit) {
  const decodedId = util.decodeId(id);
  const oldIndex = lodashFindIndex(layers, {
    id: decodedId,
  });
  if (oldIndex < 0) {
    throw new Error(`Layer is not active: ${decodedId}`);
  }
  const def = layers[oldIndex];
  layers.splice(oldIndex, 1);
  if (def.group === 'baselayers') {
    layers.push(def);
  } else {
    layers.splice(layerSplit - 1, 0, def);
  }
  return layers;
}

export function moveBefore(sourceId, targetId, layers) {
  const decodedId = util.decodeId(sourceId);
  let sourceIndex = lodashFindIndex(layers, {
    id: decodedId,
  });
  if (sourceIndex < 0) {
    throw new Error(`Layer is not active: ${decodedId}`);
  }
  const sourceDef = layers[sourceIndex];
  const targetIndex = lodashFindIndex(layers, {
    id: targetId,
  });
  if (targetIndex < 0) {
    throw new Error(`Layer is not active: ${targetId}`);
  }
  layers.splice(targetIndex, 0, sourceDef);
  if (sourceIndex > targetIndex) {
    sourceIndex += 1;
  }
  layers.splice(sourceIndex, 1);
  return layers;
}

export function replaceSubGroup(
  layerId,
  nextLayerId,
  layers,
  layerSplit,
) {
  if (nextLayerId) {
    return moveBefore(layerId, nextLayerId, layers);
  }
  return pushToBottom(layerId, layers, layerSplit);
}

export function getZotsForActiveLayers(state) {
  const {
    config, proj, map, notifications,
  } = state;
  const zotObj = {};
  const { sources } = config;
  const projection = proj.selected.id;
  const zoom = map.ui.selected.getView().getZoom();
  lodashEach(getActiveLayersMap(state), (layer) => {
    if (layer.projections[projection]) {
      const overZoomValue = getZoomLevel(layer, zoom, projection, sources);
      const layerNotices = getLayerNoticesForLayer(layer.id, notifications);
      if (overZoomValue || layerNotices.length) {
        zotObj[layer.id] = {
          overZoomValue,
          layerNotices,
        };
      }
    }
  });
  return zotObj;
}

function getZoomLevel(layer, zoom, proj, sources) {
  // Account for offset between the map's top zoom level and the
  // lowest-resolution TileMatrix in polar layers
  const zoomOffset = proj === 'arctic' || proj === 'antarctic' ? 1 : 0;
  const { matrixSet } = layer.projections[proj];

  if (matrixSet !== undefined && layer.type !== 'vector') {
    const { source } = layer.projections[proj];
    const zoomLimit = sources[source].matrixSets[matrixSet].resolutions.length - 1 + zoomOffset;
    if (zoom > zoomLimit) {
      const overZoomValue = Math.round((zoom - zoomLimit) * 100) / 100;
      return overZoomValue;
    }
  }
  return null;
}

export function getMaxZoomLevelLayerCollection(layers, zoom, proj, sources) {
  const zoomOffset = proj === 'arctic' || proj === 'antarctic' ? 1 : 0;
  let maxZoom;

  lodashEach(layers, (layer) => {
    const { matrixSet } = layer.projections[proj];
    if (matrixSet !== undefined && layer.type !== 'vector') {
      const { source } = layer.projections[proj];
      const zoomLimit = sources[source].matrixSets[matrixSet].resolutions.length - 1 + zoomOffset;
      if (!maxZoom) {
        maxZoom = zoomLimit;
      }
      maxZoom = Math.min(maxZoom, zoomLimit);
    }
  });
  return maxZoom || zoom;
}
