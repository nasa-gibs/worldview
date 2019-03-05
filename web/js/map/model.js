import util from '../util/util';
import * as olProj from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import lodashClone from 'lodash/clone';
import { intersects } from 'ol/extent';

export function mapModel(models, config) {
  var self = {};

  self.extent = null;
  self.selectedMap = null;
  self.events = util.events();
  self.rotation = 0;
  const init = function() {
    if (!config.projections) {
      return;
    }

    Object.values(config.projections).forEach(proj => {
      if (proj.crs && proj.proj4) {
        self.register(proj.crs, proj.proj4);
      }
    });
  };
  self.register = function(crs, def) {
    if (def && proj4) {
      proj4.defs(crs, def);
      register(proj4);
      olProj.get(crs).setExtent(def.maxExtent);
    }
  };
  /*
   * Emits update event
   *
   * @method update
   * @static
   *
   * @param extent {object} Map Extent Array
   *
   * @returns {void}
   */
  self.update = function(extent) {
    self.extent = extent;
    self.events.trigger('update', extent);
  };
  // Give other components access to zoom Level
  self.updateMap = function(map) {
    self.selectedMap = map;
    self.events.trigger('update-map');
  };
  self.getZoom = function() {
    return self.selectedMap ? self.selectedMap.getView().getZoom() : null;
  };
  /*
   * Sets map view from parsed URL
   *
   * @method load
   * @static
   *
   * @param state {object} map state object from permalink
   *
   * @param errors {string} errors
   *
   * @returns {void}
   */
  self.load = function(state, errors) {
    if (state.v) {
      var proj = models.proj.selected;
      var extent = state.v;
      var maxExtent = proj.maxExtent;

      if (proj.id === 'geographic') {
        proj.wrapExtent = maxExtent = [-250, -90, 250, 90];
      }
      if (intersects(extent, maxExtent)) {
        self.extent = state.v;
      } else {
        self.extent = lodashClone(proj.maxExtent);
        errors.push({
          message: 'Extent outside of range'
        });
      }
    }
    // get rotation if it exists
    if (state.p === 'arctic' || state.p === 'antarctic') {
      if (!isNaN(state.r)) {
        self.rotation = state.r * (Math.PI / 180.0);
      } // convert to radians
    }
    self.loaded = true;
    return self;
  };

  /*
   * Saves extent and rotation When
   * models.link.toQueryString() is called
   *
   * @method save
   * @static
   *
   * @param state {object} map state object from permalink
   *
   *
   * @returns {void}
   */
  self.save = function(state) {
    state.v = lodashClone(self.extent);
    if (
      self.rotation !== 0.0 &&
      self.rotation !== 0 &&
      models.proj.selected.id !== 'geographic'
    ) {
      state.r = (self.rotation * (180.0 / Math.PI)).toPrecision(6);
    } // convert from radians to degrees
  };

  /*
   * Set default extent according to time of day:
   *
   * at 00:00 UTC, start at far eastern edge of
   * map: "20.6015625,-46.546875,179.9296875,53.015625"
   *
   * at 23:00 UTC, start at far western edge of map:
   * "-179.9296875,-46.546875,-20.6015625,53.015625"
   *
   * @method getLeadingExtent
   * @static
   *
   *
   * @returns {object} Extent Array
   */
  self.getLeadingExtent = function() {
    var curHour = util.now().getUTCHours();

    // For earlier hours when data is still being filled in, force a far eastern perspective
    if (curHour < 3) {
      curHour = 23;
    } else if (curHour < 9) {
      curHour = 0;
    }

    // Compute east/west bounds
    var minLon = 20.6015625 + curHour * (-200.53125 / 23.0);
    var maxLon = minLon + 159.328125;

    var minLat = -46.546875;
    var maxLat = 53.015625;

    return [minLon, minLat, maxLon, maxLat];
  };
  init();
  return self;
}
