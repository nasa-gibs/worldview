export default function(L) {
  var slice, Coordinate, DEG_TO_RAD, RAD_TO_DEG;

  slice = [].slice;
  DEG_TO_RAD = Math.PI / 180;
  RAD_TO_DEG = 180 / Math.PI;

  /**
   * Method for dealing with conversions between lat/lng, phi/theta, and x/y/z as well
   * as operations on the various forms.
   * Consider properties on this class to be immutable.  Changing, say, 'x' will not
   * update `phi` or `theta` and will throw normalization out of whack.
   */
  Coordinate = (function () {
    Coordinate.fromLatLng = function () {
      var args, lat, lng, ref;
      args = arguments.length >= 1 ? slice.call(arguments, 0) : [];
      if (args.length === 1) {
        ref = args[0], lat = ref.lat, lng = ref.lng;
      } else {
        lat = args[0], lng = args[1];
      }
      return Coordinate.fromPhiTheta(lat * DEG_TO_RAD, lng * DEG_TO_RAD);
    };

    Coordinate.fromPhiTheta = function (phi, theta) {
      var PI, cos, sin, x, y, z;
      PI = Math.PI;
      cos = Math.cos;
      sin = Math.sin;

      // Normalize phi to the interval [-PI / 2, PI / 2]
      while (phi >= PI) {
        phi -= 2 * PI;
      }
      while (phi < PI) {
        phi += 2 * PI;
      }
      if (phi > PI / 2) {
        phi = PI - phi;
        theta += PI;
      }
      if (phi < -PI / 2) {
        phi = -PI - phi;
        theta += PI;
      }
      while (theta >= PI) {
        theta -= 2 * PI;
      }
      while (theta < -PI) {
        theta += 2 * PI;
      }
      x = cos(phi) * cos(theta);
      y = cos(phi) * sin(theta);
      z = sin(phi);
      return new Coordinate(phi, theta, x, y, z);
    };

    /**
     * +X axis passes through the (anti-)meridian at the equator
     * +Y axis passes through 90 degrees longitude at the equator
     * +Z axis passes through the north pole
     */
    Coordinate.fromXYZ = function (x, y, z) {
      var d, phi, scale, theta;
      d = x * x + y * y + z * z;
      if (d === 0) { // Should never happen, but stay safe
        d = x = 1;
      }
      // We normalize so that x, y, and z fall on a unit sphere
      scale = 1 / Math.sqrt(d);
      x *= scale;
      y *= scale;
      z *= scale;
      theta = Math.atan2(y, x);
      phi = Math.asin(z);
      return new Coordinate(phi, theta, x, y, z);
    };

    function Coordinate (phi1, theta1, x1, y1, z1) {
      this.phi = phi1;
      this.theta = theta1;
      this.x = x1;
      this.y = y1;
      this.z = z1;
    }

    // Dot product
    Coordinate.prototype.dot = function (other) {
      return this.x * other.x + this.y * other.y + this.z * other.z;
    };

    // Normalized cross product
    Coordinate.prototype.cross = function (other) {
      var x, y, z;
      x = this.y * other.z - this.z * other.y;
      y = this.z * other.x - this.x * other.z;
      z = this.x * other.y - this.y * other.x;
      return Coordinate.fromXYZ(x, y, z);
    };

    // Distance to other coordinate on a unit sphere.  Same as the angle between the two points at the origin.
    Coordinate.prototype.distanceTo = function (other) {
      return Math.acos(this.dot(other));
    };

    Coordinate.prototype.toLatLng = function () {
      return new L.LatLng(RAD_TO_DEG * this.phi, RAD_TO_DEG * this.theta);
    };

    Coordinate.prototype.toString = function () {
      var latlng;
      latlng = this.toLatLng();
      return '(' + (latlng.lat.toFixed(3)) + ', ' + (latlng.lng.toFixed(3)) + ')';
    };

    Coordinate.prototype.toXYZString = function () {
      return '<' + (this.x.toFixed(3)) + ', ' + (this.y.toFixed(3)) + ', ' + (this.z.toFixed(3)) + '>';
    };

    return Coordinate;
  })();
  return Coordinate;
};
