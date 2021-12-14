import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import {
  getDefaultEventDate,
  validateGeometryCoords,
} from '../../modules/natural-events/util';
import util from '../../util/util';
import { selectDate as selectDateAction } from '../../modules/date/actions';
import { selected as selectedAction } from '../../modules/natural-events/actions';
import {
  activateLayersForEventCategory as activateLayersForEventCategoryAction,
} from '../../modules/layers/actions';
import { getFilteredEvents } from '../../modules/natural-events/selectors';

import EventTrack from './event-track';
import EventMarkers from './event-markers';

import { fly } from '../util';

const { events } = util;

const zoomLevelReference = {
  Wildfires: 8,
  Volcanoes: 6,
};

class NaturalEvents extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      prevSelectedEvent: {},
    };
    this.selectEvent = this.selectEvent.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      map,
      eventsDataIsLoading,
      selectedEvent,
    } = this.props;
    const loadingChange = eventsDataIsLoading !== prevProps.eventsDataIsLoading;
    const selectedEventChange = selectedEvent !== prevProps.selectedEvent;

    if (!map || eventsDataIsLoading) return;

    // When events are (re)loaded, zoom to the selected event if it is visible
    if (selectedEvent && loadingChange && !eventsDataIsLoading) {
      this.zoomIfVisible(selectedEvent);
    }

    if (selectedEventChange) {
      if (selectedEvent) {
        const { id, date } = selectedEvent;
        this.selectEvent(id, date, loadingChange);
      } else {
        this.deselectEvent();
      }
    }
  }

  zoomIfVisible({ id, date }) {
    const { eventsData, proj } = this.props;
    const event = eventsData.find((e) => e.id === id);
    if (!event) {
      return;
    }
    const visibleGeoms = event.geometry.filter((g) => validateGeometryCoords(g, proj.selected));
    if (visibleGeoms.length) {
      this.zoomToEvent(event, date);
    }
  }

  getZoomPromise = function(
    event,
    date,
    isIdChange,
    isInitialLoad,
  ) {
    return isInitialLoad
      ? new Promise((resolve, reject) => { resolve(); })
      : this.zoomToEvent(event, date, isIdChange);
  };

  selectEvent(id, date, isInitialLoad) {
    const { prevSelectedEvent } = this.state;
    const {
      selectDate, selectEventFinished, eventsData, activateLayersForEventCategory,
    } = this.props;

    const isIdChange = !prevSelectedEvent || prevSelectedEvent.id !== id;
    const prevId = prevSelectedEvent.id ? prevSelectedEvent.id : false;
    const prevEvent = prevId && eventsData.find((e) => e.id === prevId);
    const prevCategory = prevEvent ? prevEvent.categories[0].title : false;
    const event = eventsData.find((e) => e.id === id);
    const category = event && event.categories[0].title;
    const isSameCategory = category === prevCategory;
    if (!event) {
      return;
    }
    const eventDate = date || getDefaultEventDate(event);
    const dateFormat = (d) => d.toISOString().split('T')[0];

    this.setState({ prevSelectedEvent: { id, date } });

    this.getZoomPromise(event, eventDate, !isIdChange, isInitialLoad).then(() => {
      /* For Wildfires that didn't happen today, move the timeline forward a day
       * to improve the chance that the fire is visible.
       * NOTE: If the fire happened yesterday and the imagery isn't yet available
       * for today, this may not help.
       */
      if (event.categories[0].title === 'Wildfires' && !isInitialLoad) {
        const today = dateFormat(util.now());
        const yesterday = dateFormat(util.yesterday());
        if (date !== today || date !== yesterday) {
          selectDate(util.dateAdd(util.parseDateUTC(date), 'day', 1));
        }
      } else if (!isInitialLoad) {
        selectDate(util.parseDateUTC(date));
      }
      if (isIdChange && !isSameCategory && !isInitialLoad) {
        activateLayersForEventCategory(event.categories[0].title);
      }
      // hack to update layers
      if (isIdChange) {
        events.trigger('map:reload-layers');
      }

      selectEventFinished();
    });
  }

  zoomToEvent = function(event, date, isSameEventID) {
    const { proj, map } = this.props;
    const { crs } = proj.selected;
    const category = event.categories[0].title;
    const zoom = isSameEventID ? map.getView().getZoom() : zoomLevelReference[category];
    const geometry = event.geometry.find((geom) => geom.date.split('T')[0] === date);

    // check for polygon geometries and/or perform projection coordinate transform
    let coordinates;
    const transformCoords = (coords) => olProj.transform(coords, 'EPSG:4326', crs);

    if (geometry.type === 'Polygon') {
      const transformedCoords = geometry.coordinates[0].map(transformCoords);
      coordinates = olExtent.boundingExtent(transformedCoords);
    } else {
      coordinates = olProj.transform(geometry.coordinates, 'EPSG:4326', crs);
    }
    return fly(map, proj, coordinates, zoom, null);
  };

  render() {
    return (
      <>
        <EventTrack />
        <EventMarkers />
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    map, proj, requestedEvents,
  } = state;
  const { active, selected } = state.events;
  const selectedMap = map.ui.selected;
  return {
    eventsActive: active,
    map: selectedMap,
    proj,
    eventsDataIsLoading: requestedEvents.isLoading,
    eventsData: getFilteredEvents(state),
    selectedEvent: selected,
  };
};

const mapDispatchToProps = (dispatch) => ({
  activateLayersForEventCategory: (category = 'Default') => {
    dispatch(activateLayersForEventCategoryAction(category));
  },
  selectDate: (date) => {
    dispatch(selectDateAction(date));
  },
  selectEventFinished: () => {
    dispatch(selectedAction());
  },
});

NaturalEvents.propTypes = {
  activateLayersForEventCategory: PropTypes.func,
  eventsData: PropTypes.array,
  eventsDataIsLoading: PropTypes.bool,
  selectedEvent: PropTypes.object,
  selectEventFinished: PropTypes.func,
  selectDate: PropTypes.func,
  map: PropTypes.object,
  proj: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NaturalEvents);
