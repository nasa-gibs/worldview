export default function (L, Coordinate) {
  var Arc, EPSILON;
  // A small number for dealing with near-0
  EPSILON = 0.00000001;

  // Method for dealing with operations on great circle arcs
  Arc = (function () {
    function Arc (coordA, coordB) {
      var ref;
      if (coordB.theta < coordA.theta) {
        ref = [coordA, coordB], coordB = ref[0], coordA = ref[1];
      }
      if (coordB.theta - coordA.theta > Math.PI) {
        this.coordB = coordA;
        this.coordA = coordB;
      } else {
        this.coordA = coordA;
        this.coordB = coordB;
      }
      this.normal = this.coordA.cross(this.coordB);
    }

    Arc.prototype.antimeridianCrossing = function () {
      var abs, x, xN, y, yA, yN, z, zN;
      abs = Math.abs;

      // Doesn't cross the meridian
      if (this.coordA.theta < this.coordB.theta) {
        return null;
      }
      // On the meridian
      if (abs(Math.PI - abs(this.coordA.theta)) < EPSILON || abs(Math.PI - abs(this.coordB.theta)) < EPSILON) {
        return null;
      }
      // On a longitude line
      if (abs(this.coordA.theta - this.coordB.theta) % Math.PI < EPSILON) {
        return null;
      }
      xN = this.normal.x;
      yN = this.normal.y;
      zN = this.normal.z;

      /**
       * We have two vectors and a normal vector.  We need to find a third
       * vector which passes through the (anti-)meridian (y = 0) and whose
       * normal vector with either @coordA or @coordB is @normal (or at least
       * points in the same direction).
       *
       * xN = yA * z - zA * y
       * yN = zA * x - xA * z
       * zN = xA * y - yA * x
       *
       * x = - zN / yA
       * y = 0
       * z = xN / yA
       *
       * We need to be careful of two things here.  First, yA cannot be 0,
       * in other words our chosen arc endpoint cannot itself be on the meridian
       */
      yA = this.coordA.y;
      if (abs(yA) < EPSILON) {
        yA = this.coordB.y;
      }

      // If they're both on the meridian, bail
      if (abs(yA) < EPSILON) {
        return null;
      }

      // Second, the normal directions zN and xN cannot both be 0.  This happens
      // when the arc follows the meridian, so in theory this case should never occur.
      if (abs(zN) < EPSILON && abs(xN) < EPSILON) {
        return null;
      }
      x = -zN / yA;
      y = 0;
      z = xN / yA;

      // Finally, we need <x, y, z> to point in the direction of the anti-meridian
      if (x > 0) {
        x = -x;
        z = -z;
      }
      return Coordinate.fromXYZ(x, y, z);
    };

    return Arc;
  })();
  return Arc;
}
