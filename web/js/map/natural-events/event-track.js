import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import {
  each as lodashEach,
  debounce as lodashDebounce,
} from 'lodash';

import {
  getClusters,
} from './cluster';
import { selectEvent as selectEventAction } from '../../modules/natural-events/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';


import {
  getTrackLines, getTrackPoint, getArrows, getClusterPointEl,
} from './util';

class EventTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      trackDetails: {},
    };

    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.debouncedTrackUpdate = lodashDebounce(this.updateCurrentTrack, 250);
    this.debouncedOnPropertyChange = lodashDebounce(
      this.onPropertyChange.bind(this),
      500,
      { leading: true, trailing: false },
    );
  }

  componentDidMount() {
    this.initialize();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      map, selectedDate, isAnimatingToEvent, eventsData, selectedEvent,
    } = this.props;
    const selectedDateChange = (selectedDate && selectedDate.valueOf())
      !== (prevProps.selectedDate && prevProps.selectedDate.valueOf());
    const eventDeselect = (selectedEvent !== prevProps.selectedEvent.id) && !selectedEvent.id;
    const finishedAnimating = !isAnimatingToEvent && (isAnimatingToEvent !== prevProps.isAnimatingToEvent);
    const eventsLoaded = eventsData && eventsData.length && (eventsData !== prevProps.eventsData);
    const prevMap = prevProps.map;
    const { trackDetails } = this.state;

    if (map !== prevMap) {
      if (prevMap) {
        this.update(null);
        this.removeTrack(prevMap);
        removeOldPoints(prevMap, trackDetails.pointsAndArrows);
      }
      this.initialize();
    }

    if (selectedDateChange || finishedAnimating || eventsLoaded) {
      this.debouncedTrackUpdate();
    }

    if (eventDeselect) {
      this.removeTrack(map);
    }
  }

  componentWillUnmount() {
    const { map } = this.props;
    this.update(null);
    map.un('moveend', this.onMoveEnd);
    map.getView().un('propertychange', this.debouncedOnPropertyChange);
  }

  initialize() {
    const { map } = this.props;
    if (!map) return;
    // NOTE: Does not cause additional listeners to be registered on subsequent calls
    map.on('moveend', this.onMoveEnd);
    map.getView().on('propertychange', this.debouncedOnPropertyChange);
    this.debouncedTrackUpdate();
  }

  updateCurrentTrack() {
    const { selectedEvent, eventsData } = this.props;
    const { id, date } = selectedEvent;
    if (!selectedEvent.id || !selectedEvent.date) return;
    const event = (eventsData || []).find((e) => e.id === id);
    if (!event) return;
    this.update(event, date);
  }

  onMoveEnd = function(e) {
    const { map } = this.props;
    const { trackDetails } = this.state;

    if (trackDetails.id) {
      addPointOverlays(map, trackDetails.pointsAndArrows);
    } else {
      this.debouncedTrackUpdate();
    }
  }

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
        removeOldPoints(map, trackDetails.pointsAndArrows);
      }
    }
  }

  /**
   * @param  {Object} map Openlayers map object
   * @return {Object} Empty object
   */
  removeTrack = function(map) {
    const { trackDetails } = this.state;
    const { track, pointsAndArrows } = trackDetails;
    map.removeOverlay(track);
    removeOldPoints(map, pointsAndArrows);
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
      const {
        track,
        pointsAndArrows,
      } = getTracksAndPoints(event, proj, map, date, selectEvent);

      newTrackDetails = {
        id: event.id,
        selectedDate: date,
        track,
        pointsAndArrows,
        hidden: false,
      };

      map.addOverlay(track);
      track.changed();
      console.log('adding track');
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

const removeOldPoints = function(map, pointsAndArrows) {
  lodashEach(pointsAndArrows, (pointOverlay) => {
    if (map.getOverlayById(pointOverlay.getId())) {
      map.removeOverlay(pointOverlay);
    }
  });
};

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
 * Loop through clustered point array and create elements
 *
 * @param {Array} clusters Array of cluster objects
 * @param {Object} map OpenLayers map Object
 * @param {String} selectedDate
 * @param {Function} callback
 * @return {Object} Object Containing track info and elements
 */
const getTracksAndPoints = function(eventObj, proj, map, selectedDate, callback) {
  const pointsAndArrows = [];
  const trackSegments = [];
  const { clusters, firstClusterObj, secondClusterObj } = getClusters(eventObj, proj, selectedDate, map);

  clusters.forEach((clusterPoint, index) => {
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
        const { crs } = proj.selected;
        prevCoordinates = olProj.transform(prevCoordinates, 'EPSG:4326', crs);
        nextCoordinates = olProj.transform(nextCoordinates, 'EPSG:4326', crs);
      }

      const lineSegmentArray = [prevCoordinates, nextCoordinates];
      const arrowOverlay = getArrows(lineSegmentArray, map);
      pointsAndArrows.push(arrowOverlay);
      trackSegments.push(lineSegmentArray);
      addOverlayIfIsVisible(map, arrowOverlay);
    }

    const point = clusterPoint.properties.cluster
      ? getClusterPointEl(proj, clusterPoint, map, pointClusterObj, callback)
      : getTrackPoint(proj, clusterPoint, isSelected, callback);
    pointsAndArrows.push(point);

    addOverlayIfIsVisible(map, point);
  });
  return {
    track: getTrackLines(map, trackSegments),
    pointsAndArrows,
  };
};

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
    map, proj, events, date,
  } = state;
  const { isAnimatingToEvent } = events;
  return {
    map: map.ui.selected,
    proj,
    selectedDate: date.selected,
    selectedEvent: events.selected,
    eventsData: getFilteredEvents(state),
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
