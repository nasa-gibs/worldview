(function() {
  var ns;

  ns = this.edsc.map.L;

  ns.interpolation = (function(L, gcInterpolate) {
    var exports, interpolateCartesian, interpolateGeodetic, projectLatLngPath, projectLatlngs, projectPath;
    interpolateCartesian = function(ll0, ll1) {
      return L.latLng((ll0.lat + ll1.lat) / 2, (ll0.lng + ll1.lng) / 2);
    };
    interpolateGeodetic = function(ll0, ll1) {
      return gcInterpolate(ll0, ll1);
    };
    projectLatLngPath = function(latLngs, proj, interpolateFn, tolerance, maxDepth) {
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
      if ((Math.abs(latLngs[0].lng) === (ref = Math.abs(latLngs[latLngs.length - 1].lng)) && ref === 180)) {
        latLngs = latLngs.concat(latLngs[latLngs.length - 1]);
      } else {
        latLngs = latLngs.concat(latLngs[0]);
      }
      points = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = latLngs.length; i < len; i++) {
          ll = latLngs[i];
          results.push(proj(ll));
        }
        return results;
      })();
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
        console.log("Max interpolation depth reached.");
      }
      return interpolatedPoints;
    };
    projectPath = function(map, latlngs, holes, fn, tolerance, maxDepth) {
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
      proj = function(ll) {
        var MAX_RES, result;
        MAX_RES = 10000000;
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
        holes: (function() {
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
    projectLatlngs = function() {
      var interpolated;
      interpolated = projectPath(this._map, this._latlngs, this._holes, this._interpolationFn);
      this._originalPoints = interpolated.boundary;
      return this._holePoints = interpolated.holes;
    };
    L.Polyline.prototype.projectLatlngs = projectLatlngs;
    L.Polygon.prototype.projectLatlngs = projectLatlngs;
    L.Polyline.prototype._interpolationFn = interpolateGeodetic;
    L.Rectangle.prototype._interpolationFn = interpolateCartesian;
    return exports = {
      projectPath: projectPath
    };
  })(L, window.edsc.map.geoutil.gcInterpolate);

}).call(this);
