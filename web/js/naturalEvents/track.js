import OlFeature from 'ol/feature';
import OlOverlay from 'ol/overlay';
import OlLayerVector from 'ol/layer/vector';
import OlSourceVector from 'ol/source/vector';
import OlStyleFill from 'ol/style/fill';
import OlStyleStroke from 'ol/style/stroke';
import OlStyleCircle from 'ol/style/circle';
import OlStyleStyle from 'ol/style/style';
import OlGeomMultiLineString from 'ol/geom/multilinestring';
import lodashEach from 'lodash/each';

var naturalEventsTrackLayer = function(featuresArray, styles) {
  return new OlLayerVector({
    source: new OlSourceVector({
      features: featuresArray
    }),
    style: function(feature) {
      return styles[feature.get('type')];
    }

  });
};
var naturalEventsTrackPoint = function(coords, date, eventID, isSelected, callback) {
  var overlayEl = document.createElement('div');
  var circleEl = document.createElement('div');
  var textEl = document.createElement('span');
  var content = document.createTextNode(date);

  overlayEl.className = isSelected ? 'track-marker-case track-marker-case-selected' : 'track-marker-case';
  overlayEl.dataset.id = eventID;
  overlayEl.onclick = function() {
    callback(eventID, date);
  };
  textEl.appendChild(content);
  textEl.className = 'track-marker-date';
  circleEl.className = 'track-marker track-marker-' + date;
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: coords,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false
  });
};

var naturalEventsTrackLine = function(coordinateArray, type) {
  return new OlFeature({
    type: type,
    geometry: new OlGeomMultiLineString(coordinateArray)
  });
};
var naturalEventsTrackStyle = function() {
  return {
    'geoMarker': new OlStyleStyle({
      image: new OlStyleCircle({
        radius: 4,
        snapToPixel: false,
        fill: new OlStyleFill({ color: 'white' }),
        stroke: new OlStyleStroke({
          color: 'white',
          width: 2
        })
      })
    }),
    'white-line': new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: 'white',
        width: 1
      })
    }),
    'black-line': new OlStyleStyle({
      stroke: new OlStyleStroke({
        color: 'black',
        width: 2
      })
    })
  };
};

export function naturalEventsTrackCreate(eventObj, map, selectedDate, callback) {
  var olPointCoordinates = [];
  var coordinateArray = [];
  var eventTrackStyles;
  var olTrackLineFeatures = [];

  lodashEach(eventObj.geometries, function (geometry, index) {
    var date = geometry.date.split('T')[0];
    var coordinates = geometry.coordinates;
    var isSelected = (selectedDate === date);

    olPointCoordinates.push(coordinates);
    if (index !== 0) {
      coordinateArray.push([olPointCoordinates[index - 1], coordinates]);
    }
    map.addOverlay(naturalEventsTrackPoint(coordinates, date, eventObj.id, isSelected, callback));
  });

  eventTrackStyles = naturalEventsTrackStyle();

  olTrackLineFeatures.push(naturalEventsTrackLine(coordinateArray, 'black-line'));
  olTrackLineFeatures.push(naturalEventsTrackLine(coordinateArray, 'white-line'));

  return naturalEventsTrackLayer(olTrackLineFeatures, eventTrackStyles);
};
