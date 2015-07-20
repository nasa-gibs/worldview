var edsc = {};
edsc.map = {};

var L = {};
edsc.map.L = L;

L.Polyline = {
    prototype: {}
};

L.Polygon = {
    extend: function() {},
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
        extend: function() {}
    }
};

L.Edit = {
    Poly: {
        extend: function() {}
    }
};

L.Util = {
    isArray: function(value) {
        return value.constructor === Array;
    }
};

(function() {

    function LatLng(lat, lng) {
        if ( lat.lat ) {
            var latlng = lat;
            this.lat = latlng.lat;
            this.lng = latlng.lng;
        } else {
            this.lat = lat;
            this.lng = lng;
        }
    };

    L.LatLng = LatLng;
    L.latLng = function(lat, lng) {
        return new L.LatLng(lat, lng);
    };

})();




