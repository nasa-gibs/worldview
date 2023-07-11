import { useState, useEffect, useRef } from 'react';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import {
  each as lodashEach,
  debounce as lodashDebounce,
} from 'lodash';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  getClusters,
} from './cluster';
import { selectEvent as selectEventAction } from '../../modules/natural-events/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { CRS } from '../../modules/map/constants';
import usePrevious from '../../util/customHooks';

import {
  getTrackLines, getTrackPoint, getArrows, getClusterPointEl,
} from './util';

const removePointOverlays = (map, pointsAndArrows) => {
  lodashEach(pointsAndArrows, (pointOverlay) => {
    if (map.getOverlayById(pointOverlay.getId())) {
      map.removeOverlay(pointOverlay);
    }
  });
};

const addPointOverlays = (map, pointOverlayArray) => {
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
 * @param {Object} eventObj
 * @param {Object} proj
 * @param {Object} map OpenLayers map Object
 * @param {String} selectedDate
 * @param {Function} callback
 * @param {Function} showAllTracks
 * @return {Object} Object Containing track info and elements
 */
const getTracksAndPoints = function (eventObj, proj, map, selectedDate, callback, showAllTracks) {
  const pointsAndArrows = [];
  const trackSegments = [];
  const { clusters, firstClusterObj, secondClusterObj } = getClusters(eventObj, proj, selectedDate, map, showAllTracks);

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
        prevCoordinates = olProj.transform(prevCoordinates, CRS.GEOGRAPHIC, crs);
        nextCoordinates = olProj.transform(nextCoordinates, CRS.GEOGRAPHIC, crs);
      }
      const lineSegmentArray = [prevCoordinates, nextCoordinates];
      const arrowOverlay = getArrows(lineSegmentArray, map);
      pointsAndArrows.push(arrowOverlay);
      trackSegments.push(lineSegmentArray);
    }
    const point = clusterPoint.properties.cluster
      ? getClusterPointEl(proj, clusterPoint, map, pointClusterObj, callback)
      : getTrackPoint(proj, clusterPoint, isSelected, callback);
    pointsAndArrows.push(point);
  });
  return {
    track: getTrackLines(map, trackSegments),
    pointsAndArrows,
  };
};

function addOverlayIfIsVisible (map, overlay) {
  const extent = map.getView().calculateExtent();
  const position = overlay.getPosition();
  if (olExtent.containsCoordinate(extent, position)) {
    map.addOverlay(overlay);
  }
}

function EventTrack () {
  const dispatch = useDispatch();
  const selectEvent = (id, date) => dispatch(selectEventAction(id, date));

  const eventsData = useSelector((state) => getFilteredEvents(state), shallowEqual);
  const isAnimatingToEvent = useSelector((state) => state.animation.isAnimatingToEvent);
  const isPlaying = useSelector((state) => state.animation.isPlaying);
  const map = useSelector((state) => state.map.ui.selected, shallowEqual);
  const extent = useSelector((state) => state.map.extent, shallowEqual);
  const proj = useSelector((state) => state.proj, shallowEqual);
  const selectedDate = useSelector((state) => state.date.selected, shallowEqual);
  const selectedEvent = useSelector((state) => state.events.selected, shallowEqual);
  const showAllTracks = useSelector((state) => state.events.showAllTracks);

  const [trackDetails, setTrackDetails] = useState({});
  const [allTrackDetails, setAllTrackDetails] = useState([]);
  const trackDetailsRef = useRef();
  trackDetailsRef.current = trackDetails;
  const allTrackDetailsRef = useRef();
  allTrackDetailsRef.current = allTrackDetails;
  const showAllTracksRef = useRef(showAllTracks);
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);
  useEffect(() => {
    showAllTracksRef.current = showAllTracks;
  }, [showAllTracks]);


  // $$$ This function merely gets the selected event data from the events data and calls the update() function with that data, will likely not need it $$$
  const updateCurrentTrack = () => {
    const { id, date } = selectedEvent;
    if (!selectedEvent.id || !selectedEvent.date) return;
    const event = (eventsData || []).find((e) => e.id === id);
    if (!event) return;
    update(event, date);
  };

  const onPropertyChange = (e) => {
    if (showAllTracksRef.current && !allTrackDetailsRef.current.length) return;
    if (showAllTracksRef.current && (e.key === 'resolution' || e.key === 'rotation')) {
      removeAllTracks(mapRef.current);
    }
    if (!trackDetails.id) return;
    if (e.key === 'resolution' || e.key === 'rotation') {
      const newTrackDetails = trackDetails.id ? removeTrack(mapRef.current) : {};
      setTrackDetails(newTrackDetails);
    }
  };

  const addTrack = (mapArg, { track, pointsAndArrows }) => {
    if (!isAnimatingToEvent && typeof track !== 'undefined') {
      mapArg.addOverlay(track);
      addPointOverlays(mapArg, pointsAndArrows);
    }
  };

  const removeTrack = (mapArg) => {
    if (!mapArg) return;
    const { track, pointsAndArrows } = trackDetailsRef.current;
    mapArg.removeOverlay(track);
    removePointOverlays(mapArg, pointsAndArrows);

    return {};
  };

  const removeAllTracks = (mapArg) => {
    allTrackDetailsRef.current?.forEach((trackDetail) => {
      const { pointsAndArrows } = trackDetail.newTrackDetails;
      const { track } = trackDetail.newTrackDetails;
      mapArg.removeOverlay(track);
      removePointOverlays(mapArg, pointsAndArrows);
    });
  };

  const updateAllTracks = () => {
    let newTrackDetails;
    const allTracks = [];

    const createAndAddTrack = (singleEvent, eventID, eventDate) => {
      const {
        track,
        pointsAndArrows,
      } = getTracksAndPoints(singleEvent, proj, mapRef.current, eventDate, selectEvent, showAllTracksRef.current);

      newTrackDetails = {
        id: eventID,
        selectedDate: eventDate,
        track,
        pointsAndArrows,
        hidden: false,
      };
      allTracks.push({ newTrackDetails });
      addTrack(mapRef.current, newTrackDetails);
    };

    if (allTrackDetailsRef.current.length) {
      removeAllTracks(mapRef.current);
    }

    eventsData.forEach((event) => {
      const eventID = event.id;
      const eventDate = event.geometry[0].date.slice(0, 10);
      if (event.geometry.length > 1 && eventID !== trackDetailsRef.current.id) {
        createAndAddTrack(event, eventID, eventDate);
      }
    });

    setAllTrackDetails(allTracks);
  };


  const update = (event, date) => {
    let newTrackDetails;
    const sameEvent = event && trackDetailsRef.current.id === event.id;
    const sameDate = trackDetailsRef.current.selectedDate === date;

    const createAndAddTrack = () => {
      const {
        track,
        pointsAndArrows,
      } = getTracksAndPoints(event, proj, mapRef.current, date, selectEvent);

      newTrackDetails = {
        id: event.id,
        selectedDate: date,
        track,
        pointsAndArrows,
        hidden: false,
      };
      addTrack(mapRef.current, newTrackDetails);
    };

    if (!event || event.geometry.length < 2) {
      newTrackDetails = trackDetailsRef.current.id ? removeTrack(mapRef.current) : {};
    } else if (trackDetailsRef.current.id) {
      if (sameEvent && !sameDate) {
        const isClusteredSelection = !document.getElementById(`track-marker-${date}`);
        // If New Date is in cluster build new track
        if (isClusteredSelection) {
          newTrackDetails = removeTrack(mapRef.current);
          createAndAddTrack();
        } else {
          // Just update classNames
          newTrackDetails = trackDetailsRef.current;
          updateSelection(date);
          newTrackDetails.selectedDate = date;
        }
      } else {
        // Remove old DOM Elements
        newTrackDetails = removeTrack(mapRef.current);
        createAndAddTrack();
      }
    } else {
      // If no track element currently exists,
      // but there is a multiday event, build a new track
      createAndAddTrack();
    }
    setTrackDetails(newTrackDetails);
  };

  // debounce delays the function call by a set amount of time. in this case 50 milliseconds
  const debouncedTrackUpdate = lodashDebounce(updateCurrentTrack, 50);
  const debouncedOnPropertyChange = lodashDebounce(
    onPropertyChange.bind(this),
    100,
    { leading: true, trailing: true },
  );
  const debouncedUpdateAllTracks = lodashDebounce(updateAllTracks, 50);

  const initialize = () => {
    if (!mapRef.current) return;
    mapRef.current.getView().on('propertychange', debouncedOnPropertyChange);
    mapRef.current.once('postrender', () => { debouncedTrackUpdate(); });
    if (showAllTracksRef.current) {
      mapRef.current.once('postrender', () => { debouncedUpdateAllTracks(); });
    }
  };

  useEffect(
    () => {
      initialize();

      return () => {
        update(null);
        mapRef.current?.getView()?.un('propertychange', debouncedOnPropertyChange);
        if (showAllTracksRef.current) {
          removeAllTracks(mapRef.current);
        }
      };
    },
    [],
  );

  const prevSelectedDate = usePrevious(selectedDate);
  const prevSelectedEvent = usePrevious(selectedEvent);
  const prevIsAnimatingToEvent = usePrevious(isAnimatingToEvent);
  const prevEventsData = usePrevious(eventsData);
  const prevMap = usePrevious(mapRef.current);
  const prevExtent = usePrevious(extent);
  const prevShowAllTracks = usePrevious(showAllTracks);

  useEffect(
    () => {
      const selectedDateChange = (selectedDate && selectedDate.valueOf())
        !== (prevSelectedDate && prevSelectedDate?.valueOf());
      const eventDeselect = (selectedEvent !== prevSelectedEvent?.id) && !selectedEvent?.id;
      const finishedAnimating = !isAnimatingToEvent && (isAnimatingToEvent !== prevIsAnimatingToEvent);
      const eventsLoaded = eventsData && eventsData.length && (eventsData !== prevEventsData);
      const extentChange = prevExtent && (extent[0] !== prevExtent[0] || extent[1] !== prevExtent[1]);

      if (mapRef.current !== prevMap) {
        if (prevMap) {
          update(null);
          removeTrack(prevMap);
          removePointOverlays(prevMap, trackDetailsRef.current.pointsAndArrows);
          if (showAllTracksRef.current) {
            removeAllTracks(prevMap);
          }
        }
        initialize();
      }

      // remove all tracks when deselecting option
      if (!showAllTracksRef.current && prevShowAllTracks !== showAllTracks) {
        removeAllTracks(mapRef.current);
      }

      // show all tracks when selecting as option
      if (showAllTracksRef.current && !isPlaying && (prevShowAllTracks !== showAllTracksRef.current || selectedDateChange || finishedAnimating || eventsLoaded || extentChange)) {
        debouncedUpdateAllTracks();
      }

      // show only selected track if show all tracks is not selected
      if (!isPlaying && !showAllTracksRef.current && (selectedDateChange || finishedAnimating || eventsLoaded || extentChange)) {
        debouncedTrackUpdate();
      }

      // only remove selected track when event is deselected
      if (eventDeselect && !showAllTracksRef.current) {
        removeTrack(mapRef.current);
      }
    },
    [map, isPlaying, extent, selectedDate, isAnimatingToEvent, eventsData, selectedEvent, showAllTracksRef.current],
  );

  return null;
}

export default EventTrack;

