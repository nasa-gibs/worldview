export default function (L, Coordinate, Arc, config) {
  var DEG_TO_RAD, EPSILON, NORTH_POLE, RAD_TO_DEG, SOUTH_POLE, _angleDelta, _course, _rotationDirection, area, containsPole, gcInterpolate;

  // A small number for dealing with near-0
  EPSILON = 0.00000001;
  NORTH_POLE = 1;
  SOUTH_POLE = 2;
  DEG_TO_RAD = Math.PI / 180;
  RAD_TO_DEG = 180 / Math.PI;

  // Given two points, returns their midpoint along the shortest great circle between them.  The
  // two points may not be antipodal, since such a midpoint would be undefined
  gcInterpolate = function (p1, p2) {
    return (function (abs, asin, sqrt, pow, sin, cos, atan2) {
      var AB, d, lat, lat1, lat2, lon, lon1, lon2, ref, ref1, x, y, z;
      if ((abs(p1.lat) === (ref = abs(p2.lat)) && ref === 90)) {
        return p1;
      }
      if (p2.lng < p1.lng) {
        ref1 = [p2, p1], p1 = ref1[0], p2 = ref1[1];
      }
      lat1 = p1.lat * DEG_TO_RAD;
      lon1 = p1.lng * DEG_TO_RAD;
      lat2 = p2.lat * DEG_TO_RAD;
      lon2 = p2.lng * DEG_TO_RAD;

      // http://williams.best.vwh.net/avform.htm#Dist
      d = 2 * asin(sqrt(pow(sin((lat1 - lat2) / 2), 2) + cos(lat1) * cos(lat2) * pow(sin((lon1 - lon2) / 2), 2)));

      /**
       * http://williams.best.vwh.net/avform.htm#Intermediate
       * This is a special case where f = 1/2 and therefore A = B, allowing us
       * to simplify a few expressions
       */
      AB = sin(d / 2) / sin(d);
      x = AB * (cos(lat1) * cos(lon1) + cos(lat2) * cos(lon2));
      y = AB * (cos(lat1) * sin(lon1) + cos(lat2) * sin(lon2));
      z = AB * (sin(lat1) + sin(lat2));
      lat = RAD_TO_DEG * atan2(z, sqrt(x * x + y * y));
      lon = RAD_TO_DEG * atan2(y, x);
      // Guard against the points being the same or antipodal
      if (isNaN(lat) || isNaN(lon)) {
        return p1;
      }
      while (lon < p1.lng - EPSILON) {
        lon += 360;
      }
      while (lon > p2.lng + EPSILON) {
        lon -= 360;
      }
      return new L.LatLng(lat, lon);
    })(Math.abs, Math.asin, Math.sqrt, Math.pow, Math.sin, Math.cos, Math.atan2);
  };

  // Determines the initial course direction from latlng1 setting off toward latlng2
  _course = function (latlng1, latlng2) {
    var PI, atan2, c1, c2, cos, denom, lat1, lat2, lng1, lng2, numer, result, sin;
    // http://williams.best.vwh.net/avform.htm#Crs
    sin = Math.sin, cos = Math.cos, atan2 = Math.atan2, PI = Math.PI;
    c1 = Coordinate.fromLatLng(latlng1);
    c2 = Coordinate.fromLatLng(latlng1);
    lat1 = latlng1.lat * DEG_TO_RAD;
    lng1 = latlng1.lng * DEG_TO_RAD;
    lat2 = latlng2.lat * DEG_TO_RAD;
    lng2 = latlng2.lng * DEG_TO_RAD;
    if (lat1 > PI / 2 - EPSILON) {
      return PI;
    }
    if (lat1 < -PI / 2 + EPSILON) {
      return 2 * PI;
    }
    numer = sin(lng1 - lng2) * cos(lat2);
    denom = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(lng1 - lng2);
    result = atan2(numer, denom) % (2 * PI);
    if (result < 0) {
      result += 2 * PI;
    }
    return result;
  };

  // Determines the difference between the given angles in the interval (-180, 180)
  // See: http://www.element84.com/determining-if-a-spherical-polygon-contains-a-pole.html
  _angleDelta = function (a1, a2) {
    var left_turn_amount;
    if (a2 < a1) {
      a2 += 360;
    }
    left_turn_amount = a2 - a1;
    if (left_turn_amount === 180) {
      return 0;
    } else if (left_turn_amount > 180) {
      return left_turn_amount - 360;
    } else {
      return left_turn_amount;
    }
  };

  // Returns a positive number if the angles rotate counterclockwise, a negative number
  // if the angles rotate clockwise, or 0 if they do not rotate
  _rotationDirection = function (angles) {
    var a1, a2, delta, i, j, len, ref;
    // Sum all adjacent angle deltas.  The sum gives us the number we need to return
    delta = 0;
    len = angles.length;
    for (i = j = 0, ref = len; ref >= 0 ? j < ref : j > ref; i = ref >= 0 ? ++j : --j) {
      a1 = angles[i];
      a2 = angles[(i + 1) % len];
      delta += _angleDelta(a1, a2);
    }
    if (Math.abs(delta) < EPSILON) {
      delta = 0;
    }
    return delta;
  };

  /**
   * Returns a number indicating which pole(s) the given latlngs cross
   * North Pole: (containsPole(...) & NORTH_POLE) != 0
   * South Pole: (containsPole(...) & SOUTH_POLE) != 0
   * Any Pole: containsPole(...) != 0
   * Neither Pole: containsPole(...) == 0
   */
  containsPole = function (latlngs) {
    var angles, delta, delta0, delta1, dir, final, i, initial, j, latlng, latlng0, latlng1, latlng2, len, prev, ref;
    if (latlngs.length < 3) {
      return false;
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
    // http://www.element84.com/determining-if-a-spherical-polygon-contains-a-pole.html
    delta = 0;
    len = latlngs.length;
    for (i = j = 0, ref = len; ref >= 0 ? j < ref : j > ref; i = ref >= 0 ? ++j : --j) {
      latlng0 = latlngs[(i - 1 + len) % len];
      latlng1 = latlngs[i];
      latlng2 = latlngs[(i + 1) % len];
      prev = (_course(latlng1, latlng0) + Math.PI) % (2 * Math.PI);
      initial = _course(latlng1, latlng2);
      final = (_course(latlng2, latlng1) + Math.PI) % (2 * Math.PI);
      delta0 = initial - prev;
      if (delta0 > Math.PI) {
        delta0 -= 2 * Math.PI;
      }
      if (delta0 < -Math.PI) {
        delta0 += 2 * Math.PI;
      }
      if (Math.abs(Math.PI - Math.abs(delta0)) < EPSILON) {
        delta0 = 0;
      }
      delta1 = final - initial;
      if (delta1 > Math.PI) {
        delta1 -= 2 * Math.PI;
      }
      if (delta1 < -Math.PI) {
        delta1 += 2 * Math.PI;
      }
      if (Math.abs(Math.PI - Math.abs(delta1)) < EPSILON) {
        delta1 = 0;
      }
      delta += delta0 + delta1;
    }
    delta = delta * RAD_TO_DEG;
    if (delta < -360 + EPSILON) {
      return NORTH_POLE | SOUTH_POLE;
    } else if (delta < EPSILON) {
      angles = (function () {
        var k, len1, results;
        results = [];
        for (k = 0, len1 = latlngs.length; k < len1; k++) {
          latlng = latlngs[k];
          results.push(latlng.lng);
        }
        return results;
      })();
      dir = _rotationDirection(angles);
      if (dir > 0) {
        return NORTH_POLE;
      } else if (dir < 0) {
        return SOUTH_POLE;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  };

  // Calculates the area within the given latlngs
  area = function (origLatlngs) {
    var PI, crossesMeridian, i, j, k, latlngA, latlngB, latlngC, latlngs, len, phiB, ref, ref1, sum, thetaA, thetaB, thetaC;
    if (origLatlngs.length < 3) {
      return 0;
    }
    /**
     * This algorithm is an approximation to area.  For some polygons, particularly large and narrow
     * ones, it will produce incorrect results causing us to think they have clockwise points when
     * their points are counterclockwise.
     * The algorithm to deal with this exactly is complex and slow (see PDF below).  For our purposes,
     * we want to eliminate cases that may cause real problems.  Below, we add the midpoint for long
     * arcs to our list of latlngs.  Doing so means we'll see fewer problems but we'll be doing
     * more calculations.
     * If polygons still cause problems, interpolate more :)
     * Example of a problematic polygon before interpolation:
     * http://edsc.dev/search/datasets?polygon=-38.53125%2C37.125%2C-60.75%2C56.109375%2C1.6875%2C0.28125%2C-38.53125%2C37.125&m=15.5390625!10.8984375!2!1!0!
     * Example of a problematic polygon after interpolation:
     * http://edsc.dev/search/datasets?polygon=-38.53125%2C37.125%2C-60.75%2C56.109375%2C-11.390625%2C-4.5%2C-38.53125%2C37.125&m=15.5390625!10.8984375!2!1!0!
     */
    latlngs = [];
    len = origLatlngs.length;
    for (i = j = 0, ref = len; ref >= 0 ? j < ref : j > ref; i = ref >= 0 ? ++j : --j) {
      latlngA = origLatlngs[i];
      latlngB = origLatlngs[(i + 1) % len];
      latlngs.push(latlngA);
      if (Math.abs(latlngA.lat - latlngB.lat) > 20 || Math.abs(latlngA.lng - latlngB.lng) > 20) {
        latlngs.push(gcInterpolate(latlngA, latlngB));
      }
    }
    // http://trs-new.jpl.nasa.gov/dspace/bitstream/2014/40409/3/JPL%20Pub%2007-3%20%20w%20Errata.pdf
    // Page 7
    PI = Math.PI;
    crossesMeridian = false;
    sum = 0;
    len = latlngs.length;
    for (i = k = 0, ref1 = len; ref1 >= 0 ? k < ref1 : k > ref1; i = ref1 >= 0 ? ++k : --k) {
      latlngA = latlngs[i];
      latlngB = latlngs[(i + 1) % len];
      latlngC = latlngs[(i + 2) % len];
      thetaA = latlngA.lng * DEG_TO_RAD;
      thetaB = latlngB.lng * DEG_TO_RAD;
      thetaC = latlngC.lng * DEG_TO_RAD;
      phiB = latlngB.lat * DEG_TO_RAD;
      if (Math.abs(thetaB - thetaA) > PI) {
        crossesMeridian = !crossesMeridian;
        if (thetaB > thetaA) {
          thetaB -= 2 * Math.PI;
        } else {
          thetaB += 2 * Math.PI;
        }
      }
      if (Math.abs(thetaC - thetaB) > PI) {
        crossesMeridian = !crossesMeridian;
        if (thetaC > thetaB) {
          thetaC -= 2 * Math.PI;
        } else {
          thetaC += 2 * Math.PI;
        }
      }
      sum += (thetaC - thetaA) * Math.sin(phiB);
    }
    if (crossesMeridian) {
      sum = 4 * Math.PI + sum;
    }
    area = -sum / 2;
    if (area < 0) {
      area = 4 * Math.PI + area;
    }
    return area;
  };

  return {
    gcInterpolate: gcInterpolate,
    area: area,
    containsPole: containsPole,
    NORTH_POLE: NORTH_POLE,
    SOUTH_POLE: SOUTH_POLE
  };
};
