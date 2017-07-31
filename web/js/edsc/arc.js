(function() {
  var ns;

  ns = window.edsc.map;

  ns.Arc = (function(L, Coordinate) {
    var Arc, EPSILON, exports;
    EPSILON = 0.00000001;
    Arc = (function() {
      function Arc(coordA, coordB) {
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

      Arc.prototype.antimeridianCrossing = function() {
        var abs, x, xN, y, yA, yN, z, zN;
        abs = Math.abs;
        if (this.coordA.theta < this.coordB.theta) {
          return null;
        }
        if (abs(Math.PI - abs(this.coordA.theta)) < EPSILON || abs(Math.PI - abs(this.coordB.theta)) < EPSILON) {
          return null;
        }
        if (abs(this.coordA.theta - this.coordB.theta) % Math.PI < EPSILON) {
          return null;
        }
        xN = this.normal.x;
        yN = this.normal.y;
        zN = this.normal.z;
        yA = this.coordA.y;
        if (abs(yA) < EPSILON) {
          yA = this.coordB.y;
        }
        if (abs(yA) < EPSILON) {
          return null;
        }
        if (abs(zN) < EPSILON && abs(xN) < EPSILON) {
          return null;
        }
        x = -zN / yA;
        y = 0;
        z = xN / yA;
        if (x > 0) {
          x = -x;
          z = -z;
        }
        return Coordinate.fromXYZ(x, y, z);
      };

      return Arc;

    })();
    return exports = Arc;
  })(L, ns.Coordinate);

})
.call(this);
