ns = window.edsc.map

ns.Coordinate = do(L) ->
  DEG_TO_RAD = Math.PI / 180
  RAD_TO_DEG = 180 / Math.PI

  # Class for dealing with conversions between lat/lng, phi/theta, and x/y/z as well
  # as operations on the various forms.
  # Consider properties on this class to be immutable.  Changing, say, 'x' will not
  # update `phi` or `theta` and will throw normalization out of whack.
  class Coordinate
    @fromLatLng: (args...) ->
      if args.length == 1
        {lat, lng} = args[0]
      else
        [lat, lng] = args
      Coordinate.fromPhiTheta(lat * DEG_TO_RAD, lng * DEG_TO_RAD)

    @fromPhiTheta: (phi, theta) ->
      PI = Math.PI
      cos = Math.cos
      sin = Math.sin

      # Normalize phi to the interval [-PI / 2, PI / 2]
      phi -= 2 * PI while phi >= PI
      phi += 2 * PI while phi < PI

      if phi > PI / 2
        phi = PI - phi
        theta += PI
      if phi < -PI / 2
        phi = - PI  - phi
        theta += PI

      theta -= 2 * PI while theta >= PI
      theta += 2 * PI while theta < -PI

      x = cos(phi) * cos(theta)
      y = cos(phi) * sin(theta)
      z = sin(phi)

      new Coordinate(phi, theta, x, y, z)

    # +X axis passes through the (anti-)meridian at the equator
    # +Y axis passes through 90 degrees longitude at the equator
    # +Z axis passes through the north pole
    @fromXYZ: (x, y, z) ->
      d = x*x + y*y + z*z
      d = x = 1 if d == 0 # Should never happen, but stay safe

      # We normalize so that x, y, and z fall on a unit sphere
      scale = 1 / Math.sqrt(d)
      x *= scale
      y *= scale
      z *= scale

      theta = Math.atan2(y, x)
      phi = Math.asin(z)

      new Coordinate(phi, theta, x, y, z)

    constructor: (@phi, @theta, @x, @y, @z) ->

    # Dot product
    dot: (other) ->
      @x * other.x + @y * other.y + @z * other.z

    # Normalized cross product
    cross: (other) ->
      x = @y * other.z - @z * other.y
      y = @z * other.x - @x * other.z
      z = @x * other.y - @y * other.x
      Coordinate.fromXYZ(x, y, z)

    # Distance to other coordinate on a unit sphere.  Same as the angle between the two points at the origin.
    distanceTo: (other) ->
      Math.acos(@dot(other))

    toLatLng: ->
      new L.LatLng(RAD_TO_DEG * @phi, RAD_TO_DEG * @theta)

    toString: ->
      latlng = @toLatLng()
      "(#{latlng.lat.toFixed(3)}, #{latlng.lng.toFixed(3)})"

    toXYZString: ->
      "<#{@x.toFixed(3)}, #{@y.toFixed(3)}, #{@z.toFixed(3)}>"

  exports = Coordinate
