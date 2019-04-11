import {
  cloneDeep as lodashCloneDeep,
  get as lodashGet,
  findIndex as lodashFindIndex,
  each as lodashEach
} from 'lodash';

import update from 'immutability-helper';
import util from '../../util/util';

export function getLayersParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const initialState = lodashCloneDeep(models.layers.active);
  console.log(legacyState);
  models.palettes.load(legacyState, errors);
  if (models.compare.active) {
    models.layers.activeB = lodashCloneDeep(initialState);
  }
  const layerModelLoaded = models.layers.load(legacyState, errors);

  return {
    l: getPermalinkManagementObject(
      initialState,
      'layers.active',
      () => {
        return layerModelLoaded.active ? layerModelLoaded.active : initialState;
      },
      (currentItemState, state) => {
        const isActive = lodashGet(state, 'compare.active');
        const isCompareA = lodashGet(state, 'compare.isActiveA');
        return !isActive && !isCompareA
          ? serializeLayers(state, 'activeB')
          : serializeLayers(state, 'active');
      }
    ),
    l1: getPermalinkManagementObject(
      initialState,
      'layers.activeB',
      () => {
        return layerModelLoaded.activeB;
      },
      (currentItemState, state) => {
        const isActive = lodashGet(state, 'compare.active');
        return isActive ? serializeLayers(state, 'activeB') : undefined;
      }
    )
  };
}
export function serializeLayers(state, groupName) {
  const layers = state.layers[groupName];
  const palettes = state.palettes[groupName];
  return layers.map((def, i) => {
    var item = {};

    if (def.id) {
      item = {
        id: def.id
      };
    }
    if (!item.attributes) {
      item.attributes = [];
    }
    if (!def.visible) {
      item.attributes.push({
        id: 'hidden'
      });
    }
    if (def.opacity < 1) {
      item.attributes.push({
        id: 'opacity',
        value: def.opacity
      });
    }
    let paletteDef = def.id && palettes[def.id] ? palettes[def.id] : undefined;
    if (paletteDef) {
      if (paletteDef.custom) {
        item.attributes.push({
          id: 'palette',
          value: paletteDef.custom
        });
      }
      if (paletteDef.min) {
        var minValue = paletteDef.entries.values[paletteDef.min];
        item.attributes.push({
          id: 'min',
          value: minValue
        });
      }
      if (paletteDef.max) {
        var maxValue = paletteDef.entries.values[paletteDef.max];
        item.attributes.push({
          id: 'max',
          value: maxValue
        });
      }
      if (paletteDef.squash) {
        item.attributes.push({
          id: 'squash'
        });
      }
    }
    return util.appendAttributesForURL(item);
  });
}

function getPermalinkManagementObject(
  initialState,
  stateKey,
  parser,
  serialize
) {
  return {
    stateKey: stateKey,
    initialState: initialState,
    type: 'array',
    options: {
      delimiter: ',',
      serializeNeedsGlobalState: true,
      parse: parser,
      serialize: serialize
    }
  };
}
export function toggleVisibility(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  var visibility = !layers[index].visible;

  return update(layers, { [index]: { visible: { $set: visibility } } });
}
export function removeLayer(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  return update(layers, { $splice: [[index, 1]] });
}
// this function takes an array of date ranges in this format:
// [{ layer.period, dateRanges.startDate: Date, dateRanges.endDate: Date, dateRanges.dateInterval: Number}]
// the array is first sorted, and then checked for any overlap
export function dateOverlap(period, dateRanges) {
  var sortedRanges = dateRanges.sort((previous, current) => {
    // get the start date from previous and current
    var previousTime = util.parseDate(previous.startDate);
    previousTime = previousTime.getTime();
    var currentTime = util.parseDate(current.startDate);
    currentTime = currentTime.getTime();

    // if the previous is earlier than the current
    if (previousTime < currentTime) {
      return -1;
    }

    // if the previous time is the same as the current time
    if (previousTime === currentTime) {
      return 0;
    }

    // if the previous time is later than the current time
    return 1;
  });

  var result = sortedRanges.reduce(
    (result, current, idx, arr) => {
      // get the previous range
      if (idx === 0) {
        return result;
      }
      var previous = arr[idx - 1];

      // check for any overlap
      var previousEnd = util.parseDate(previous.endDate);
      // Add dateInterval
      if (previous.dateInterval > 1 && period === 'daily') {
        previousEnd = new Date(
          previousEnd.setTime(
            previousEnd.getTime() +
              (previous.dateInterval * 86400000 - 86400000)
          )
        );
      }
      if (period === 'monthly') {
        previousEnd = new Date(
          previousEnd.setMonth(
            previousEnd.getMonth() + (previous.dateInterval - 1)
          )
        );
      } else if (period === 'yearly') {
        previousEnd = new Date(
          previousEnd.setFullYear(
            previousEnd.getFullYear() + (previous.dateInterval - 1)
          )
        );
      }
      previousEnd = previousEnd.getTime();

      var currentStart = util.parseDate(current.startDate);
      currentStart = currentStart.getTime();

      var overlap = previousEnd >= currentStart;
      // store the result
      if (overlap) {
        // yes, there is overlap
        result.overlap = true;
        // store the specific ranges that overlap
        result.ranges.push({
          previous: previous,
          current: current
        });
      }

      return result;
    },
    {
      overlap: false,
      ranges: []
    }
  );

  // return the final results
  return result;
}
var useLookup = function(layerId, groupStr) {
  var use = false;
  var active = self[groupStr][layerId].maps;

  lodashEach(active, function(palette, index) {
    if (palette.custom) {
      use = true;
      return false;
    }
    var rendered = self.getRenderedPalette(layerId, index);
    if (palette.type !== 'classification') {
      if (palette.min <= 0) {
        delete palette.min;
      }
      if (palette.max >= rendered.entries.values.length) {
        delete palette.max;
      }
      if (!lodashIsUndefined(palette.min) || !lodashIsUndefined(palette.max)) {
        use = true;
        return false;
      }
    }
  });
  return use;
};
