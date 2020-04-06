import edscArc from './edsc/arc';
import edscCoordinate from './edsc/coordinate';
import edscGeoUtil from './edsc/geoutil';
import edscInterpolation from './edsc/interpolation';
import edscSphericalPolygon from './edsc/spherical-polygon';

const edsc = {};
edsc.map = {};
edsc.config = null;

const L = {};
edsc.L = L;
L.Polyline = {
  prototype: {},
};

L.Polygon = {
  extend() {},
  prototype: {},
};

L.Rectangle = {
  prototype: {},
};

L.LayerGroup = {
  prototype: {},
};

L.FeatureGroup = {
  prototype: {},
};

L.EditToolbar = {
  Delete: {
    prototype: {
      _removeLayer: {},
    },
  },
};

L.Draw = {
  Polygon: {
    extend() {},
  },
};

L.Edit = {
  Poly: {
    extend() {},
  },
};

L.Util = {
  isArray(value) {
    return value.constructor === Array;
  },
};
function LatLng(lat, lng) {
  if (lat.lat) {
    const latlng = lat;
    this.lat = latlng.lat;
    this.lng = latlng.lng;
  } else {
    this.lat = lat;
    this.lng = lng;
  }
}

L.LatLng = LatLng;
L.latLng = function(lat, lng) {
  return new L.LatLng(lat, lng);
};
edsc.Coordinate = edscCoordinate(L);
edsc.Arc = edscArc(L, edsc.Coordinate);
edsc.geoutil = edscGeoUtil(L, edsc.Coordinate, edsc.Arc, edsc.config);
edsc.interpolation = edscInterpolation(L, edsc.geoutil.gcInterpolate);
edsc.L.sphericalPolygon = edscSphericalPolygon(L, edsc.geoutil, edsc.Arc, edsc.Coordinate);

// eslint-disable-next-line import/prefer-default-export
export { L as dataHelper };
