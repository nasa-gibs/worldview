import OlFeature from 'ol/Feature';
import OlOverlay from 'ol/Overlay';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleStyle from 'ol/style/Style';
import * as olExtent from 'ol/extent';
import OlGeomMultiLineString from 'ol/geom/MultiLineString';
import * as olProj from 'ol/proj';
import lodashEach from 'lodash/each';
import lodashDebounce from 'lodash/debounce';
import { naturalEventsUtilGetEventById } from './util';
import {
  naturalEventsClusterPointToGeoJSON,
  naturalEventsClusterGetPoints,
  naturalEventsClusterCreateObject,
  naturalEventsClusterSort
} from './cluster';

import { mapUtilZoomAction } from '../map/util';
const firstClusterObj = naturalEventsClusterCreateObject(); // Cluster before selected event
const secondClusterObj = naturalEventsClusterCreateObject(); // Cluster after selected event

export default function naturalEventsTrack(models, ui, config) {
  var self = {};
  var model = models.naturalEvents;
  self.trackDetails = {};
  self.active = false;
  /**
   * @return {void}
   */
  var init = function() {
    const map = ui.map.selected;
    map.on('moveend', function(e) {
      if (self.active) {
        if (self.trackDetails.id) {
          addPointOverlays(map, self.trackDetails.pointArray);
        } else {
          let selectedEvent = ui.naturalEvents.selected;
          if (selectedEvent.date) {
            let event = naturalEventsUtilGetEventById(
              model.data.events,
              selectedEvent.id
            );
            debounceTrackUpdate(
              event,
              selectedEvent.date,
              map,
              ui.naturalEvents.selectEvent
            );
          }
        }
      }
    });
    // reset track on change to resolution or rotation
    map.getView().on('propertychange', function(e) {
      if (e.key === 'resolution' || e.key === 'rotation') {
        self.trackDetails = self.trackDetails.id
          ? self.removeTrack(map, self.trackDetails)
          : {};
      } else if (e.key === 'center') {
        if (self.active) {
          // if old values equal target, map is not moving
          // restricts track/cluster points from disappearing on min/max zoom
          let isNewTarget = true;
          if (e.target) {
            const valueCheck = val =>
              typeof val === 'number' ? val.toFixed(6) : 0;
            let oldValues = e.oldValue.map(val => valueCheck(val));
            let targetValues = e.target.values_.center.map(val =>
              valueCheck(val)
            );

            let oldLon = oldValues[0];
            let oldLat = oldValues[1];
            let targetLon = targetValues[0];
            let targetLat = targetValues[1];

            // compare oldValues and target values
            isNewTarget = oldLon !== targetLon || oldLat !== targetLat;
          }
          if (isNewTarget) {
            removeOldPoints(map, self.trackDetails.pointArray);
          }
        }
      }
    });
    ui.sidebar.events.on('selectTab', function(tab) {
      if (tab === 'events') {
        let selectedEvent = ui.naturalEvents.selected;
        if (selectedEvent.date) {
          let event = naturalEventsUtilGetEventById(
            model.data.events,
            selectedEvent.id
          );
          self.update(
            event,
            map,
            selectedEvent.date,
            ui.naturalEvents.selectEvent
          );
        }
      } else {
        if (self.trackDetails.id) self.update(null, map);
      }
    });
    // update/remove track on projection change
    models.proj.events.on('select', function(e) {
      if (self.trackDetails.id) self.update(null, map);
    });
  };
  /**
   * Remove track
   *
   * @param  {Object} map Openlayers map object
   * @param  {Object} trackObj Object containig info related
   *                            to track
   * @return {Object} Empty object
   */
  self.removeTrack = function(map, trackObj) {
    map.removeLayer(trackObj.track);
    removeOldPoints(map, trackObj.pointArray);
    return {};
  };

  /**
   * Update track
   *
   * @param  {Object} event EONET event object
   * @param  {Object} map Ol map object
   * @param  {String} selectedDate
   * @param  {Function} callback event change callback
   * @return {[type]}
   */
  self.update = function(event, map, selectedDate, callback) {
    var newTrackDetails;
    var trackDetails = self.trackDetails;
    if (!event || event.geometries.length < 2) {
      // If track exists remove it.
      // Else return empty Object
      newTrackDetails = trackDetails.id
        ? self.removeTrack(map, trackDetails)
        : {};
      self.active = false;
    } else if (trackDetails.id) {
      if (trackDetails.id === event.id) {
        // If same Track but different selection
        // Just update classNames
        if (trackDetails.selectedDate !== selectedDate) {
          let isClusteredSelection = !document.getElementById(
            'track-marker-' + selectedDate
          );
          // If New Date is in cluster
          // build new track
          if (isClusteredSelection) {
            newTrackDetails = self.removeTrack(map, trackDetails);
            newTrackDetails = createTrack(
              models,
              event,
              map,
              selectedDate,
              callback
            );
            map.addLayer(newTrackDetails.track);
          } else {
            newTrackDetails = trackDetails;
            updateSelection(selectedDate);
            newTrackDetails.selectedDate = selectedDate;
          }
        } else {
          // If the date and event are the same
          // Return the same Object and do nothing
          return self.trackDetails;
        }
      } else {
        // Remove old DOM Elements
        newTrackDetails = self.removeTrack(map, trackDetails);
        newTrackDetails = createTrack(
          models,
          event,
          map,
          selectedDate,
          callback
        );
        map.addLayer(newTrackDetails.track);
      }
    } else {
      // If no track element currenlty exists,
      // but there is a multiday event, build a new track
      newTrackDetails = createTrack(models, event, map, selectedDate, callback);
      map.addLayer(newTrackDetails.track);
      self.active = true;
    }
    self.trackDetails = newTrackDetails;
  };
  var debounceTrackUpdate = lodashDebounce(
    (event, selectedDate, map, selectEventCallback) => {
      self.update(event, map, selectedDate, selectEventCallback);
    },
    250
  );

  init();
  return self;
}
/**
 * Create vector layer
 *
 * @param  {Array} featuresArray Array of linstring
 *                               points
 * @return {Object} OpenLayers Vector Layer
 */
var naturalEventsTrackLayer = function(models, featuresArray) {
  return new OlLayerVector({
    source: new OlSourceVector({
      features: featuresArray
    }),
    extent: models.proj.selected.maxExtent,
    style: [getLineStyle('black', 2), getLineStyle('white', 1)]
  });
};
/**
 * Create event point
 *
 * @param  {Object} clusterPoint
 * @param  {Boolean} isSelected
 * @param  {Function} callback
 * @return {Object} Openlayers overlay object
 */
var naturalEventsTrackPoint = function(
  models,
  clusterPoint,
  isSelected,
  map,
  callback
) {
  var overlayEl = document.createElement('div');
  var circleEl = document.createElement('div');
  var textEl = document.createElement('span');
  var properties = clusterPoint.properties;
  var content = document.createTextNode(properties.date);
  var date = properties.date;
  var eventID = properties.event_id;
  var coordinates = clusterPoint.geometry.coordinates;
  if (models.proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(
      coordinates,
      'EPSG:4326',
      models.proj.selected.crs
    );
  }
  overlayEl.className = isSelected
    ? 'track-marker-case track-marker-case-selected'
    : 'track-marker-case';
  overlayEl.dataset.id = eventID;
  overlayEl.id = 'track-marker-case-' + date;
  overlayEl.onclick = function() {
    callback(eventID, date);
  };
  textEl.appendChild(content);
  textEl.className = 'track-marker-date';
  circleEl.className = 'track-marker track-marker-' + date;
  circleEl.id = 'track-marker-' + date;
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);
  return new OlOverlay({
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: eventID + date.toString()
  });
};
/**
 * @param  {Array} coordinateArray
 * @return {Object} Openlayers Feature
 */
var naturalEventsTrackLine = function(coordinateArray) {
  return new OlFeature({
    geometry: new OlGeomMultiLineString(coordinateArray)
  });
};
/**
 * @param  {String} color
 * @param  {Number} Width
 * @return {Object} OpenLayers Style Object
 */
var getLineStyle = function(color, width) {
  return new OlStyleStyle({
    stroke: new OlStyleStroke({
      color: color,
      width: width
    })
  });
};
/**
 * Loop through event geometries and create
 * track points and line
 *
 * @param  {Object} models
 * @param  {Object} eventObj EONET event Object
 * @param  {Object} map Openlayers map Object
 * @param  {String} selectedDate
 * @param  {Function} callback date-change callback
 * @return {Object} Object with Track elements and info
 */
var createTrack = function(models, eventObj, map, selectedDate, callback) {
  var olTrackLineFeatures = [];
  var pointObject = {};
  var geoJSONPointsBeforeSelected = [];
  var geoJSONPointsAfterSelected = [];
  var clustersBeforeSelected;
  var clustersAfterSelected;

  var selectedPoint;
  var zoom = map.getView().getZoom();
  var clusters;
  var afterSelected = false;
  lodashEach(eventObj.geometries, function(geometry, index) {
    var date = geometry.date.split('T')[0];
    var coordinates = geometry.coordinates;
    var isSelected = selectedDate === date;
    // Cluster in three groups
    if (isSelected) {
      selectedPoint = naturalEventsClusterPointToGeoJSON(
        eventObj.id,
        coordinates,
        date
      );
      afterSelected = true;
    } else if (!afterSelected) {
      geoJSONPointsBeforeSelected.push(
        naturalEventsClusterPointToGeoJSON(eventObj.id, coordinates, date)
      );
    } else {
      geoJSONPointsAfterSelected.push(
        naturalEventsClusterPointToGeoJSON(eventObj.id, coordinates, date)
      );
    }
  });

  // set radius and maxZoom of superCluster object for polar vs geographic projections
  if (models.proj.selected.id !== 'geographic') {
    firstClusterObj.options.setPolar();
    secondClusterObj.options.setPolar();
  } else {
    firstClusterObj.options.setGeo();
    secondClusterObj.options.setGeo();
  }

  clustersBeforeSelected = naturalEventsClusterGetPoints(
    firstClusterObj,
    geoJSONPointsBeforeSelected,
    zoom
  );
  clustersAfterSelected = naturalEventsClusterGetPoints(
    secondClusterObj,
    geoJSONPointsAfterSelected,
    zoom
  );
  clusters = clustersBeforeSelected.concat(
    [selectedPoint],
    clustersAfterSelected
  );
  clusters = naturalEventsClusterSort(clusters);

  pointObject = addPoints(models, clusters, map, selectedDate, callback);
  olTrackLineFeatures.push(naturalEventsTrackLine(pointObject.trackArray));

  return {
    id: eventObj.id,
    track: naturalEventsTrackLayer(models, olTrackLineFeatures, map),
    pointArray: pointObject.overlayArray,
    selectedDate: selectedDate,
    hidden: false
  };
};
/**
 * Remove Point overlays to DOM
 *
 * @param  {Object} map OpenLayers Map Object
 * @param  {Array} pointOverlayArray
 * @return {void}
 */
var removeOldPoints = function(map, pointOverlayArray) {
  lodashEach(pointOverlayArray, function(pointOverlay) {
    if (map.getOverlayById(pointOverlay.getId())) {
      map.removeOverlay(pointOverlay);
    }
  });
};

/**
 * Add Point overlays to DOM
 *
 * @param  {Object} map OpenLayers Map Object
 * @param  {Array} pointOverlayArray
 * @return {void}
 */
var addPointOverlays = function(map, pointOverlayArray) {
  lodashEach(pointOverlayArray, function(pointOverlay) {
    addOverlayIfIsVisible(map, pointOverlay);
  });
};
/**
 * Change selected point
 *
 * @param  {String} newDate
 * @return {void}
 */
var updateSelection = function(newDate) {
  var oldSelectedPoint = document.getElementsByClassName(
    'track-marker-case-selected'
  )[0];
  var newSelectedPoint = document.getElementById(
    'track-marker-case-' + newDate
  );
  if (oldSelectedPoint) oldSelectedPoint.className = 'track-marker-case';
  newSelectedPoint.className = 'track-marker-case track-marker-case-selected';
};
/**
 * Create rotated element that displays arrows between points
 * as repeated css background image
 *
 * @param  {Array} lineSegmentCoords Start and end points of
 *                  line in Lat/long
 * @param  {Object} map OpenLayers map Object
 * @return {Object} Openlayers overlay Object
 */
var createArrows = function(lineSegmentCoords, map) {
  const currentRotation = map.getView().getRotation();
  var overlayEl = document.createElement('div');
  var innerEl = document.createElement('div');

  const clusterPadding = 20; // 10px on each side
  const end = lineSegmentCoords[0];
  const start = lineSegmentCoords[1];
  const dxCoord = end[0] - start[0];
  const dyCoord = end[1] - start[1];
  const pixel1 = map.getPixelFromCoordinate(start);
  const pixel2 = map.getPixelFromCoordinate(end);
  const dx = pixel2[0] - pixel1[0];
  const dy = pixel2[1] - pixel1[1];
  const pixelMidPoint = [0.5 * dx + pixel1[0], 0.5 * dy + pixel1[1]];
  const distanceInPixels = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  const angleRadians = Math.atan2(dyCoord, dxCoord) - currentRotation;
  const angleDegrees = -angleRadians * (180 / Math.PI);
  const lengthOfArrowDiv = distanceInPixels - clusterPadding;

  innerEl.className = 'event-track-arrows';
  overlayEl.appendChild(innerEl);
  overlayEl.style.width = '1px';
  overlayEl.style.height = '1px';
  innerEl.style.width = lengthOfArrowDiv + 'px';
  innerEl.style.height = '16px';
  innerEl.style.transform =
    'translate(' + -(lengthOfArrowDiv / 2) + 'px' + ', -8px)';
  overlayEl.style.transform = 'rotate(' + angleDegrees + 'deg)';
  return new OlOverlay({
    position: map.getCoordinateFromPixel(pixelMidPoint),
    positioning: 'center-center',
    stopEvent: true,
    element: overlayEl,
    id: 'arrow' + pixelMidPoint[0].toString() + pixelMidPoint[1].toString()
  });
};
/**
 * Loop through clustered point array and create elements
 *
 * @param {Array} clusters Array of cluster objects
 * @param {Object} map OpenLayers map Object
 * @param {String} selectedDate
 * @param {Function} callback
 * @return {Object} Object Containing track info and elements
 */
var addPoints = function(models, clusters, map, selectedDate, callback) {
  var overlays = [];
  var trackArray = [];
  lodashEach(clusters, function(clusterPoint, index) {
    let point;
    let date =
      clusterPoint.properties.date || clusterPoint.properties.startDate;
    let isSelected = selectedDate === date;
    let pointClusterObj =
      new Date(date) > new Date(selectedDate)
        ? firstClusterObj
        : secondClusterObj;
    if (index !== 0) {
      let prevCoordinates = clusters[index - 1].geometry.coordinates;
      let nextCoordinates = clusterPoint.geometry.coordinates;

      // polar projections require transform of coordinates to crs
      if (models.proj.selected.id !== 'geographic') {
        prevCoordinates = olProj.transform(
          prevCoordinates,
          'EPSG:4326',
          models.proj.selected.crs
        );
        nextCoordinates = olProj.transform(
          nextCoordinates,
          'EPSG:4326',
          models.proj.selected.crs
        );
      }

      let lineSegmentArray = [prevCoordinates, nextCoordinates];
      let arrowOverlay = createArrows(lineSegmentArray, map);
      overlays.push(arrowOverlay);
      trackArray.push(lineSegmentArray);
      addOverlayIfIsVisible(map, arrowOverlay);
    }
    if (clusterPoint.properties.cluster) {
      point = getClusterPointEl(
        models,
        clusterPoint,
        map,
        pointClusterObj,
        callback
      );
      overlays.push(point);
    } else {
      point = naturalEventsTrackPoint(
        models,
        clusterPoint,
        isSelected,
        map,
        callback
      );
      overlays.push(point);
    }
    addOverlayIfIsVisible(map, point);
  });
  return { trackArray: trackArray, overlayArray: overlays };
};
/**
 * Create cluster point
 *
 * @param  {Object} clusterPoint
 * @param  {Object} map Openlayers map object
 * @param  {Object} pointClusterObj supercluster object
 * @param  {Function} callback
 * @return {Object} Openlayers overlay object
 */
function getClusterPointEl(models, cluster, map, pointClusterObj, callback) {
  var overlayEl = document.createElement('div');
  var circleEl = document.createElement('div');
  var innerCircleEl = document.createElement('div');

  var textEl = document.createElement('span');
  var properties = cluster.properties;
  var clusterId = properties.cluster_id;
  var number = properties.point_count_abbreviated;
  var numberEl = document.createTextNode(number);
  var dateRangeTextEl = document.createTextNode(
    properties.startDate + ' to ' + properties.endDate
  );
  var coordinates = cluster.geometry.coordinates;
  var mapView = map.getView();
  if (models.proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(
      coordinates,
      'EPSG:4326',
      models.proj.selected.crs
    );
  }
  var sizeClass = number < 10 ? 'small' : number < 20 ? 'medium' : 'large';

  overlayEl.className = 'cluster-track-marker-case track-marker-case';
  textEl.className = 'cluster-track-marker-date track-marker-date';
  textEl.appendChild(dateRangeTextEl);
  circleEl.className = 'cluster-marker cluster-marker-' + sizeClass;
  innerCircleEl.className = 'cluster-marker-inner';
  innerCircleEl.appendChild(numberEl);
  circleEl.appendChild(innerCircleEl);
  circleEl.onclick = () => {
    var zoomTo = pointClusterObj.getClusterExpansionZoom(clusterId);
    var mapZoom = mapView.getZoom();
    mapUtilZoomAction(map, zoomTo - mapZoom, 450, coordinates);
  };
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: clusterId
  });
}
function addOverlayIfIsVisible(map, overlay) {
  if (
    olExtent.containsCoordinate(
      map.getView().calculateExtent(),
      overlay.getPosition()
    )
  ) {
    map.addOverlay(overlay);
  }
}
