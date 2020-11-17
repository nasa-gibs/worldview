import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../../components/map/ol-coordinates';
import OlVectorInteractions from './ol-vector-interactions';
import OlMeasureTool from '../../components/map/ol-measure-tool';
import OlCoordinatesMarker from '../../components/geosearch/ol-coordinates-marker';

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
      mouseEvents,
    } = this.props;
    const mapClasses = this.getMapClasses();
    return (
      <>
        <div
          id="wv-map"
          className={mapClasses}
        />
        <OlCoordinates
          mouseEvents={mouseEvents}
          isDistractionFreeModeActive={isDistractionFreeModeActive}
        />
        <OlVectorInteractions
          mouseEvents={mouseEvents}
        />
        <OlMeasureTool />
        <OlCoordinatesMarker
          mouseEvents={mouseEvents}
        />
      </>
    );
  }
}
function mapStateToProps(state) {
  const {
    config, geosearch, map, ui,
  } = state;
  const { isDistractionFreeModeActive } = ui;
  const { isCoordinateSearchActive } = geosearch;
  return {
    config,
    isShowingClick: map.isClickable,
    isDistractionFreeModeActive,
    isCoordinateSearchActive,
  };
}

MapInteractions.propTypes = {
  isDistractionFreeModeActive: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  isCoordinateSearchActive: PropTypes.bool,
};
export default connect(
  mapStateToProps,
)(MapInteractions);
