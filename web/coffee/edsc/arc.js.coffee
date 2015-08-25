ns = window.edsc.map

ns.Arc = do(L, Coordinate = ns.Coordinate) ->
  # A small number for dealing with near-0
  EPSILON = 0.00000001

  # Class for dealing with operations on great circle arcs
  class Arc
    constructor: (coordA, coordB) ->
      if coordB.theta < coordA.theta
        [coordB, coordA] = [coordA, coordB]

      if coordB.theta - coordA.theta > Math.PI
        @coordB = coordA
        @coordA = coordB
      else
        @coordA = coordA
        @coordB = coordB
      @normal = @coordA.cross(@coordB)

    antimeridianCrossing: ->
      abs = Math.abs

      # Doesn't cross the meridian
      return null if @coordA.theta < @coordB.theta

      # On the meridian
      return null if abs(Math.PI - abs(@coordA.theta)) < EPSILON || abs(Math.PI - abs(@coordB.theta)) < EPSILON

      # On a longitude line
      return null if abs(@coordA.theta - @coordB.theta) % Math.PI < EPSILON

      xN = @normal.x
      yN = @normal.y
      zN = @normal.z

      # We have two vectors and a normal vector.  We need to find a third
      # vector which passes through the (anti-)meridian (y = 0) and whose
      # normal vector with either @coordA or @coordB is @normal (or at least
      # points in the same direction).
      #
      # xN = yA * z - zA * y
      # yN = zA * x - xA * z
      # zN = xA * y - yA * x
      #
      # x = - zN / yA
      # y = 0
      # z = xN / yA

      # We need to be careful of two things here.  First, yA cannot be 0,
      # in other words our chosen arc endpoint cannot itself be on the meridian

      yA = @coordA.y
      yA = @coordB.y if abs(yA) < EPSILON

      # If they're both on the meridian, bail
      return null if abs(yA) < EPSILON

      # Second, the normal directions zN and xN cannot both be 0.  This happens
      # when the arc follows the meridian, so in theory this case should never
      # occur.

      return null if abs(zN) < EPSILON && abs(xN) < EPSILON

      x = -zN / yA
      y = 0
      z = xN / yA

      # Finally, we need <x, y, z> to point in the direction of the anti-meridian

      if x > 0
        x = -x
        z = -z

      Coordinate.fromXYZ(x, y, z)

  exports = Arc
