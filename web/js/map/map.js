import lodashMap from 'lodash/map';
import lodashEach from 'lodash/each';
import lodashIsUndefined from 'lodash/isUndefined';
import lodashFind from 'lodash/find';
import OlGeomPolygon from 'ol/geom/Polygon';

export const CRS_WGS_84 = 'EPSG:4326';

export const CRS_WGS_84_QUERY_EXTENT = [-180, -60, 180, 60];

/*
 * Checks to see if an extents string is found. If it exist
 * then it is changed from a string to an array which is then
 * made a global object.
 *
 * @method parse
 * @static
 *
 * @param {string} extents string
 *
 * @param {obj} Error
 *
 * @returns {void}
 *
 * @todo would benefit by returning the array instead of attaching it to a global var
 */
export function mapParser(state, errors) {
  // 1.1 support
  if (state.map) {
    state.v = state.map;
    delete state.map;
  }
  if (state.v) {
    const extent = lodashMap(state.v.split(','), (str) => parseFloat(str));
    const valid = mapIsExtentValid(extent);
    if (!valid) {
      errors.push({
        message: `Invalid extent: ${state.v}`,
      });
      delete state.v;
    } else {
      state.v = extent;
    }
  }
}

/**
 * Determines if an exent object contains valid values.
 *
 * @method isExtentValid
 * @static
 *
 * @param extent {OpenLayers.Bound} The extent to check.
 *
 * @return {boolean} False if any of the values is NaN, otherwise returns
 * true.
 */
export function mapIsExtentValid(extent) {
  if (lodashIsUndefined(extent)) {
    return false;
  }
  let valid = true;
  if (extent.toArray) {
    extent = extent.toArray();
  }
  lodashEach(extent, (value) => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(value)) {
      valid = false;
      return false;
    }
  });
  return valid;
}

/**
 * Sets the opacity of a layer. Since the backbuffer can interfere with
 * tile layers that have transparency, the transition effect is set to
 * none if the opacity is not equal to one.
 *
 * @method setOpacity
 * @static
 *
 * @param layer {OpenLayers.Layer} The layer to set the opacity
 * @param opacity {float} A value from 0 (transparent) to 1 (opaque).
 */
export function setOpacity(layer, opacity) {
  layer.setOpacity(opacity);
  if (opacity === 1) {
    const effect = layer.originalTransitionEffect || 'resize';
    layer.transitionEffect = effect;
  } else {
    layer.originalTransitionEffect = layer.transitionEffect;
    layer.transitionEffect = 'none';
  }
}

/**
 * Sets the visibility of a layer. If the layer is supposed to be not
 * visible, this actually sets the opacity to zero. This allows the
 * quick transition effects between days.
 *
 * @method setVisibility
 * @static
 *
 * @param layer {OpenLayers.Layer} The layer to set the visibility.
 *
 * @param visible {boolean} True if the layer should be visible, otherwise
 * false.
 *
 * @param opacity {float} The opacity that this layer should be if it
 * is visible. A value from 0 (transparent) to 1 (opaque).
 */
export function setVisibility(layer, visible, opacity) {
  if (layer.isControl) {
    layer.setVisibility(visible);
  } else {
    const actualOpacity = visible ? opacity : 0;
    layer.div.style.opacity = actualOpacity;
    if (visible && opacity > 0 && !layer.getVisibility()) {
      layer.setVisibility(true);
    }
  }
}

/**
 * Gets the layer object by the name
 *
 * @method getLayerByName
 * @static
 *
 * @param map {object} open layer map object
 *
 * @param name {string} name of layer object to return
 *
 * @return {obj} Layer object
 *
 */
export function getLayerByName(map, name) {
  const layers = map.getLayers()
    .getArray();
  return lodashFind(layers, {
    wvname: name,
  });
}

/**
 * Checks if a polygon's coordinate length is within a set distance
 *
 * @method isPolygonValid
 * @static
 *
 * @param polygon {object} Geometry of a polygon
 *
 * @param maxDistance {number} max length of a polygon
 *
 * @return {boolean}
 *
 * @todo relocate this utility function
 *
 */
export function mapIsPolygonValid(polygon, maxDistance) {
  const outerRing = polygon.getLinearRing(0);
  const points = outerRing.getCoordinates();
  for (let i = 0; i < points.length - 1; i += 1) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (Math.abs(p2[0] - p1[0]) > maxDistance) {
      return false;
    }
  }
  return true;
}

/**
 * Switches the x coordinate values of Polygon
 * exterior linestring to in the right coordinate value.
 *  -- Reason --
 * when the coordinate of the linestring
 * crosses the antimeridian(180 degrees away from the
 * prime meridian), the value of x  goes from 180 to
 * -180. It needs to be 181.
 *
 * @method adjustAntiMeridian
 * @static
 *
 * @param polygon {object} GeoJSON poylgon geometry Object
 *
 * @param adjustSign {number} a value of 1 or -1
 *
 * @return {obj} Adjusted GeoJSON poylgon geometry Object
 *
 * @todo relocate this utility function
 */
export function mapAdjustAntiMeridian(polygon, adjustSign) {
  const outerRing = polygon.getLinearRing(0);
  const points = outerRing.getCoordinates()
    .slice();

  for (let i = 0; i < points.length; i += 1) {
    if (adjustSign > 0 && points[i][0] < 0) {
      points[i] = [points[i][0] + 360, points[i][1]];
    }
    if (adjustSign < 0 && points[i][0] > 0) {
      points[i] = [points[i][0] - 360, points[i][1]];
    }
  }
  return new OlGeomPolygon([points]);
}

/**
 * Gets distance between two (x,y) points
 *
 * @method distance2D
 * @static
 *
 * @param p1 {number} First Point
 *
 * @param p2 {number} second point
 *
 * @return {number} length of distance
 *
 * @todo relocate this utility function
 *
 */
export function mapDistance2D(p1, p2) {
  // eslint-disable-next-line no-restricted-properties
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

/**
 * Gets distance between two values on the same axis
 *
 * @method distanceX
 * @static
 *
 * @param p1 {number} First Point
 *
 * @param p1 {number} Second Point
 *
 * @return {number} distance between value one
 *
 * @todo relocate this utility function
 *
 */
export function mapDistanceX(p1, p2) {
  return Math.abs(p2 - p1);
}

/**
 * Gets distance between two values on the same axis
 *
 * @method distanceX
 * @static
 *
 * @param p1 {number} First Point
 *
 * @param p1 {number} Second Point
 *
 * @return {number} distance between value one
 *
 * @todo relocate this utility function
 *
 */
export function mapInterpolate2D(p1, p2, amount) {
  const distX = p2[0] - p1[0];
  const distY = p2[1] - p1[1];

  const interpX = p1[0] + (distX * amount);
  const interpY = p1[1] + (distY * amount);

  return [interpX, interpY];
}

/**
 * If the geometry has a multipolygon list. This method returns
 * a single multipolygon list object
 *
 * @method toPolys
 * @static
 *
 * @param geom {object} GeoJSON geometry Object
 *
 * @return {object} GeoJSON multipolygon list object
 *
 * @todo relocate this utility function
 *
 */
export function mapToPolys(geom) {
  if (geom.getPolygons) {
    return geom.getPolygons();
  }
  return [geom];
}
