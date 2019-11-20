import {
  each as lodashEach,
  get as lodashGet,
  filter as lodashFilter,
  find as lodashFind,
  cloneDeep as lodashCloneDeep,
  isUndefined as lodashIsUndefined,
  values as lodashValues,
  sortBy as lodashSortBy,
  indexOf as lodashIndexOf,
  findIndex as lodashFindIndex
} from 'lodash';
import update from 'immutability-helper';
import util from '../../util/util';

export function hasMeasurementSource(current, config, projId) {
  var hasSource;
  lodashValues(current.sources).forEach(function(source) {
    if (hasMeasurementSetting(current, source, config, projId)) {
      hasSource = true;
    }
  });
  return hasSource;
}

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
  var hasSetting;
  lodashValues(source.settings).forEach(function(setting) {
    var layer = config.layers[setting];
    if (layer) {
      var proj = layer.projections;
      if (layer.id === setting && Object.keys(proj).indexOf(projId) > -1) {
        if (
          layer.layergroup &&
          layer.layergroup.indexOf('reference_orbits') !== -1
        ) {
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

export function getLayersForProjection(config, projection) {
  var filteredRows = lodashValues(config.layers)
    .filter(function(layer) {
      // Only use the layers for the active projection
      return layer.projections[projection];
    })
    .map(function(layer) {
      // If there is metadata for the current projection, use that
      var projectionMeta = layer.projections[projection];
      if (projectionMeta.title) layer.title = projectionMeta.title;
      if (projectionMeta.subtitle) layer.subtitle = projectionMeta.subtitle;
      // Decode HTML entities in the subtitle
      if (layer.subtitle) layer.subtitle = decodeHtml(layer.subtitle);
      return layer;
    });
  return lodashSortBy(filteredRows, function(layer) {
    return lodashIndexOf(config.layerOrder, layer.id);
  });
}

var decodeHtml = function(html) {
  var txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

/**
 * See if an array of layers has a subdaily
 * product in it
 * @param {Array} layers
 */
export function hasSubDaily(layers) {
  if (layers && layers.length) {
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].period === 'subdaily') {
        return true;
      }
    }
  }
  return false;
}

export function addLayer(id, spec, layers, layerConfig, overlayLength) {
  layers = lodashCloneDeep(layers);
  if (
    lodashFind(layers, {
      id: id
    })
  ) {
    return layers;
  }
  spec = spec || {};
  var def = lodashCloneDeep(layerConfig[id]);
  if (!def) {
    throw new Error('No such layer: ' + id);
  }
  def.visible = spec.visible || true;
  def.min = spec.min || undefined;
  def.custom = spec.custom || undefined;
  def.max = spec.max || undefined;
  def.squash = spec.squash || undefined;

  if (!lodashIsUndefined(spec.visible)) {
    def.visible = spec.visible;
  } else if (!lodashIsUndefined(spec.hidden)) {
    def.visible = !spec.hidden;
  }
  def.opacity = lodashIsUndefined(spec.opacity) ? 1.0 : spec.opacity;
  if (def.group === 'overlays') {
    layers.unshift(def);
  } else {
    layers.splice(overlayLength, 0, def);
  }
  return layers;
}

/**
 * Reset to starting layers
 * @param {*} startingLayers
 * @param {*} layerConfig
 */
export function resetLayers(startingLayers, layerConfig) {
  let layers = [];
  if (startingLayers) {
    lodashEach(startingLayers, function(start) {
      layers = addLayer(start.id, start, layers, layerConfig);
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
    var title, subtitle, tags;
    const forProj = lodashGet(
      config,
      `layers.${layerId}.projections.${projId}`
    );
    if (forProj) {
      title = forProj.title;
      subtitle = forProj.subtitle;
      tags = forProj.tags;
    }
    // const forLayer = lodashGet(config, `layers.${layerId}`);
    var forLayer = config.layers[layerId];
    title = title || forLayer.title || '[' + layerId + ']';
    subtitle = subtitle || forLayer.subtitle || '';
    tags = tags || forLayer.tags || '';
    return {
      title: title,
      subtitle: subtitle,
      tags: tags
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
export function getLayers(layers, spec, state) {
  spec = spec || {};
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
    throw new Error('Invalid layer group: ' + spec.group);
  }
  return baselayers.concat(overlays);
}

function forGroup(group, spec, activeLayers, state) {
  spec = spec || {};
  var projId = spec.proj || state.proj.id;
  var results = [];
  var defs = lodashFilter(activeLayers, {
    group: group
  });
  lodashEach(defs, function(def) {
    // Skip if this layer isn't available for the selected projection
    if (!def.projections[projId] && projId !== 'all') {
      return;
    }
    if (
      spec.dynamic &&
      !['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)
    ) {
      return;
    }
    if (
      spec.renderable &&
      !isRenderable(def.id, activeLayers, spec.date, state)
    ) {
      return;
    }
    if (spec.visible && !def.visible) {
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
 * Determine if a given layer is available
 * @param {*} id
 * @param {*} date
 * @param {*} layers
 * @param {*} config
 */
export function available(id, date, layers, config) {
  const range = dateRange({ layer: id }, layers, config);
  if (range && (date < range.start || date > range.end)) {
    return false;
  }
  return true;
}

export function replaceSubGroup(
  layerId,
  nextLayerId,
  layers,
  subGroup,
  layerSplit
) {
  if (nextLayerId) {
    return moveBefore(layerId, nextLayerId, layers);
  } else {
    return pushToBottom(layerId, layers, layerSplit);
  }
}

/**
 * Determine date range for layers
 * @param {*} spec
 * @param {*} activeLayers
 * @param {*} config
 */
export function dateRange(spec, activeLayers, config) {
  var layers = spec.layer
    ? [lodashFind(activeLayers, { id: spec.layer })]
    : activeLayers;
  var ignoreRange = config.parameters && (config.parameters.debugGIBS || config.parameters.ignoreDateRange);
  if (ignoreRange) {
    return {
      start: new Date(Date.UTC(1970, 0, 1)),
      end: util.now()
    };
  }
  var min = Number.MAX_VALUE;
  var max = 0;
  var range = false;
  var maxDates = [];

  // Use the minute ceiling of the current time so that we don't run into an issue where
  // seconds value of current appNow time is greater than a layer's available time range
  const minuteCeilingCurrentTime = util.now().setSeconds(59);

  lodashEach(layers, function(def) {
    if (def) {
      if (def.startDate) {
        range = true;
        var start = util.parseDateUTC(def.startDate).getTime();
        min = Math.min(min, start);
      }
      // For now, we assume that any layer with an end date is
      // an ongoing product unless it is marked as inactive.
      if (def.futureLayer && def.endDate) {
        range = true;
        max = util.parseDateUTC(def.endDate).getTime();
        maxDates.push(new Date(max));
      } else if (def.inactive && def.endDate) {
        range = true;
        var end = util.parseDateUTC(def.endDate).getTime();
        max = Math.max(max, end);
        maxDates.push(new Date(max));
      } else if (def.endDate) {
        range = true;
        max = minuteCeilingCurrentTime;
        maxDates.push(new Date(max));
      }
      // If there is a start date but no end date, this is a
      // product that is currently being created each day, set
      // the max day to today.
      if (def.futureLayer && def.futureTime && !def.endDate) {
        // Calculate endDate + parsed futureTime from layer JSON
        max = new Date();
        var futureTime = def.futureTime;
        var dateType = futureTime.slice(-1);
        var dateInterval = futureTime.slice(0, -1);
        if (dateType === 'D') {
          max.setDate(max.getDate() + parseInt(dateInterval));
          maxDates.push(new Date(max));
        } else if (dateType === 'M') {
          max.setMonth(max.getMonth() + parseInt(dateInterval));
          maxDates.push(new Date(max));
        } else if (dateType === 'Y') {
          max.setYear(max.getYear() + parseInt(dateInterval));
          maxDates.push(new Date(max));
        }
      } else if (def.startDate && !def.endDate) {
        max = minuteCeilingCurrentTime;
        maxDates.push(new Date(max));
      }
    }
  });

  if (range) {
    if (max === 0) {
      max = minuteCeilingCurrentTime;
      maxDates.push(max);
    }
    var maxDate = Math.max.apply(max, maxDates);
    return {
      start: new Date(min),
      end: new Date(maxDate)
    };
  }
}

export function pushToBottom(id, layers, layerSplit) {
  const decodedId = util.decodeId(id);
  var oldIndex = lodashFindIndex(layers, {
    id: decodedId
  });
  if (oldIndex < 0) {
    throw new Error('Layer is not active: ' + decodedId);
  }
  var def = layers[oldIndex];
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
  var sourceIndex = lodashFindIndex(layers, {
    id: decodedId
  });
  if (sourceIndex < 0) {
    throw new Error('Layer is not active: ' + decodedId);
  }
  var sourceDef = layers[sourceIndex];
  var targetIndex = lodashFindIndex(layers, {
    id: targetId
  });
  if (targetIndex < 0) {
    throw new Error('Layer is not active: ' + targetId);
  }
  layers.splice(targetIndex, 0, sourceDef);
  if (sourceIndex > targetIndex) {
    sourceIndex++;
  }
  layers.splice(sourceIndex, 1);
  return layers;
}

/**
 * Determine if a layer should be rendered if it would be visible
 *
 * @param {*} id
 * @param {*} activeLayers
 * @param {*} date
 * @param {*} state
 */
export function isRenderable(id, activeLayers, date, state) {
  const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
  date = date || state.date[activeDateStr];
  const def = lodashFind(activeLayers, { id });
  const notAvailable = !available(id, date, activeLayers, state.config);

  if (!def || notAvailable || !def.visible || def.opacity === 0) {
    return false;
  }
  if (def.group === 'overlays') {
    return true;
  }
  let obscured = false;
  lodashEach(
    getLayers(activeLayers, { group: 'baselayers' }, state),
    (otherDef) => {
      if (otherDef.id === def.id) {
        return false;
      }
      if (
        otherDef.visible &&
        otherDef.opacity === 1.0 &&
        available(otherDef.id, date, activeLayers, state.config)
      ) {
        obscured = true;
        return false;
      }
    }
  );
  return !obscured;
}

export function lastDate(activeLayers, config) {
  var endDate;
  var layersDateRange = dateRange({}, activeLayers, config);
  var today = util.today();
  if (layersDateRange && layersDateRange.end > today) {
    endDate = layersDateRange.end;
  } else {
    endDate = today;
  }
  return endDate;
}

export function lastDateTime(activeLayers, config) {
  var endDate;
  var layersDateRange = dateRange({}, activeLayers, config);
  var now = util.now();
  if (layersDateRange && layersDateRange.end > now) {
    endDate = layersDateRange.end;
  } else {
    endDate = now;
  }
  return endDate;
}

export function activateLayersForEventCategory(activeLayers, state) {
  const { layers, compare } = state;
  // Turn off all layers in list first
  let newLayers = layers[compare.activeString];
  lodashEach(newLayers, function(layer, index) {
    newLayers = update(newLayers, {
      [index]: { visible: { $set: false } }
    });
  });
  // Turn on or add new layers
  lodashEach(activeLayers, function(layer) {
    var id = layer[0];
    var visible = layer[1];
    const index = lodashFindIndex(newLayers, { id });
    if (index >= 0) {
      newLayers = update(newLayers, {
        [index]: { visible: { $set: visible } }
      });
    } else {
      newLayers = addLayer(
        id,
        { visible },
        newLayers,
        layers.layerConfig,
        getLayers(newLayers, { group: 'all' }, state).overlays.length
      );
    }
  });
  return newLayers;
}

export function getZotsForActiveLayers(config, projection, map, activeLayers) {
  var zotObj = {};
  var sources = config.sources;
  var proj = projection.selected.id;
  var zoom = map.ui.selected.getView().getZoom();
  lodashEach(activeLayers, layer => {
    if (layer.projections[proj]) {
      const overZoomValue = getZoomLevel(layer, zoom, proj, sources);
      if (overZoomValue) {
        zotObj[layer.id] = { value: overZoomValue };
      }
    }
  });
  return zotObj;
}

function getZoomLevel(layer, zoom, proj, sources) {
  // Account for offset between the map's top zoom level and the
  // lowest-resolution TileMatrix in polar layers
  var zoomOffset = proj === 'arctic' || proj === 'antarctic' ? 1 : 0;
  var matrixSet = layer.projections[proj].matrixSet;

  if (matrixSet !== undefined && layer.type !== 'vector') {
    var source = layer.projections[proj].source;
    var zoomLimit =
      sources[source].matrixSets[matrixSet].resolutions.length - 1 + zoomOffset;
    if (zoom > zoomLimit) {
      var overZoomValue = Math.round((zoom - zoomLimit) * 100) / 100;
      return overZoomValue;
    }
  }
  return null;
}
