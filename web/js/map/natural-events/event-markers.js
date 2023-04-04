import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import lodashIsEmpty from 'lodash/isEmpty';
import * as olExtent from 'ol/extent';
import OlOverlay from 'ol/Overlay';
import OlFeature from 'ol/Feature';
import OlStyleStyle from 'ol/style/Style';
import OlStyleStroke from 'ol/style/Stroke';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlGeomPolygon from 'ol/geom/Polygon';
import * as olProj from 'ol/proj';
import googleTagManager from 'googleTagManager';
import EventIcon from '../../components/sidebar/event-icon';
import { selectEvent as selectEventAction } from '../../modules/natural-events/actions';
import { getDefaultEventDate } from '../../modules/natural-events/util';
import { getFilteredEvents } from '../../modules/natural-events/selectors';
import { CRS } from '../../modules/map/constants';

const icons = [
  'Dust and Haze',
  'Icebergs',
  'Manmade',
  'Sea and Lake Ice',
  'Severe Storms',
  'Snow',
  'Temperature Extremes',
  'Volcanoes',
  'Water Color',
  'Wildfires',
];

class EventMarkers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      markers: [],
    };
  }

  componentDidMount() {
    const { eventsDataIsLoading } = this.props;
    if (!eventsDataIsLoading) {
      this.draw();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      proj, eventsDataIsLoading, isAnimatingToEvent, selectedEvent,
    } = this.props;
    const projChange = proj !== prevProps.proj;
    const finishedLoading = !eventsDataIsLoading && eventsDataIsLoading !== prevProps.eventsDataIsLoading;
    const animationFinished = !isAnimatingToEvent && isAnimatingToEvent !== prevProps.isAnimatingToEvent;
    const selectedEventChanged = selectedEvent && selectedEvent !== prevProps.selectedEvent;

    if (finishedLoading || projChange || animationFinished || selectedEventChanged) {
      this.remove();
      this.draw();
    }
  }

  componentWillUnmount() {
    this.remove();
  }

  draw() {
    const {
      eventsData, selectedEvent, proj, map, isMobile, isAnimatingToEvent,
    } = this.props;

    if (!eventsData || eventsData.length < 1) return null;

    const markers = eventsData.reduce((collection, event) => {
      const marker = {};
      const isSelected = event.id === selectedEvent.id;
      const { crs } = proj.selected;
      let date = getDefaultEventDate(event);
      if (isSelected && selectedEvent.date) {
        date = selectedEvent.date;
      }
      const geometry = event.geometry.find((geom) => geom.date.split('T')[0] === date) || event.geometry[0];
      if (!geometry) return marker;

      let { coordinates } = geometry;

      const transformCoords = (coords) => olProj.transform(coords, CRS.GEOGRAPHIC, crs);

      // polar projections require transform of coordinates to crs
      if (proj.selected.id !== 'geographic') {
        // check for polygon geometries
        if (geometry.type === 'Polygon') {
          const coordinatesTransform = coordinates[0].map(transformCoords);
          const extent = olExtent.boundingExtent(coordinatesTransform);

          if (isSelected) {
            marker.boundingBox = createBoundingBox(coordinates, event.title, crs);
            map.addLayer(marker.boundingBox);
          }
          coordinates = olExtent.getCenter(extent);
        } else {
          // if normal geometries, transform given lon/lat array
          coordinates = transformCoords(coordinates);
        }
      } else if (geometry.type === 'Polygon') {
        const extent = olExtent.boundingExtent(geometry.coordinates[0]);
        coordinates = olExtent.getCenter(extent);
        if (isSelected) {
          marker.boundingBox = createBoundingBox(geometry.coordinates, event.title);
          map.addLayer(marker.boundingBox);
        }
      }

      const hideTooltips = isMobile || isAnimatingToEvent;
      let category = event.categories[0];
      // Assign a default category if we don't have an icon
      category = icons.includes(category.title)
        ? category
        : { title: 'Default', slug: 'default' };

      marker.pin = createPin(event.id, category, isSelected, event.title, hideTooltips);
      marker.pin.setPosition(coordinates);
      map.addOverlay(marker.pin);
      this.addInteractions(marker, event, date, isSelected);

      // empty objects (i.e., markers not within projection range) are not pushed to collection
      if (lodashIsEmpty(marker) !== true) {
        collection.push(marker);
      }
      return collection;
    }, []);

    this.setState({ markers }, () => {
      map.getView().changed();
      map.renderSync(); // Marker position will be off until this is called
    });
  }

  addInteractions(marker, event, date, isSelected) {
    const { selectEvent, mapUi } = this.props;
    const category = event.categories[0];
    let willSelect = true;
    let moveCount = 0;
    const pinEl = marker.pin.element_ || marker.pin.element;
    // Use passiveSupport detect in ui. passive applied if supported, capture will be false either way.
    const options = mapUi.supportsPassive ? { passive: true } : false;
    const onMouseDownTouchStart = (e) => {
      willSelect = true;
      moveCount = 0;
    };
    const onMouseMove = (e) => {
      moveCount += 1;
      if (moveCount > 2) {
        willSelect = false;
      }
    };
    const onClickTouchEnd = (e) => {
      if (willSelect && !isSelected) {
        e.stopPropagation();
        selectEvent(event.id, date);
        googleTagManager.pushEvent({
          event: 'natural_event_selected',
          natural_events: {
            category: category.title,
          },
        });
      }
    };

    ['pointerdown', 'mousedown', 'touchstart'].forEach((type) => {
      pinEl.addEventListener(type, onMouseDownTouchStart, options);
    });
    ['touchend', 'click'].forEach((type) => {
      pinEl.addEventListener(type, onClickTouchEnd, options);
    });
    ['pointermove', 'mousemove'].forEach((type) => {
      pinEl.addEventListener(type, onMouseMove, options);
    });
  }

  remove() {
    const { map } = this.props;
    const { markers } = this.state;
    if (markers.length < 1) return;
    markers.forEach((marker) => {
      if (marker.boundingBox) {
        // added setMap to null for marker to remove - may be scope related issue
        marker.boundingBox.setMap(null);
        map.removeLayer(marker.boundingBox);
      }
      if (marker.pin) {
        // added setMap to null for marker to remove - may be scope related issue
        marker.pin.setMap(null);
        map.removeOverlay(marker.pin);
      }
    });
    const markerContainer = document.getElementById('marker-container');
    markerContainer.remove();
    this.setState({ markers: [] });
  }

  render() {
    return null;
  }
}

const createPin = function(id, category, isSelected, title, hideTooltip) {
  const overlayEl = document.createElement('div');
  ReactDOM.render(
    React.createElement(EventIcon, {
      category: category.title,
      title,
      id,
      hideTooltip,
      isSelected,
    }),
    overlayEl,
  );
  return new OlOverlay({
    element: overlayEl,
    positioning: 'bottom-center',
    stopEvent: false,
    className: isSelected ? 'marker selected' : 'marker',
    id,
  });
};

const createBoundingBox = function(coordinates, title, proj = CRS.GEOGRAPHIC) {
  const lightStroke = new OlStyleStyle({
    stroke: new OlStyleStroke({
      color: [255, 255, 255, 0.6],
      width: 2,
      lineDash: [8, 12],
      lineDashOffset: 6,
    }),
  });
  const darkStroke = new OlStyleStyle({
    stroke: new OlStyleStroke({
      color: [0, 0, 0, 0.6],
      width: 2,
      lineDash: [8, 12],
    }),
  });
  const boxPolygon = new OlGeomPolygon(coordinates).transform(CRS.GEOGRAPHIC, proj);
  const boxFeature = new OlFeature({
    geometry: boxPolygon,
    name: title,
  });
  const vectorSource = new OlSourceVector({
    features: [boxFeature],
    wrapX: false,
  });

  return new OlLayerVector({
    source: vectorSource,
    style: [lightStroke, darkStroke],
  });
};

const mapStateToProps = (state) => {
  const {
    map, proj, events, requestedEvents, sidebar, date, screenSize,
  } = state;

  return {
    activeTab: sidebar.activeTab,
    map: map.ui.selected,
    mapUi: map.ui,
    proj,
    selectedEvent: events.selected,
    selectedDate: date.selected,
    isMobile: screenSize.isMobileDevice,
    isAnimatingToEvent: events.isAnimatingToEvent,
    eventsData: getFilteredEvents(state),
    eventsDataIsLoading: requestedEvents.isLoading,
  };
};

const mapDispatchToProps = (dispatch) => ({
  selectEvent: (id, date) => {
    dispatch(selectEventAction(id, date));
  },
});

EventMarkers.propTypes = {
  eventsData: PropTypes.array,
  eventsDataIsLoading: PropTypes.bool,
  isAnimatingToEvent: PropTypes.bool,
  isMobile: PropTypes.bool,
  map: PropTypes.object,
  mapUi: PropTypes.object,
  proj: PropTypes.object,
  selectEvent: PropTypes.func,
  selectedEvent: PropTypes.object,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(EventMarkers);
