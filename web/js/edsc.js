import edscArc from './edsc/arc';
import edscCoordinate from './edsc/coordinate';
import edscGeoUtil from './edsc/geoutil';
import edscInterpolation from './edsc/interpolation';
import edscSphericalPolygon from './edsc/spherical-polygon';
var edsc = {};
edsc.map = {};
edsc.config = null;

var L = {};
edsc.L = L;
L.Polyline = {
  prototype: {}
};

L.Polygon = {
  extend: function () {},
  prototype: {}
};

L.Rectangle = {
  prototype: {}
};

L.LayerGroup = {
  prototype: {}
};

L.FeatureGroup = {
  prototype: {}
};

L.EditToolbar = {
  Delete: {
    prototype: {
      _removeLayer: {}
    }
  }
};

L.Draw = {
  Polygon: {
    extend: function () {}
  }
};

L.Edit = {
  Poly: {
    extend: function () {}
  }
};

L.Util = {
  isArray: function (value) {
    return value.constructor === Array;
  }
};
function LatLng (lat, lng) {
  if (lat.lat) {
    var latlng = lat;
    this.lat = latlng.lat;
    this.lng = latlng.lng;
  } else {
    this.lat = lat;
    this.lng = lng;
  }
}

L.LatLng = LatLng;
L.latLng = function (lat, lng) {
  return new L.LatLng(lat, lng);
};
edsc.Coordinate = edscCoordinate(L);
edsc.Arc = edscArc(L, edsc.Coordinate);
edsc.geoutil = edscGeoUtil(L, edsc.Coordinate, edsc.Arc, edsc.config);
edsc.interpolation = edscInterpolation(L, edsc.geoutil.gcInterpolate);
edsc.L.sphericalPolygon = edscSphericalPolygon(L, edsc.geoutil, edsc.Arc, edsc.Coordinate);

export { L as dataHelper };
