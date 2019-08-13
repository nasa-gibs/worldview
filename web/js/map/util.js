const ZOOM_DURATION = 250;

/*
 * Setting a zoom action
 *
 * @function self.zoomAction
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} amount - Direction and
 *  amount to zoom
 * @param {number} duation - length of animation
 * @param {array} center - point to center zoom
 *
 * @returns {void}
 */
export function mapUtilZoomAction(map, amount, duration, center) {
  var zoomDuration = duration || ZOOM_DURATION;
  var centerPoint = center || undefined;
  var view = map.getView();
  var zoom = view.getZoom();
  view.animate({
    zoom: zoom + amount,
    duration: zoomDuration,
    center: centerPoint
  });
}
export function getActiveLayerGroup(map, layerGroupString) {
  var group = null;
  var array = map.getLayers().getArray();
  for (var i = 0, len = array.length; i < len; i++) {
    const layerGroup = array[i];
    if (layerGroup.get('group') === layerGroupString) {
      group = layerGroup;
      break;
    }
  }
  return group;
}
