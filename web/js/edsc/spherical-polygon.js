export default function (L, geoutil, Arc, Coordinate) {
  var antimeridianCrossing, convertLatLngs, dividePolygon, ll2j, ll2s, makeCounterclockwise, originalRemove;

  // Converts the given latlngs to L.latLng objects and ensures they're
  // normalized on the expected interval, [-180, 180]
  convertLatLngs = function (latlngs) {
    var j, latlng, len1, original, result;
    result = [];
    for (j = 0, len1 = latlngs.length; j < len1; j++) {
      original = latlngs[j];
      latlng = L.latLng(original);
      while (latlng.lng > 180) {
        latlng.lng -= 360;
      }
      while (latlng.lng < -180) {
        latlng.lng += 360;
      }
      result.push(latlng);
    }
    return result;
  };

  /**
   * Helper which delegates out to Arc to figure out where the great circle
   * arc between latlng0 and latlng1 crosses the antimeridian.  Will either
   * return the point of the crossing or null if the arc does not cross.
   */
  antimeridianCrossing = function (latlng0, latlng1) {
    var arc, ref;
    arc = new Arc(Coordinate.fromLatLng(L.latLng(latlng0)), Coordinate.fromLatLng(L.latLng(latlng1)));
    return (ref = arc.antimeridianCrossing()) != null ? ref.toLatLng() : void 0;
  };

  // Ensures that latlngs is counterclockwise around its smallest area
  // This is an in-place operation modifying the original list.
  makeCounterclockwise = function (latlngs) {
    var area;
    area = geoutil.area(latlngs);
    if (area > 2 * Math.PI) {
      latlngs.reverse();
    }
    return latlngs;
  };

  // For debugging
  // Prints a string of latLng objects
  ll2s = function (latlngs) {
    var ll;
    return ((function () {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = latlngs.length; j < len1; j++) {
        ll = latlngs[j];
        results.push('(' + ll.lat + ', ' + ll.lng + ')');
      }
      return results;
    })()).join(', ');
  };

  // Prints a string of latLng objects to a format useful in Jason's visualization
  // tools: http://testbed.echo.nasa.gov/spatial-viz/interactive_spherical_polygon_coverage
  ll2j = function (latlngs) {
    var ll;
    return ((function () {
      var j, len1, ref, results;
      ref = latlngs.concat(latlngs[0]);
      results = [];
      for (j = 0, len1 = ref.length; j < len1; j++) {
        ll = ref[j];
        results.push(ll.lng + ',' + ll.lat);
      }
      return results;
    })()).join(', ');
  };

  /**
   * Given a list of latlngs constituting a polygon, returns an object:
   * {interiors: [...], boundaries: [...]}
   *
   * When the interiors are drawn as filled un-stroked leaflet polygons and the
   * boundaries are drawn as leaflet strokes (polylines), the displayed area
   * is equivalent to how ECHO interprets the original latlngs.
   *
   * This is where all the magic happens.
   *
   * Problem:
   * There are two ways to interpret the "interior" of a polygon on a globe, because a
   * polygon divides the globe into two parts.  In ECHO, a list of points in a polygon
   * proceeds counterclockwise around its interior.  Leaflet, on the other hand, ignores
   * the problem entirely; the interior is whatever svg happens to draw for a set of
   * projected points, which may or may not be completely different if you switch map
   * projections.
   *
   * This method takes an ECHO polygon, normalizes its points, slices it along the meridian,
   * and adds points for the poles to ensure that Leaflet renders the ECHO interpretation
   * of the polygon in all projections.
   *
   * It is, necessarily, a hack.
   */
  dividePolygon = function (latlngs) {
    var boundaries, boundary, containedPoles, containsNorthPole, containsSouthPole, crossing, extra, extras, hasInsertions, hasPole, hole, holes, i, inc, interior, interiors, j, k, l, lat, latlng, latlng1, latlng2, len, len1, len2, len3, lng, m, maxCrossingLat, minCrossingLat, n, next, o, p, q, ref, ref1, split;
    interiors = [];
    boundaries = [];
    holes = [];
    // Handle a list containing holes
    if (latlngs && L.Util.isArray(latlngs[0]) && typeof latlngs[0][0] !== 'number') {
      ref = latlngs.slice(1);
      for (j = 0, len1 = ref.length; j < len1; j++) {
        hole = ref[j];
        hole = convertLatLngs(hole);
        denormalizePath(hole);
        holes.push(hole);
      }
      latlngs = latlngs[0];
    }
    // Ensure we're dealing with normalized L.LatLng objects
    latlngs = convertLatLngs(latlngs);
    // Ensure the exterior points are counterclockwise around their smallest area
    latlngs = makeCounterclockwise(latlngs);
    // We will have to add points to accommodate the poles later
    containedPoles = geoutil.containsPole(latlngs);
    containsNorthPole = (containedPoles & geoutil.NORTH_POLE) !== 0;
    containsSouthPole = (containedPoles & geoutil.SOUTH_POLE) !== 0;
    // The maximum and minimum latitudes we cross the antimeridian
    maxCrossingLat = -95;
    minCrossingLat = 95;
    /**
     * Eventually we're going to want to split the polygon into multiple
     * sub-polygons across the antimerdian.  So, a square crossing the
     * antimeridian would have a tall rectangle in the eastern hemisphere
     * and a tall rectangle in the western hemisphere, which individually
     * can be drawn correctly by Leaflet.
     *
     * The following loop iterates across the original polygon.  Anywhere
     * the polygon crosses the antimeridian, we ensure there two points,
     * one at [crossing_lat, -180] and the other at [crossing_lon, 180]
     */
    split = [];
    len = latlngs.length;
    for (i = k = 0, ref1 = len; ref1 >= 0 ? k < ref1 : k > ref1; i = ref1 >= 0 ? ++k : --k) {
      latlng1 = latlngs[i];
      latlng2 = latlngs[(i + 1) % len];
      crossing = antimeridianCrossing(latlng1, latlng2);
      split.push(latlng1);
      extras = [];
      if (crossing != null) {
        lat = crossing.lat;
        if (latlng1.lng < latlng2.lng) {
          extras = [[lat, -180], [lat, 180]];
        } else {
          extras = [[lat, 180], [lat, -180]];
        }
      } else if (latlng1.lng === 180 && latlng2.lng < 0) {
        extras = [[latlng1.lat, -180]];
      } else if (latlng1.lng === -180 && latlng2.lng > 0) {
        extras = [[latlng1.lat, 180]];
      } else if (latlng2.lng === 180 && latlng1.lng < 0) {
        extras = [[latlng2.lat, -180]];
      } else if (latlng2.lng === -180 && latlng1.lng > 0) {
        extras = [[latlng2.lat, 180]];
      }
      for (l = 0, len2 = extras.length; l < len2; l++) {
        extra = extras[l];
        lat = extra[0], lng = extra[1];
        split.push(L.latLng(lat, lng));
        maxCrossingLat = Math.max(lat, maxCrossingLat);
        minCrossingLat = Math.min(lat, minCrossingLat);
      }
    }
    // Did we insert anything?
    hasInsertions = latlngs.length < split.length;
    interior = [];
    boundary = [];
    if (hasInsertions) {
      // Rearrange the split array so that its beginning and end contain separate polygons
      if (Math.abs(split[0].lng) !== 180 || Math.abs(split[split.length - 1].lng) !== 180) {
        while (Math.abs(split[0].lng) !== 180) {
          split.push(split.shift());
        }
        split.push(split.shift());
      }
    }
    // We now take the expanded array created by inserting points at the antimeridian and
    // use it to create boundary and interior polygons
    for (i = m = 0, len3 = split.length; m < len3; i = ++m) {
      latlng = split[i];
      interior.push(latlng);
      boundary.push(latlng);
      next = split[(i + 1) % split.length];
      // If we're at the antimeridian
      if (interior.length > 2 && Math.abs(latlng.lng) === 180 && Math.abs(next.lng) === 180) {
        // We've reached the end of our current boundary
        boundaries.push(boundary);
        boundary = [];
        /**
         * If we contain the North pole, then we insert points at the northernmost
         * antimeridian crossing which run along the top of the map in the default
         * projection. and join it to its corresponding point on the other side
         * of the map, ensuring that the pole will be filled-in.
         */
        hasPole = false;
        if (containsNorthPole && latlng.lat === maxCrossingLat) {
          hasPole = true;
          lng = latlng.lng;
          // We need a few points along the top of the map or polar projections screw up
          inc = lng < 0 ? 90 : -90;
          for (i = n = 0; n <= 4; i = ++n) {
            interior.push(L.latLng(90, lng + i * inc));
          }
        }
        // Similarly for the South Pole
        if (containsSouthPole && latlng.lat === minCrossingLat) {
          hasPole = true;
          lng = latlng.lng;
          inc = lng < 0 ? 90 : -90;
          for (i = o = 0; o <= 4; i = ++o) {
            interior.push(L.latLng(-90, lng + i * inc));
          }
        }
        /**
         * If we joined the east and west side of the polygon by going across the pole
         * above, we want to keep adding to our current interior shape.  Otherwise,
         * we're stopping the interior at the antimeridian and adding it to our list.
         */
        if (!hasPole) {
          interiors.push(interior);
          interior = [];
        }
      }
    }
    // Close any remaining boundaries or interiors
    if (boundary.length > 0) {
      boundaries.push(boundary);
    }
    if (interior.length > 0) {
      interiors.push(interior);
    }
    // Special case: If we contain both poles but do not have an edge crossing the meridian
    // as dealt with above, reverse our drawing.
    if (containsNorthPole && containsSouthPole && !hasInsertions) {
      interior = [];
      for (i = p = 0; p <= 4; i = ++p) {
        interior.push(L.latLng(90, -180 + i * 90));
      }
      for (i = q = 0; q <= 4; i = ++q) {
        interior.push(L.latLng(-90, 180 - i * 90));
      }
      interiors.unshift(interior);
    }
    return {
      interiors: interiors,
      boundaries: boundaries
    };
  };

  // This is a bit tricky. We need to be an instanceof L.Polygon for L.Draw methods
  // to work, but in reality we're an L.FeatureGroup, hence the "includes"
  L.SphericalPolygon = L.Polygon.extend({
    includes: [L.LayerGroup.prototype, L.FeatureGroup.prototype],
    options: {
      fill: true
    },
    initialize: function (latlngs, options) {
      this._layers = {};
      this._options = L.extend({}, this.options, options);
      return this.setLatLngs(latlngs);
    },
    setLatLngs: function (latlngs) {
      var divided, latlng;
      if (latlngs[0] && Array.isArray(latlngs[0]) && latlngs[0].length > 2) {
        // Don't deal with holes
        if (console.warn) {
          console.warn('Polygon with hole detected.  Ignoring.');
        }
        latlngs = latlngs[0];
      }
      latlngs = (function () {
        var j, len1, results;
        results = [];
        for (j = 0, len1 = latlngs.length; j < len1; j++) {
          latlng = latlngs[j];
          results.push(L.latLng(latlng));
        }
        return results;
      })();
      this._latlngs = latlngs;
      divided = dividePolygon(latlngs);
      if (this._boundaries) {
        this._interiors.setLatLngs(divided.interiors);
        return this._boundaries.setLatLngs(divided.boundaries);
      } else {
        this._interiors = L.polygon(divided.interiors, L.extend({}, this._options, {
          stroke: false
        }));
        this._boundaries = L.multiPolyline(divided.boundaries, L.extend({}, this._options, {
          fill: false
        }));
        this.addLayer(this._interiors);
        return this.addLayer(this._boundaries);
      }
    },
    getLatLngs: function () {
      return makeCounterclockwise(this._latlngs.concat());
    },
    newLatLngIntersects: function (latlng, skipFirst) {
      return false;
    },
    setOptions: function (options) {
      this._options = this.options = L.extend({}, this._options, options);
      L.setOptions(this._interiors, L.extend({}, this._options, {
        stroke: false
      }));
      L.setOptions(this._boundaries, L.extend({}, this._options, {
        fill: false
      }));
      return this.redraw();
    },
    setStyle: function (style) {
      if (this.options.previousOptions) {
        this.options.previousOptions = this._options;
      }
      this._interiors.setStyle(L.extend({}, style, {
        stroke: false
      }));
      return this._boundaries.setStyle(L.extend({}, style, {
        fill: false
      }));
    },
    redraw: function () {
      return this.setLatLngs(this._latlngs);
    }
  });

  L.sphericalPolygon = function (latlngs, options) {
    return new L.SphericalPolygon(latlngs, options);
  };

  // Monkey-patch _removeLayer.  The original doesn't handle event propagation
  // from FeatureGroups, and SphericalPolygons are FeatureGroups
  originalRemove = L.EditToolbar.Delete.prototype._removeLayer;
  L.EditToolbar.Delete.prototype._removeLayer = function (e) {
    var ref;
    if ((ref = e.target) != null ? ref._boundaries : void 0) {
      e.layer = e.target;
    }
    return originalRemove.call(this, e);
  };

  L.Draw.Polygon = L.Draw.Polygon.extend({
    Poly: L.SphericalPolygon,
    addHooks: function () {
      L.Draw.Polyline.prototype.addHooks.call(this);
      if (this._map) {
        return this._poly = new L.SphericalPolygon([], this.options.shapeOptions);
      }
    }
  });

  L.Edit.Poly = L.Edit.Poly.extend({
    _getMiddleLatLng: function (marker1, marker2) {
      var latlng;
      return latlng = geoutil.gcInterpolate(marker1.getLatLng(), marker2.getLatLng());
    }
  });

  return {
    dividePolygon: dividePolygon
  };
};
