import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlFeature from 'ol/Feature';
import OlOverlay from 'ol/Overlay';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleStyle from 'ol/style/Style';
import * as olExtent from 'ol/extent';
import OlGeomMultiLineString from 'ol/geom/MultiLineString';
import * as olProj from 'ol/proj';
import {
  find as lodashFind,
  each as lodashEach,
  debounce as lodashDebounce,
} from 'lodash';

import {
  naturalEventsClusterPointToGeoJSON,
  naturalEventsClusterGetPoints,
  naturalEventsClusterCreateObject,
  naturalEventsClusterSort,
} from './cluster';
import { mapUtilZoomAction } from '../util';
import { selectEvent as selectEventAction } from '../../modules/natural-events/actions';

const firstClusterObj = naturalEventsClusterCreateObject(); // Cluster before selected event
const secondClusterObj = naturalEventsClusterCreateObject(); // Cluster after selected event


class EventTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      trackDetails: {},
    };

    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.onPropertyChange = this.onPropertyChange.bind(this);
  }

  componentDidMount() {
    this.initialize();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      map, selectedEvent, selectedDate, isAnimatingToEvent,
    } = this.props;
    const selectedEventChange = (selectedEvent && selectedEvent.id)
      !== (prevProps.selectedEvent && prevProps.selectedEvent.id);
    const selectedDateChange = (selectedDate && selectedDate.valueOf())
      !== (prevProps.selectedDate && prevProps.selectedDate.valueOf());
    const finishedAnimating = !isAnimatingToEvent && (isAnimatingToEvent !== prevProps.isAnimatingToEvent);
    const prevMap = prevProps.map;
    const { trackDetails } = this.state;


    if (map !== prevMap) {
      if (prevMap) {
        this.update(null);
        this.removeTrack(prevMap);
        removeOldPoints(prevMap, trackDetails);
      }
      this.initialize();
    }

    if (selectedEventChange || selectedDateChange || finishedAnimating) {
      this.debounceTrackUpdate();
    }
  }

  componentWillUnmount() {
    const { map } = this.props;
    this.update(null);
    map.un('moveend', this.onMoveEnd);
    map.getView().un('propertychange', this.onPropertyChange);
  }

  initialize() {
    const { map } = this.props;
    if (!map) return;
    // NOTE: Does not cause additional listeners to be registered on subsequent calls
    map.on('moveend', this.onMoveEnd);
    map.getView().on('propertychange', this.onPropertyChange);
    this.debounceTrackUpdate();
  }

  updateCurrentTrack() {
    const { selectedEvent, eventsData } = this.props;
    const { id, date } = selectedEvent;
    if (!selectedEvent.id || !selectedEvent.date) return;
    const event = (eventsData || []).find((e) => e.id === id);
    if (!event) return;
    this.update(event, date);
  }

  debounceTrackUpdate = lodashDebounce(this.updateCurrentTrack, 250);

  onMoveEnd = function(e) {
    const { map } = this.props;
    const { trackDetails } = this.state;

    if (trackDetails.id) {
      addPointOverlays(map, trackDetails.pointArray);
    } else {
      this.debounceTrackUpdate();
    }
  }

  // TODO throttle or debounce this? so many calls...
  onPropertyChange = (e) => {
    const { map } = this.props;
    const { trackDetails } = this.state;

    if (e.key === 'resolution' || e.key === 'rotation') {
      const newTrackDetails = trackDetails.id ? this.removeTrack(map) : {};
      this.setState({ trackDetails: newTrackDetails });
    } else if (e.key === 'center') {
      // if old values equal target, map is not moving
      // restricts track/cluster points from disappearing on min/max zoom
      let isNewTarget = true;
      if (e.target) {
        const valueCheck = (val) => (typeof val === 'number' ? val.toFixed(6) : 0);
        const oldValues = e.oldValue.map((val) => valueCheck(val));
        const targetValues = e.target.values_.center.map((val) => valueCheck(val));

        const oldLon = oldValues[0];
        const oldLat = oldValues[1];
        const targetLon = targetValues[0];
        const targetLat = targetValues[1];

        isNewTarget = oldLon !== targetLon || oldLat !== targetLat;
      }
      if (isNewTarget) {
        removeOldPoints(map, trackDetails);
      }
    }
  }

  /**
   * @param  {Object} map Openlayers map object
   * @return {Object} Empty object
   */
  removeTrack = function(map) {
    const { trackDetails } = this.state;
    const { track } = trackDetails;
    map.removeLayer(track);
    removeOldPoints(map, trackDetails);
    return {};
  };

  /**
   * Update track
   *
   * @param  {Object} event EONET event object
   * @param  {Object} map Ol map object
   * @param  {String} selectedDate
   * @return {[type]}
   */
  update = function(event, date) {
    const {
      proj, map, selectEvent,
    } = this.props;
    const { trackDetails } = this.state;
    let newTrackDetails;
    const sameEvent = event && trackDetails.id === event.id;
    const sameDate = trackDetails.selectedDate === date;
    const createAndAddTrack = () => {
      newTrackDetails = createTrack(proj, event, map, date, selectEvent);
      map.addLayer(newTrackDetails.track);
    };

    if (!event || event.geometry.length < 2) {
      newTrackDetails = trackDetails.id ? this.removeTrack(map) : {};
    } else if (trackDetails.id) {
      if (sameEvent && !sameDate) {
        const isClusteredSelection = !document.getElementById(`track-marker-${date}`);
        // If New Date is in cluster build new track
        if (isClusteredSelection) {
          newTrackDetails = this.removeTrack(map);
          createAndAddTrack();
        } else {
          // Just update classNames
          newTrackDetails = trackDetails;
          updateSelection(date);
          newTrackDetails.selectedDate = date;
        }
      } else {
        // Remove old DOM Elements
        newTrackDetails = this.removeTrack(map);
        createAndAddTrack();
      }
    } else {
      // If no track element currenlty exists,
      // but there is a multiday event, build a new track
      createAndAddTrack();
    }
    this.setState({ trackDetails: newTrackDetails });
  };

  render() {
    return null;
  }
}

/**
   * Determine if track point is across the date line from the
   * selected point
   * @param {Array} activeCoord Coordinate array of selected track point
   * @param {Array} nextCoord Coordinate to test against active coord
   * @return {Boolean}
   */
const crossesDateLine = function(activeCoord, nextCoord) {
  return Math.abs(activeCoord[0] - nextCoord[0]) > 180;
};

/**
 * Convert coordinates to be over date line
 * in geographic projections
 *
 * @param {Array} coordinates Coordinate array
 * @return {Array}
 */
const getOverDateLineCoordinates = function(coordinates) {
  const long = coordinates[0];
  const lat = coordinates[1];
  return long < 0
    ? [Math.abs(180 + 180 - Math.abs(long)), lat]
    : [-Math.abs(180 + 180 - Math.abs(long)), lat];
};

/**
 * Create vector layer
 *
 * @param  {Array} featuresArray Array of linstring
 *                               points
 * @return {Object} OpenLayers Vector Layer
 */
const naturalEventsTrackLayer = function(proj, featuresArray) {
  return new OlLayerVector({
    source: new OlSourceVector({
      features: featuresArray,
    }),
    extent:
      proj.selected.id === 'geographic'
        ? [-250, -90, 250, 90]
        : proj.selected.maxExtent,
    style: [getLineStyle('black', 2), getLineStyle('white', 1)],
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
const naturalEventsTrackPoint = function(
  proj,
  clusterPoint,
  isSelected,
  map,
  callback,
) {
  const overlayEl = document.createElement('div');
  const circleEl = document.createElement('div');
  const textEl = document.createElement('span');
  const { properties } = clusterPoint;
  const content = document.createTextNode(properties.date);
  const { date } = properties;
  const eventID = properties.event_id;
  let { coordinates } = clusterPoint.geometry;
  if (proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(coordinates, 'EPSG:4326', proj.selected.crs);
  }
  overlayEl.className = isSelected
    ? 'track-marker-case track-marker-case-selected'
    : 'track-marker-case';
  overlayEl.dataset.id = eventID;
  overlayEl.id = `track-marker-case-${date}`;
  overlayEl.onclick = function() {
    callback(eventID, date);
  };
  textEl.appendChild(content);
  textEl.className = 'track-marker-date';
  circleEl.className = `track-marker track-marker-${date}`;
  circleEl.id = `track-marker-${date}`;
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);
  return new OlOverlay({
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: eventID + date.toString(),
  });
};

/**
 * @param  {Array} coordinateArray
 * @return {Object} Openlayers Feature
 */
const naturalEventsTrackLine = function(coordinateArray) {
  return new OlFeature({
    geometry: new OlGeomMultiLineString(coordinateArray),
  });
};

/**
 * @param  {String} color
 * @param  {Number} Width
 * @return {Object} OpenLayers Style Object
 */
const getLineStyle = function(color, width) {
  return new OlStyleStyle({
    stroke: new OlStyleStroke({
      color,
      width,
    }),
  });
};

/**
 * Loop through event geometries and create
 * track points and line
 *
 * @param  {Object} proj
 * @param  {Object} eventObj EONET event Object
 * @param  {Object} map Openlayers map Object
 * @param  {String} selectedDate
 * @param  {Function} callback date-change callback
 * @return {Object} Object with Track elements and info
 */
const createTrack = function(proj, eventObj, map, selectedDate, callback) {
  const olTrackLineFeatures = [];
  let pointObject = {};
  const geoJSONPointsBeforeSelected = [];
  const geoJSONPointsAfterSelected = [];
  let selectedPoint;
  let clusters;
  let afterSelected = false;
  const zoom = map.getView().getZoom();
  const extent = proj.selected.id === 'geographic'
    ? [-250, -90, 250, 90]
    : [-180, -90, 180, 90];

  const selectedCoords = lodashFind(eventObj.geometry, (geometry) => geometry.date.split('T')[0] === selectedDate).coordinates;
  lodashEach(eventObj.geometry, (geometry, index) => {
    let { coordinates } = geometry;
    const date = geometry.date.split('T')[0];
    const isSelected = selectedDate === date;
    const isOverDateline = proj.selected.id === 'geographic'
      ? crossesDateLine(selectedCoords, coordinates)
      : false;
    if (isOverDateline) {
      // replace coordinates
      coordinates = getOverDateLineCoordinates(coordinates);
    }
    // Cluster in three groups
    if (isSelected) {
      selectedPoint = naturalEventsClusterPointToGeoJSON(
        eventObj.id,
        coordinates,
        date,
      );
      afterSelected = true;
    } else if (!afterSelected) {
      geoJSONPointsBeforeSelected.push(
        naturalEventsClusterPointToGeoJSON(eventObj.id, coordinates, date),
      );
    } else {
      geoJSONPointsAfterSelected.push(
        naturalEventsClusterPointToGeoJSON(eventObj.id, coordinates, date),
      );
    }
  });

  // set radius and maxZoom of superCluster object for polar vs geographic projections
  if (proj.selected.id !== 'geographic') {
    firstClusterObj.options.setPolar();
    secondClusterObj.options.setPolar();
  } else {
    firstClusterObj.options.setGeo();
    secondClusterObj.options.setGeo();
  }

  const clustersBeforeSelected = naturalEventsClusterGetPoints(
    firstClusterObj,
    geoJSONPointsBeforeSelected,
    zoom,
    extent,
  );
  const clustersAfterSelected = naturalEventsClusterGetPoints(
    secondClusterObj,
    geoJSONPointsAfterSelected,
    zoom,
    extent,
  );
  clusters = clustersBeforeSelected.concat(
    [selectedPoint],
    clustersAfterSelected,
  );
  clusters = naturalEventsClusterSort(clusters);

  pointObject = addPoints(proj, clusters, map, selectedDate, callback);
  olTrackLineFeatures.push(naturalEventsTrackLine(pointObject.trackArray));

  return {
    id: eventObj.id,
    track: naturalEventsTrackLayer(proj, olTrackLineFeatures, map),
    pointArray: pointObject.overlayArray,
    selectedDate,
    hidden: false,
  };
};

/**
 * Remove Point overlays to DOM
 *
 * @param  {Object} map OpenLayers Map Object
 * @param  {Array} pointOverlayArray
 * @return {void}
 */
const removeOldPoints = function(map, { pointArray }) {
  lodashEach(pointArray, (pointOverlay) => {
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
const addPointOverlays = function(map, pointOverlayArray) {
  lodashEach(pointOverlayArray, (pointOverlay) => {
    addOverlayIfIsVisible(map, pointOverlay);
  });
};

/**
 * Change selected point
 *
 * @param  {String} newDate
 * @return {void}
 */
const updateSelection = function(newDate) {
  const oldSelectedPoint = document.getElementsByClassName(
    'track-marker-case-selected',
  )[0];
  const newSelectedPoint = document.getElementById(
    `track-marker-case-${newDate}`,
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
const createArrows = function(lineSegmentCoords, map) {
  const currentRotation = map.getView().getRotation();
  const overlayEl = document.createElement('div');
  const innerEl = document.createElement('div');

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
  const distanceInPixels = Math.sqrt((dx ** 2) + (dy ** 2));
  const angleRadians = Math.atan2(dyCoord, dxCoord) - currentRotation;
  const angleDegrees = -angleRadians * (180 / Math.PI);
  const lengthOfArrowDiv = distanceInPixels - clusterPadding;

  innerEl.className = 'event-track-arrows';
  overlayEl.appendChild(innerEl);
  overlayEl.style.width = '1px';
  overlayEl.style.height = '1px';
  innerEl.style.width = `${lengthOfArrowDiv}px`;
  innerEl.style.height = '16px';
  innerEl.style.transform = `translate(${-(lengthOfArrowDiv / 2)}px, -8px)`;
  overlayEl.style.transform = `rotate(${angleDegrees}deg)`;
  return new OlOverlay({
    position: map.getCoordinateFromPixel(pixelMidPoint),
    positioning: 'center-center',
    stopEvent: true,
    element: overlayEl,
    id: `arrow${pixelMidPoint[0].toString()}${pixelMidPoint[1].toString()}`,
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
const addPoints = function(proj, clusters, map, selectedDate, callback) {
  const overlays = [];
  const trackArray = [];
  lodashEach(clusters, (clusterPoint, index) => {
    let point;
    const date = clusterPoint.properties.date || clusterPoint.properties.startDate;
    const isSelected = selectedDate === date;
    const pointClusterObj = new Date(date) > new Date(selectedDate)
      ? firstClusterObj
      : secondClusterObj;
    if (index !== 0) {
      let prevCoordinates = clusters[index - 1].geometry.coordinates;
      let nextCoordinates = clusterPoint.geometry.coordinates;

      // polar projections require transform of coordinates to crs
      if (proj.selected.id !== 'geographic') {
        prevCoordinates = olProj.transform(
          prevCoordinates,
          'EPSG:4326',
          proj.selected.crs,
        );
        nextCoordinates = olProj.transform(
          nextCoordinates,
          'EPSG:4326',
          proj.selected.crs,
        );
      }

      const lineSegmentArray = [prevCoordinates, nextCoordinates];
      const arrowOverlay = createArrows(lineSegmentArray, map);
      overlays.push(arrowOverlay);
      trackArray.push(lineSegmentArray);
      addOverlayIfIsVisible(map, arrowOverlay);
    }
    if (clusterPoint.properties.cluster) {
      point = getClusterPointEl(
        proj,
        clusterPoint,
        map,
        pointClusterObj,
        callback,
      );
      overlays.push(point);
    } else {
      point = naturalEventsTrackPoint(
        proj,
        clusterPoint,
        isSelected,
        map,
        callback,
      );
      overlays.push(point);
    }
    addOverlayIfIsVisible(map, point);
  });
  return { trackArray, overlayArray: overlays };
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
function getClusterPointEl(proj, cluster, map, pointClusterObj, callback) {
  const overlayEl = document.createElement('div');
  const circleEl = document.createElement('div');
  const innerCircleEl = document.createElement('div');

  const textEl = document.createElement('span');
  const { properties } = cluster;
  const clusterId = properties.cluster_id;
  const number = properties.point_count_abbreviated;
  const numberEl = document.createTextNode(number);
  const dateRangeTextEl = document.createTextNode(
    `${properties.startDate} to ${properties.endDate}`,
  );
  let { coordinates } = cluster.geometry;
  const mapView = map.getView();
  if (proj.selected.id !== 'geographic') {
    coordinates = olProj.transform(coordinates, 'EPSG:4326', proj.selected.crs);
  }
  const sizeClass = number < 10 ? 'small' : number < 20 ? 'medium' : 'large';

  overlayEl.className = 'cluster-track-marker-case track-marker-case';
  textEl.className = 'cluster-track-marker-date track-marker-date';
  textEl.appendChild(dateRangeTextEl);
  circleEl.className = `cluster-marker cluster-marker-${sizeClass}`;
  innerCircleEl.className = 'cluster-marker-inner';
  innerCircleEl.appendChild(numberEl);
  circleEl.appendChild(innerCircleEl);
  circleEl.onclick = () => {
    const zoomTo = pointClusterObj.getClusterExpansionZoom(clusterId);
    const mapZoom = mapView.getZoom();
    mapUtilZoomAction(map, zoomTo - mapZoom, 450, coordinates);
  };
  overlayEl.appendChild(circleEl);
  overlayEl.appendChild(textEl);

  return new OlOverlay({
    position: coordinates,
    positioning: 'center-center',
    element: overlayEl,
    stopEvent: false,
    id: clusterId + properties.startDate + properties.endDate,
  });
}

function addOverlayIfIsVisible(map, overlay) {
  if (
    olExtent.containsCoordinate(
      map.getView().calculateExtent(),
      overlay.getPosition(),
    )
  ) {
    map.addOverlay(overlay);
  }
}

const mapStateToProps = (state) => {
  const {
    map, proj, events, requestedEvents, date,
  } = state;
  const { isAnimatingToEvent } = events;
  return {
    map: map.ui.selected,
    proj,
    selectedDate: date.selected,
    selectedEvent: events.selected,
    eventsData: requestedEvents.response,
    isAnimatingToEvent,
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectEvent: (id, date) => {
    dispatch(selectEventAction(id, date));
  },
});

EventTrack.propTypes = {
  eventsData: PropTypes.array,
  map: PropTypes.object,
  isAnimatingToEvent: PropTypes.bool,
  proj: PropTypes.object,
  selectEvent: PropTypes.func,
  selectedEvent: PropTypes.object,
  selectedDate: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EventTrack);
