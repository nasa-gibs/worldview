import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../../components/map/ol-coordinates';
import OlVectorInteractions from './ol-vector-interactions';
import OlMeasureTool from '../../components/map/ol-measure-tool';
import OlCoordinatesMarker from '../../components/location-search/ol-coordinates-marker';
import OlRotationButtons from '../../components/map/rotation';
import OlZoomButtons from '../../components/map/zoom';
import NaturalEvents from '../../map/natural-events/natural-events';

class MapInteractions extends PureComponent {
  getMapClasses = () => {
    const { isShowingClick, isDistractionFreeModeActive, isCoordinateSearchActive } = this.props;
    let mapClasses = 'wv-map';
    mapClasses += isShowingClick && !isCoordinateSearchActive ? ' cursor-pointer' : '';
    mapClasses += !isDistractionFreeModeActive && isCoordinateSearchActive ? ' cursor-crosshair' : '';
    mapClasses += isDistractionFreeModeActive ? ' distraction-free-active' : '';
    return mapClasses;
  };

  render() {
    const {
      isDistractionFreeModeActive,
      isNaturalEventsActive,
    } = this.props;
    const mapClasses = this.getMapClasses();
    return (
      <>
        <OlZoomButtons />
        <OlRotationButtons />
        <div id="wv-map" className={mapClasses} />
        {!isDistractionFreeModeActive && (
          <OlCoordinates />
        )}
        <OlVectorInteractions />
        <OlMeasureTool />
        <OlCoordinatesMarker />
        {isNaturalEventsActive && (
          <NaturalEvents />
        )}
      </>
    );
  }
}
function mapStateToProps(state) {
  const {
    config, locationSearch, map, ui, events,
  } = state;
  const { isDistractionFreeModeActive } = ui;
  const { isCoordinateSearchActive } = locationSearch;
  const eventsEnabled = config.features.naturalEvents;

  return {
    config,
    isShowingClick: map.isClickable,
    isDistractionFreeModeActive,
    isCoordinateSearchActive,
    isNaturalEventsActive: eventsEnabled && events.active,
  };
}

MapInteractions.propTypes = {
  isDistractionFreeModeActive: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  isCoordinateSearchActive: PropTypes.bool,
  isNaturalEventsActive: PropTypes.bool,
};
export default connect(
  mapStateToProps,
)(MapInteractions);
