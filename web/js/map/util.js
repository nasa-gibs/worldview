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
};
