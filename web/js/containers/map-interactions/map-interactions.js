import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../../components/map/ol-coordinates';
import OlVectorInteractions from './ol-vector-interactions';
import OlMeasureTool from '../../components/map/ol-measure-tool';
import OlCoordinatesMarker from '../../components/location-search/ol-coordinates-marker';
import OlRotationButtons from '../../components/map/rotation';
import OlZoomButtons from '../../components/map/zoom';

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
      </>
    );
  }
}
function mapStateToProps(state) {
  const {
    config, locationSearch, map, ui,
  } = state;
  const { isDistractionFreeModeActive } = ui;
  const { isCoordinateSearchActive } = locationSearch;
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
  isCoordinateSearchActive: PropTypes.bool,
};
export default connect(
  mapStateToProps,
)(MapInteractions);
