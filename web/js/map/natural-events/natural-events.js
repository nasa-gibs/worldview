import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as olExtent from 'ol/extent';
import * as olProj from 'ol/proj';
import { getDefaultEventDate, getEventsWithinExtent } from './util';
import util from '../../util/util';
import { selectDate as selectDateAction } from '../../modules/date/actions';
import { selected as selectedAction } from '../../modules/natural-events/actions';
import {
  activateLayersForEventCategory as activateLayersForEventCategoryAction,
} from '../../modules/layers/actions';

import EventTrack from './event-track';
import EventMarkers from './event-markers';

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
      proj,
      eventsDataIsLoading,
      selectedEvent,
    } = this.props;
    const loadingChange = eventsDataIsLoading !== prevProps.eventsDataIsLoading;
    const projChange = proj !== prevProps.proj;
    const selectedEventChange = selectedEvent !== prevProps.selectedEvent;

    if (!map || eventsDataIsLoading) return;

    // When changing projection, zoom to the selected event if it is visible
    if (projChange && selectedEvent) {
      const { id, date } = selectedEvent;
      const event = this.filterEventList().find((e) => e.id === id);
      if (event) {
        this.zoomToEvent(event, date);
      }
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

  filterEventList() {
    const {
      map, proj, eventsData, selectedEvent,
    } = this.props;

    const extent = map.getView().calculateExtent();
    const eventsInExtentMap = getEventsWithinExtent(eventsData, selectedEvent, extent, proj.selected);
    return eventsData.filter((e) => eventsInExtentMap[e.id]);
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
      mapUi, selectDate, selectEventFinished, eventsData,
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
        const today = dateFormat(new Date());
        const yesterday = dateFormat(util.yesterday());
        if (date !== today || date !== yesterday) {
          selectDate(util.dateAdd(util.parseDateUTC(date), 'day', 1));
        }
      } else if (!isInitialLoad) {
        selectDate(util.parseDateUTC(date));
      }
      if (isIdChange && !isSameCategory && !isInitialLoad) {
        this.activateLayersForCategory(event.categories[0].title);
      }
      // hack to update layers
      if (isIdChange) {
        mapUi.reloadLayers();
      } else {
        mapUi.updateDate();
      }

      selectEventFinished();
    });
  }

  zoomToEvent = function(event, date, isSameEventID) {
    const { proj, map, mapUi } = this.props;
    const { crs, id } = proj.selected;
    const category = event.categories[0].title;
    const zoom = isSameEventID ? map.getView().getZoom() : zoomLevelReference[category];
    const geometry = event.geometry.find((geom) => geom.date.split('T')[0] === date);

    // check for polygon geometries and/or perform projection coordinate transform
    let coordinates = geometry.type === 'Polygon'
      ? olExtent.boundingExtent(
        olProj.transform(geometry.coordinates[0], 'EPSG:4326', crs),
      )
      : olProj.transform(geometry.coordinates, 'EPSG:4326', crs);

    // handle extent transform for polar
    if (geometry.type === 'Polygon' && id !== 'geographic') {
      coordinates = olProj.transformExtent(coordinates, 'EPSG:4326', crs);
    }
    return mapUi.animate.fly(coordinates, zoom, null);
  };

  /**
   * Add the relevant layers for event based on projection and category
   * @param {*} category
   */
  activateLayersForCategory(category = 'Default') {
    const { config, proj, activateLayersForEventCategory } = this.props;
    const { layers } = config.naturalEvents;
    activateLayersForEventCategory(layers[proj.id][category]);
  }

  render() {
    const { eventsData } = this.props;
    return !eventsData ? null : (
      <>
        <EventTrack />
        <EventMarkers />
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    events, config, map, proj, requestedEvents,
  } = state;
  const selectedMap = map.ui.selected;
  return {
    map: selectedMap,
    mapUi: map.ui,
    config,
    proj,
    eventsDataIsLoading: requestedEvents.isLoading,
    eventsData: requestedEvents.response,
    selectedEvent: events.selected,
  };
};

const mapDispatchToProps = (dispatch) => ({
  activateLayersForEventCategory: (layers) => {
    dispatch(activateLayersForEventCategoryAction(layers));
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
  config: PropTypes.object,
  eventsData: PropTypes.array,
  eventsDataIsLoading: PropTypes.bool,
  selectedEvent: PropTypes.object,
  selectEventFinished: PropTypes.func,
  selectDate: PropTypes.func,
  map: PropTypes.object,
  mapUi: PropTypes.object,
  proj: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NaturalEvents);
