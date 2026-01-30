import * as olProj from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import lodashClone from 'lodash/clone';
import { intersects } from 'ol/extent';

export default function mapModel(models, config) {
  const self = {};

  self.extent = null;
  self.selectedMap = null;
  self.ui = null;
  self.rotation = 0;

  const init = function() {
    if (!config.projections) {
      return;
    }

    Object.values(config.projections).forEach((def) => {
      if (def.crs && def.proj4) {
        self.register(def);
      }
    });
  };

  self.register = function(def) {
    if (def && def.proj4) {
      proj4.defs(def.crs, def.proj4);
      register(proj4);
      const olProjInstance = olProj.get(def.crs);
      olProjInstance.setExtent(def.maxExtent);
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
  };

  // Give other components access to zoom Level
  self.updateMap = function(map, ui) {
    self.selectedMap = map;
    self.ui = ui;
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
      const projId = state.p ? state.p : 'geographic';
      const proj = config.projections[projId];
      if (proj) {
        const extent = state.v;
        let { maxExtent } = proj;

        if (proj.id === 'geographic') {
          maxExtent = [-250, -90, 250, 90];
          proj.wrapExtent = maxExtent;
        }
        if (intersects(extent, maxExtent)) {
          self.extent = state.v;
        } else {
          self.extent = lodashClone(proj.maxExtent);
          errors.push({
            message: 'Extent outside of range',
          });
        }
      } else {
        errors.push({
          message: 'Projection does not exist',
        });
      }
    }
    // get rotation if it exists
    if (state.p === 'arctic' || state.p === 'antarctic') {
      // eslint-disable-next-line no-restricted-globals
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
      self.rotation !== 0.0
      && self.rotation !== 0
      && models.proj.selected.id !== 'geographic'
    ) {
      state.r = (self.rotation * (180.0 / Math.PI)).toPrecision(6);
    } // convert from radians to degrees
  };

  init();
  return self;
}
