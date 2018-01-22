/**
 * This module extends L.Polyline and subclasses (Rectangle, Polygon) to
 * interpolate their vertices before drawing them.  The result is that,
 * for instance, a bounding rectangle drawn in a polar projection will
 * have a curved shape despite only having 4 vertices.
 */

export default function (L, gcInterpolate) {
  var interpolateCartesian, interpolateGeodetic, projectLatLngPath, projectLatlngs, projectPath;

  interpolateCartesian = function (ll0, ll1) {
    return L.latLng((ll0.lat + ll1.lat) / 2, (ll0.lng + ll1.lng) / 2);
  };

  // Geodetic interpolation.  Finds great circle path between the given points.
  // See geoutil.gcInterpolate
  interpolateGeodetic = function (ll0, ll1) {
    return gcInterpolate(ll0, ll1);
  };

  // Given a path defined by latLngs, a projection defined by proj, and an interpolation
  // function that takes two pionts and returns their midpoint, finds a set of projected
  // (x, y) points defining the path between the points in the given projection
  projectLatLngPath = function (latLngs, proj, interpolateFn, tolerance, maxDepth) {
    var d, depth, depth0, depth1, interpolatedLatLngs, interpolatedPoints, ll, ll0, ll1, maxDepthReached, p, p0, p1, points, ref;
    if (tolerance == null) {
      tolerance = 1;
    }
    if (maxDepth == null) {
      maxDepth = 10;
    }
    if (latLngs.length === 0) {
      return [];
    }
    // Clone path and set its last element to its first so we can interpolate the last segment
    if ((Math.abs(latLngs[0].lng) === (ref = Math.abs(latLngs[latLngs.length - 1].lng)) && ref === 180)) {
      // In this case the last element is an artificial longitude crossing.  Avoid interpolating
      // with the first to prevent drawing strokes along the dateline
      latLngs = latLngs.concat(latLngs[latLngs.length - 1]);
    } else {
      latLngs = latLngs.concat(latLngs[0]);
    }
    points = (function () {
      var i, len, results;
      results = [];
      for (i = 0, len = latLngs.length; i < len; i++) {
        ll = latLngs[i];
        results.push(proj(ll));
      }
      return results;
    })();
    // for ll in latLngs
    //  if Math.abs(ll.lat) == 90
    //    console.log ll.toString(), '->', proj(ll).toString()
    interpolatedLatLngs = [latLngs.shift()];
    interpolatedPoints = [points.shift()];
    depth0 = 0;
    depth1 = 0;
    maxDepthReached = false;
    while (latLngs.length > 0) {
      ll0 = interpolatedLatLngs[interpolatedLatLngs.length - 1];
      p0 = interpolatedPoints[interpolatedPoints.length - 1];
      ll1 = latLngs[0];
      p1 = points[0];
      ll = interpolateFn(ll0, ll1);
      p = proj(ll);
      depth = Math.max(depth0, depth1) + 1;

      // if depth == 1
      //  console.log '0:', ll0.toString(), '->', p0.toString()
      //  console.log 'M:', ll.toString(), '->', p.toString()
      //  console.log '1:', ll1.toString(), '->', p1.toString()

      d = L.LineUtil.pointToSegmentDistance(p, p0, p1);
      if (d < tolerance || depth >= maxDepth) {
        if (depth >= maxDepth) {
          maxDepthReached = true;
        }
        interpolatedLatLngs.push(ll, latLngs.shift());
        interpolatedPoints.push(p, points.shift());
        depth0 = depth1;
        depth1 = Math.max(0, depth1 - 2);
      } else {
        latLngs.unshift(ll);
        points.unshift(p);
        depth1 += 1;
      }
    }
    if (maxDepthReached && config.debug) {
      console.log('Max interpolation depth reached.');
    }
    return interpolatedPoints;
  };

  projectPath = function (map, latlngs, holes, fn, tolerance, maxDepth) {
    var hole, proj, result;
    if (holes == null) {
      holes = [];
    }
    if (fn == null) {
      fn = 'geodetic';
    }
    if (tolerance == null) {
      tolerance = 1;
    }
    if (maxDepth == null) {
      maxDepth = 10;
    }
    if (fn === 'geodetic') {
      fn = interpolateGeodetic;
    }
    if (fn === 'cartesian') {
      fn = interpolateCartesian;
    }
    proj = function (ll) {
      // Avoid weird precision problems near infinity by clamping to a high min/max pixel value
      var MAX_RES, result;
      MAX_RES = 10000000;
      // Fix problems where 90 degrees projects to NaN in our south polar projection
      if (ll.lat === 90) {
        ll = L.latLng(89.999, ll.lng);
      }
      result = map.latLngToLayerPoint.call(map, ll);
      result.x = Math.max(Math.min(result.x, MAX_RES), -MAX_RES);
      result.y = Math.max(Math.min(result.y, MAX_RES), -MAX_RES);
      return result;
    };
    return result = {
      boundary: projectLatLngPath(latlngs, proj, fn, tolerance, maxDepth),
      holes: (function () {
        var i, len, ref, results;
        ref = holes != null ? holes : [];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          hole = ref[i];
          results.push(projectLatLngPath(hole, proj, fn, tolerance, maxDepth));
        }
        return results;
      })()
    };
  };

  // Overrides the default projectLatLngs in Polyline and Polygon to project and interpolate the
  // path instead of just projecting it
  projectLatlngs = function () {
    var interpolated;
    interpolated = projectPath(this._map, this._latlngs, this._holes, this._interpolationFn);
    this._originalPoints = interpolated.boundary;
    return this._holePoints = interpolated.holes;
  };

  // Override methods
  L.Polyline.prototype.projectLatlngs = projectLatlngs;
  L.Polygon.prototype.projectLatlngs = projectLatlngs;

  // Give shapes an appropriate interpolation function.  Polygons use geodetic, rectangles cartesian
  L.Polyline.prototype._interpolationFn = interpolateGeodetic;
  L.Rectangle.prototype._interpolationFn = interpolateCartesian;
  return {
    projectPath: projectPath
  };
};
