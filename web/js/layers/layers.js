import loCloneDeep from 'lodash/cloneDeep';
import loEach from 'lodash/each';
import loRemove from 'lodash/remove';

// Permalink versions 1.0 and 1.1
var parse11 = function (state, errors, config) {
  var str = state.products;
  var layers = [];
  var ids = str.split(/[~,\.]/);
  loEach(ids, function (id) {
    if (id === 'baselayers' || id === 'overlays') {
      return;
    }
    var visible = true;
    if (id.startsWith('!')) {
      visible = false;
      id = id.substring(1);
    }
    if (config.redirects && config.redirects.layers) {
      id = config.redirects.layers[id] || id;
    }
    if (!config.layers[id]) {
      errors.push({
        message: 'No such layer: ' + id
      });
      return;
    }
    var lstate = {
      id: id,
      attributes: []
    };
    if (!visible) {
      lstate.attributes.push({
        id: 'hidden',
        value: true
      });
    }
    layers.push(lstate);
  });
  state.l = layers;
};

// Permalink version 1.2
var parse12 = function (state, errors, config) {
  var parts;
  var str = state.l;
  // Split by layer definitions (commas not in parens)
  var layerDefs = str.match(/[^\(,]+(\([^\)]*\))?,?/g);
  var lstates = [];
  loEach(layerDefs, function (layerDef) {
    // Get the text before any paren or comma
    var layerId = layerDef.match(/[^\(,]+/)[0];
    if (config.redirects && config.redirects.layers) {
      layerId = config.redirects.layers[layerId] || layerId;
    }
    var lstate = {
      id: layerId,
      attributes: []
    };
    // Everything inside parens
    var arrayAttr = layerDef.match(/\(.*\)/);
    if (arrayAttr) {
      // Get single match and remove parens
      var strAttr = arrayAttr[0].replace(/[\(\)]/g, '');
      // Key value pairs
      var kvps = strAttr.split(',');
      loEach(kvps, function (kvp) {
        parts = kvp.split('=');
        if (parts.length === 1) {
          lstate.attributes.push({
            id: parts[0],
            value: true
          });
        } else {
          lstate.attributes.push({
            id: parts[0],
            value: parts[1]
          });
        }
      });
    }
    lstates.push(lstate);
  });
  state.l = lstates;
};

export function parse(state, errors, config) {
  if (state.l) {
    parse12(state, errors, config);
  }
  if (state.products) {
    parse11(state, errors, config);
  }
};

export function validate(errors, config) {
  var error = function (layerId, cause) {
    errors.push({
      message: 'Invalid layer: ' + layerId,
      cause: cause,
      layerRemoved: true
    });
    delete config.layers[layerId];
    loRemove(config.layerOrder.baselayers, function (e) {
      return e === layerId;
    });
    loRemove(config.layerOrder.overlays, function (e) {
      return e === layerId;
    });
  };

  var layers = loCloneDeep(config.layers);
  loEach(layers, function (layer) {
    if (!layer.group) {
      error(layer.id, 'No group defined');
      return;
    }
    if (!layer.projections) {
      error(layer.id, 'No projections defined');
    }
  });

  var orders = loCloneDeep(config.layerOrder);
  loEach(orders, function (layerId) {
    if (!config.layers[layerId]) {
      error(layerId, 'No configuration');
    }
  });
};
