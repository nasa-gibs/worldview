import olExtent from 'ol/extent';
import OlGeomLineString from 'ol/geom/linestring';
export function mapAnimate(models, config, ui) {
  var self = {};

  /**
   * Moves the map with a "flying" animation
   *
   * @param  {Array} endPoint  Ending coordinates
   * @param  {integer} endZoom Ending Zoom Level
   * @return {Promise}         Promise that is fulfilled when animation completes
   */
  self.fly = function (endPoint, endZoom) {
    var view = ui.map.selected.getView();
    view.cancelAnimations();
    var startPoint = view.getCenter();
    var startZoom = Math.floor(view.getZoom());
    endZoom = endZoom || 5;
    if (endPoint.length > 2) endPoint = olExtent.getCenter(endPoint);
    var extent = view.calculateExtent();
    var hasEndInView = olExtent.containsCoordinate(extent, endPoint);
    var line = new OlGeomLineString([startPoint, endPoint]);
    var distance = line.getLength(); // In map units, which is usually degrees
    var duration = (distance * 20) + 1000; // 4.6 seconds to go 360 degrees
    var animationPromise = function () {
      var args = Array.prototype.slice.call(arguments);
      return new Promise(function (resolve, reject) {
        args.push(function (complete) {
          if (complete) resolve();
          if (!complete) reject(new Error('Animation interrupted!'));
        });
        view.animate.apply(view, args);
      }).catch(function () {});
    };
    if (hasEndInView) {
      // If the event is already visible, don't zoom out
      return Promise.all([
        animationPromise({ center: endPoint, duration: duration }),
        animationPromise({ zoom: endZoom, duration: duration })
      ]);
    }
    // Default animation zooms out to arc
    return Promise.all([
      animationPromise({ center: endPoint, duration: duration }),
      animationPromise(
        { zoom: getBestZoom(distance, startZoom, endZoom, view), duration: duration / 2 },
        { zoom: endZoom, duration: duration / 2 }
      )
    ]);
  };

  /**
   * Gets the best zoom level for the middle of the flight animation
   *
   * @param  {integer} distance distance of the animation in map units
   * @param  {integer} start    starting zoom level
   * @param  {integer} end      ending zoom level
   * @param  {object} view     map view
   * @return {integer}          best zoom level for flight animation
   */
  var getBestZoom = function (distance, start, end, view) {
    var idealLength = 1500;
    var lines = [2, 3, 4, 5, 6, 7, 8].map(function (zoom) {
      return {
        zoom: zoom,
        pixels: distance / view.getResolutionForZoom(zoom)
      };
    });
    var bestFit = lines.sort(function (a, b) {
      return Math.abs(idealLength - a.pixels) - Math.abs(idealLength - b.pixels);
    })[0];
    return Math.max(2, Math.min(bestFit.zoom, start - 1, end - 1));
  };
  return self;
};
