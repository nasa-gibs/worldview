import lodashEach from 'lodash/each';

export function addZoomLevel(config, models, ui, layer, zoomObj) {
  var newObj = zoomObj;
  var sources = config.sources;
  var proj = models.proj.selected.id;
  var zoom = ui.map.selected.getView().getZoom();
  var overZoomValue = getZoomLevel(layer, zoom, proj, sources);

  if (overZoomValue) {
    newObj[layer.id] = { value: overZoomValue };
  }
  return newObj;
}
export function getZoomLevel(layer, zoom, proj, sources) {
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
export function getZotsForActiveLayers(config, models, ui) {
  var zotObj = {};
  var sources = config.sources;
  var proj = models.proj.selected.id;
  var layerGroupStr = models.layers.activeLayers;
  var layers = models.layers[layerGroupStr];
  var zoom = ui.map.selected.getView().getZoom();

  lodashEach(layers, layer => {
    if (layer.projections[proj]) {
      let overZoomValue = getZoomLevel(layer, zoom, proj, sources);
      if (overZoomValue) {
        zotObj[layer.id] = { value: overZoomValue };
      }
    }
  });
  return zotObj;
}
