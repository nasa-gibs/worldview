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
   *
   * @returns {void}
   */
export function mapUtilZoomAction(map, amount, duration) {
  var zoomDuration = duration || ZOOM_DURATION;
  return function () {
    var view = map.getView();
    var zoom = view.getZoom();
    view.animate({
      zoom: zoom + amount,
      duration: zoomDuration
    });
  };
};
