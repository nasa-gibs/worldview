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
import {
  naturalEventsPointToGeoJSON,
  naturalEventsGetClusterPoints,
  naturalEventsCalculateRange} from './cluster';

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
var naturalEventsTrackPoint = function(clusterPoint, callback) {
  var overlayEl = document.createElement('div');
  var circleEl = document.createElement('div');
  var textEl = document.createElement('span');
  var properties = clusterPoint.properties;
  var content = document.createTextNode(properties.date);
  var date = properties.date;
  var eventID = properties.id;
  var isSelected = false;

  overlayEl.className = isSelected ? 'track-marker-case track-marker-case-selected' : 'track-marker-case';
  overlayEl.dataset.id = eventID;
  overlayEl.id = 'track-marker-case' + date;
  overlayEl.onclick = function() {
    callback(eventID, date);
  };
  textEl.appendChild(content);
  textEl.className = 'track-marker-date';
  circleEl.className = 'track-marker track-marker-' + date;
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: clusterPoint.geometry.coordinates,
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
var removeTrack = function(map, trackObj) {
  map.removeLayer(trackObj.track);
  naturalEventsRemoveOldPoints(map, trackObj.pointArray);
  return {};
};
var naturalEventsRemoveOldPoints = function (map, pointOverlayArray) {
  lodashEach(pointOverlayArray, function (pointOverlay) {
    map.removeOverlay(pointOverlay);
  });
};
var naturalUpdateActiveTrack = function (newDate) {
  var oldSelectedPoint = document.getElementsByClassName('track-marker-case-selected')[0];
  var newSelectedPoint = document.getElementById('track-marker-case' + newDate);
  oldSelectedPoint.className = 'track-marker-case';
  newSelectedPoint.className = 'track-marker-case track-marker-case-selected';
};
var addClusterPoints = function(clusters, map, callback) {
  var points = [];
  var trackArray = [];
  lodashEach(clusters, function(clusterPoint, index) {
    let point;
    if (index !== 0) {
      trackArray.push([clusters[index - 1].geometry.coordinates, clusterPoint.geometry.coordinates]);
    }
    if (clusterPoint.properties.cluster) {
      point = getClusterPointEl(clusterPoint, '12-13-18 - 12-16-18', callback);
      points.push(point);
    } else {
      point = naturalEventsTrackPoint(clusterPoint, callback);
      points.push(point);
    }
    map.addOverlay(point);
  });
  return trackArray;
};

function getClusterPointEl(cluster, date, callback) {
  var overlayEl = document.createElement('div');
  var circleEl = document.createElement('div');
  var textEl = document.createElement('span');
  var content = document.createTextNode(date);
  var properties = cluster.properties;
  var eventID = properties.cluster_id;
  var numberEl = document.createTextNode(properties.point_count_abbreviated);
  var isSelected = false;

  overlayEl.className = isSelected ? 'track-marker-case track-marker-case-selected' : 'track-marker-case';
  overlayEl.dataset.id = eventID;
  overlayEl.id = 'cluster-track-marker-case track-marker-case';

  textEl.appendChild(content);
  textEl.className = 'cluster-track-marker-date track-marker-date';
  circleEl.className = 'track-marker track-marker';
  circleEl.appendChild(numberEl);
  circleEl.onmouseover = () => {
    naturalEventsCalculateRange(eventID);
    console.log('yolo')
  };
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: cluster.geometry.coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false
  });
};

var naturalEventsTrackCreate = function (eventObj, map, selectedDate, callback) {
  var olPointCoordinates = [];
  var coordinateArray = [];
  var eventTrackStyles;
  var olTrackLineFeatures = [];
  var overlayArray = [];
  var geoJSONPoints = [];
  var clusters;

  lodashEach(eventObj.geometries, function (geometry, index) {
    var date = geometry.date.split('T')[0];
    var coordinates = geometry.coordinates;
    var isSelected = (selectedDate === date);
    var trackPoint;

    olPointCoordinates.push(coordinates);
    if (index !== 0) {
      coordinateArray.push([olPointCoordinates[index - 1], coordinates]);
    }
    geoJSONPoints.push(naturalEventsPointToGeoJSON(eventObj.id, coordinates, date));
    //trackPoint = naturalEventsTrackPoint(coordinates, date, eventObj.id, isSelected, callback);
    overlayArray.push(trackPoint);
  });
  console.log(geoJSONPoints, map.getView().getZoom())
  clusters = naturalEventsGetClusterPoints(geoJSONPoints, map.getView().getZoom());
  eventTrackStyles = naturalEventsTrackStyle();
  coordinateArray = addClusterPoints(clusters, map, callback);
  console.log(coordinateArray);
  olTrackLineFeatures.push(naturalEventsTrackLine(coordinateArray, 'black-line'));
  olTrackLineFeatures.push(naturalEventsTrackLine(coordinateArray, 'white-line'));

  return {
    'id': eventObj.id,
    'track': naturalEventsTrackLayer(olTrackLineFeatures, eventTrackStyles),
    'pointArray': overlayArray,
    'selectedDate': selectedDate,
    'hidden': false
  };
};
export function naturalEventsTrackToggleVisibilty(shouldBeVisible, trackObj) {
  var selectedPoints = document.getElementsByClassName('track-marker-case');
  var newTrackObj = trackObj;
  if (shouldBeVisible) {
    lodashEach(selectedPoints, function (el) {
      el.classList.remove('track-marker-case-hidden');
    });
    newTrackObj.track.setOpacity(1);
    newTrackObj.hidden = false;
  } else {
    lodashEach(selectedPoints, function (el) {
      el.classList.add('track-marker-case-hidden');
    });
    newTrackObj.hidden = true;
    newTrackObj.track.setOpacity(0);
  }
  return newTrackObj;
};
export function naturalEventsTrackUpdateEvent(event, map, trackObj, selectedDate, callback) {
  var newTrackObj;
  if (!event || event.geometries.length < 2) {
    // If track exists remove it.
    // Else return empty Object
    return (trackObj.id) ? removeTrack(map, trackObj) : {};
  }
  newTrackObj = {};
  if (trackObj.id) {
    if (trackObj.id === event.id) {
      newTrackObj = trackObj;
      // If same Track but different selection
      // Just update classNames
      if (trackObj.selectedDate !== selectedDate) {
        naturalUpdateActiveTrack(selectedDate);
        newTrackObj.selectedDate = selectedDate;
      }
      return newTrackObj;
    } else {
      // Remove old DOM Elements
      newTrackObj = removeTrack(map, trackObj);
      newTrackObj = naturalEventsTrackCreate(event, map, selectedDate, callback);
      map.addLayer(newTrackObj.track);
    }
    return newTrackObj;
  } else {
    newTrackObj = naturalEventsTrackCreate(event, map, selectedDate, callback);
    map.addLayer(newTrackObj.track);
    return newTrackObj;
  }
};
