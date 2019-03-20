import {
  each as lodashEach,
  get as lodashGet,
  filter as lodashFilter,
  find as lodashFind,
  cloneDeep as lodashCloneDeep,
  isUndefined as lodashIsUndefined
} from 'lodash';

import util from '../../util/util';

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

export function addLayer(id, spec, layers, config) {
  if (
    lodashFind(layers, {
      id: id
    })
  ) {
    return layers;
  }
  spec = spec || {};
  var def = lodashCloneDeep(config.layers[id]);
  if (!def) {
    throw new Error('No such layer: ' + id);
  }
  def.visible = true;
  if (!lodashIsUndefined(spec.visible)) {
    def.visible = spec.visible;
  } else if (!lodashIsUndefined(spec.hidden)) {
    def.visible = !spec.hidden;
  }
  def.opacity = lodashIsUndefined(spec.opacity) ? 1.0 : spec.opacity;
  if (def.group === 'overlays') {
    layers.unshift(def);
  } else {
    layers.splice(layers, 0, def);
  }
  return layers;
}
export function resetLayers(config) {
  let layers = [];
  const startingLayers = lodashGet(config, 'defaults.startingLayers');
  if (startingLayers) {
    lodashEach(startingLayers, function(start) {
      layers = addLayer(start.id, start, layers, config);
    });
  }
  return layers;
}
export function getTitles(config, layerId, proj, state) {
  try {
    proj = proj || state.proj.id;
    var title, subtitle, tags;
    const forProj = lodashGet(config, `layers.${layerId}.projections.${proj}`);
    if (forProj) {
      title = forProj.title;
      subtitle = forProj.subtitle;
      tags = forProj.tags;
    }
    const forLayer = lodashGet(config, `layers.${layerId}`);
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
export function getLayers(layers, spec, state) {
  spec = spec || {};
  var baselayers = forGroup('baselayers', spec, layers, state);
  var overlays = forGroup('overlays', spec, layers, state);
  if (spec.group === 'baselayers') {
    return baselayers;
  }
  if (spec.group === 'overlays') {
    return overlays;
  }
  if (spec.group === 'all') {
    return {
      baselayers: baselayers,
      overlays: overlays
    };
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
    if (spec.renderable && !self.isRenderable(def.id, activeLayers)) {
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
export function available(id, date, layers, config) {
  var range = dateRange(
    {
      layer: id
    },
    layers,
    config
  );

  if (range) {
    if (date < range.start || date > range.end) {
      return false;
    }
  }
  return true;
}
export function replaceSubGroup(layerId, nextLayerId, layers, subGroup) {
  if (nextLayerId) {
    return moveBefore(layerId, nextLayerId, layers);
  } else {
    return pushToBottom(layerId, layers);
  }
}
function dateRange(spec, activeLayers, config) {
  var layers = spec.layer
    ? [
      lodashFind(activeLayers, {
        id: spec.layer
      })
    ]
    : activeLayers;
  var ignoreRange =
    config.parameters &&
    (config.parameters.debugGIBS || config.parameters.ignoreDateRange);
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
        max = util.now().getTime();
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
        max = util.now().getTime();
        maxDates.push(new Date(max));
      }
    }
  });
  if (range) {
    if (max === 0) {
      max = util.now().getTime();
      maxDates.push(max);
    }
    var maxDate = Math.max.apply(max, maxDates);
    return {
      start: new Date(min),
      end: new Date(maxDate)
    };
  }
}
function pushToBottom(id, activeLayersString) {
  // activeLayersString = activeLayersString || self.activeLayers;
  // var oldIndex = lodashFindIndex(self[activeLayersString], {
  //   id: id
  // });
  // if (oldIndex < 0) {
  //   throw new Error('Layer is not active: ' + id);
  // }
  // var def = self[activeLayersString][oldIndex];
  // self[activeLayersString].splice(oldIndex, 1);
  // if (def.group === 'baselayers') {
  //   self[activeLayersString].push(def);
  // } else {
  //   self[activeLayersString].splice(split[activeLayersString] - 1, 0, def);
  // }
}

function moveBefore(sourceId, targetId, activeLayersString) {
  // activeLayersString = activeLayersString || self.activeLayers;
  // var sourceIndex = lodashFindIndex(self[activeLayersString], {
  //   id: sourceId
  // });
  // if (sourceIndex < 0) {
  //   throw new Error('Layer is not active: ' + sourceId);
  // }
  // var sourceDef = self[activeLayersString][sourceIndex];
  // var targetIndex = lodashFindIndex(self[activeLayersString], {
  //   id: targetId
  // });
  // if (targetIndex < 0) {
  //   throw new Error('Layer is not active: ' + targetId);
  // }
  // self[activeLayersString].splice(targetIndex, 0, sourceDef);
  // if (sourceIndex > targetIndex) {
  //   sourceIndex++;
  // }
  // self[activeLayersString].splice(sourceIndex, 1);
  // self.events.trigger('update', sourceDef, targetIndex);
  // self.events.trigger('change');
}
export function getZotsForActiveLayers(config, models, ui) {
  // var zotObj = {};
  // var sources = config.sources;
  // var proj = models.proj.selected.id;
  // var layerGroupStr = models.layers.activeLayers;
  // var layers = models.layers[layerGroupStr];
  // var zoom = ui.map.selected.getView().getZoom();
  // lodashEach(layers, layer => {
  //   if (layer.projections[proj]) {
  //     let overZoomValue = getZoomLevel(layer, zoom, proj, sources);
  //     if (overZoomValue) {
  //       zotObj[layer.id] = { value: overZoomValue };
  //     }
  //   }
  // });
  // return zotObj;
}
