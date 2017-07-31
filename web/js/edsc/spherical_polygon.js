(function() {
  var ns;

  ns = edsc.map;

  ns.L.sphericalPolygon = (function(L, geoutil, Arc, Coordinate) {
    var antimeridianCrossing, convertLatLngs, dividePolygon, exports, ll2j, ll2s, makeCounterclockwise, originalRemove;
    convertLatLngs = function(latlngs) {
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
    antimeridianCrossing = function(latlng0, latlng1) {
      var arc, ref;
      arc = new Arc(Coordinate.fromLatLng(L.latLng(latlng0)), Coordinate.fromLatLng(L.latLng(latlng1)));
      return (ref = arc.antimeridianCrossing()) != null ? ref.toLatLng() : void 0;
    };
    makeCounterclockwise = function(latlngs) {
      var area;
      area = geoutil.area(latlngs);
      if (area > 2 * Math.PI) {
        latlngs.reverse();
      }
      return latlngs;
    };
    ll2s = function(latlngs) {
      var ll;
      return ((function() {
          var j, len1, results;
          results = [];
          for (j = 0, len1 = latlngs.length; j < len1; j++) {
            ll = latlngs[j];
            results.push("(" + ll.lat + ", " + ll.lng + ")");
          }
          return results;
        })())
        .join(', ');
    };
    ll2j = function(latlngs) {
      var ll;
      return ((function() {
          var j, len1, ref, results;
          ref = latlngs.concat(latlngs[0]);
          results = [];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            ll = ref[j];
            results.push(ll.lng + "," + ll.lat);
          }
          return results;
        })())
        .join(', ');
    };
    dividePolygon = function(latlngs) {
      var boundaries, boundary, containedPoles, containsNorthPole, containsSouthPole, crossing, extra, extras, hasInsertions, hasPole, hole, holes, i, inc, interior, interiors, j, k, l, lat, latlng, latlng1, latlng2, len, len1, len2, len3, lng, m, maxCrossingLat, minCrossingLat, n, next, o, p, q, ref, ref1, split;
      interiors = [];
      boundaries = [];
      holes = [];
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
      latlngs = convertLatLngs(latlngs);
      latlngs = makeCounterclockwise(latlngs);
      containedPoles = geoutil.containsPole(latlngs);
      containsNorthPole = (containedPoles & geoutil.NORTH_POLE) !== 0;
      containsSouthPole = (containedPoles & geoutil.SOUTH_POLE) !== 0;
      maxCrossingLat = -95;
      minCrossingLat = 95;
      split = [];
      len = latlngs.length;
      for (i = k = 0, ref1 = len; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
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
      hasInsertions = latlngs.length < split.length;
      interior = [];
      boundary = [];
      if (hasInsertions) {
        if (Math.abs(split[0].lng) !== 180 || Math.abs(split[split.length - 1].lng) !== 180) {
          while (Math.abs(split[0].lng) !== 180) {
            split.push(split.shift());
          }
          split.push(split.shift());
        }
      }
      for (i = m = 0, len3 = split.length; m < len3; i = ++m) {
        latlng = split[i];
        interior.push(latlng);
        boundary.push(latlng);
        next = split[(i + 1) % split.length];
        if (interior.length > 2 && Math.abs(latlng.lng) === 180 && Math.abs(next.lng) === 180) {
          boundaries.push(boundary);
          boundary = [];
          hasPole = false;
          if (containsNorthPole && latlng.lat === maxCrossingLat) {
            hasPole = true;
            lng = latlng.lng;
            inc = lng < 0 ? 90 : -90;
            for (i = n = 0; n <= 4; i = ++n) {
              interior.push(L.latLng(90, lng + i * inc));
            }
          }
          if (containsSouthPole && latlng.lat === minCrossingLat) {
            hasPole = true;
            lng = latlng.lng;
            inc = lng < 0 ? 90 : -90;
            for (i = o = 0; o <= 4; i = ++o) {
              interior.push(L.latLng(-90, lng + i * inc));
            }
          }
          if (!hasPole) {
            interiors.push(interior);
            interior = [];
          }
        }
      }
      if (boundary.length > 0) {
        boundaries.push(boundary);
      }
      if (interior.length > 0) {
        interiors.push(interior);
      }
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
    L.SphericalPolygon = L.Polygon.extend({
      includes: [L.LayerGroup.prototype, L.FeatureGroup.prototype],
      options: {
        fill: true
      },
      initialize: function(latlngs, options) {
        this._layers = {};
        this._options = L.extend({}, this.options, options);
        return this.setLatLngs(latlngs);
      },
      setLatLngs: function(latlngs) {
        var divided, latlng;
        if (latlngs[0] && Array.isArray(latlngs[0]) && latlngs[0].length > 2) {
          if (console.warn) {
            console.warn("Polygon with hole detected.  Ignoring.");
          }
          latlngs = latlngs[0];
        }
        latlngs = (function() {
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
      getLatLngs: function() {
        return makeCounterclockwise(this._latlngs.concat());
      },
      newLatLngIntersects: function(latlng, skipFirst) {
        return false;
      },
      setOptions: function(options) {
        this._options = this.options = L.extend({}, this._options, options);
        L.setOptions(this._interiors, L.extend({}, this._options, {
          stroke: false
        }));
        L.setOptions(this._boundaries, L.extend({}, this._options, {
          fill: false
        }));
        return this.redraw();
      },
      setStyle: function(style) {
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
      redraw: function() {
        return this.setLatLngs(this._latlngs);
      }
    });
    L.sphericalPolygon = function(latlngs, options) {
      return new L.SphericalPolygon(latlngs, options);
    };
    originalRemove = L.EditToolbar.Delete.prototype._removeLayer;
    L.EditToolbar.Delete.prototype._removeLayer = function(e) {
      var ref;
      if ((ref = e.target) != null ? ref._boundaries : void 0) {
        e.layer = e.target;
      }
      return originalRemove.call(this, e);
    };
    L.Draw.Polygon = L.Draw.Polygon.extend({
      Poly: L.SphericalPolygon,
      addHooks: function() {
        L.Draw.Polyline.prototype.addHooks.call(this);
        if (this._map) {
          return this._poly = new L.SphericalPolygon([], this.options.shapeOptions);
        }
      }
    });
    L.Edit.Poly = L.Edit.Poly.extend({
      _getMiddleLatLng: function(marker1, marker2) {
        var latlng;
        return latlng = geoutil.gcInterpolate(marker1.getLatLng(), marker2.getLatLng());
      }
    });
    return exports = {
      dividePolygon: dividePolygon
    };
  })(L, ns.geoutil, ns.Arc, ns.Coordinate);

})
.call(this);
