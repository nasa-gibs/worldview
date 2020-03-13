import * as olExtent from 'ol/extent';
import OlGeomLineString from 'ol/geom/LineString';
import Promise from 'bluebird';

export function mapAnimate(config, ui, store) {
  const self = {};

  /**
   * Moves the map with a "flying" animation
   *
   * @param  {Array} endPoint  Ending coordinates
   * @param  {integer} endZoom Ending Zoom Level
   * @return {Promise}         Promise that is fulfilled when animation completes
   */
  self.fly = function(endPoint, endZoom, rotation) {
    const state = store.getState();
    const view = ui.map.selected.getView();
    const polarProjectionCheck = state.proj.selected.id !== 'geographic'; // boolean if current projection is polar
    view.cancelAnimations();
    const startPoint = view.getCenter();
    const startZoom = Math.floor(view.getZoom());
    endZoom = endZoom || 5;
    if (endPoint.length > 2) endPoint = olExtent.getCenter(endPoint);
    const extent = view.calculateExtent();
    const hasEndInView = olExtent.containsCoordinate(extent, endPoint);
    const line = new OlGeomLineString([startPoint, endPoint]);
    const distance = line.getLength(); // In map units, which is usually degrees
    const distanceDuration = polarProjectionCheck ? distance / 50000 : distance; // limit large polar projection distances from coordinate transforms
    let duration = Math.floor(distanceDuration * 20 + 1000); // approx 6 seconds to go 360 degrees
    if (!rotation) rotation = 0;
    const animationPromise = function(...args) {
      return new Promise((resolve, reject) => {
        args.push((complete) => {
          if (complete) resolve();
          if (!complete) reject(new Error('Animation interrupted!'));
        });
        view.animate(...args);
      }).catch(() => {});
    };
    if (hasEndInView) {
      // allow faster fly with nearby events
      duration = duration < 1200 ? duration / 2 : duration;
      // If the event is already visible, don't zoom out
      return Promise.all([
        animationPromise({
          center: endPoint,
          duration,
          rotation,
        }),
        animationPromise({
          zoom: endZoom,
          duration,
          rotation,
        }),
      ]);
    }
    // Default animation zooms out to arc
    return Promise.all([
      animationPromise({
        center: endPoint,
        duration,
        rotation,
      }),
      animationPromise(
        {
          zoom: getBestZoom(distance, startZoom, endZoom, view),
          duration: duration / 2,
          rotation,
        },
        { zoom: endZoom, duration: duration / 2, rotation },
      ),
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
  const getBestZoom = function(distance, start, end, view) {
    const idealLength = 1500;
    const lines = [2, 3, 4, 5, 6, 7, 8].map((zoom) => ({
      zoom,
      pixels: distance / view.getResolutionForZoom(zoom),
    }));
    const bestFit = lines.sort((a, b) => Math.abs(idealLength - a.pixels) - Math.abs(idealLength - b.pixels))[0];
    return Math.max(2, Math.min(bestFit.zoom, start - 1, end - 1));
  };
  return self;
}
