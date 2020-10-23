import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../../components/map/ol-coordinates';
import OlVectorInteractions from './ol-vector-interactions';
import OlMeasureTool from '../../components/map/ol-measure-tool';
import OlCoordinatesMarker from '../../components/geosearch/ol-coordinates-marker';
import { selectCoordinatesToFly } from '../../modules/geosearch/actions';

class MapInteractions extends React.PureComponent {
  getMapClasses = () => {
    const { isShowingClick, isDistractionFreeModeActive, isCoordinateSearchActive } = this.props;
    let mapClasses = 'wv-map';
    mapClasses += isShowingClick && !isCoordinateSearchActive ? ' cursor-pointer' : '';
    mapClasses += isCoordinateSearchActive ? ' cursor-crosshair' : '';
    mapClasses += isDistractionFreeModeActive ? ' distraction-free-active' : '';
    return mapClasses;
  };

  render() {
    const {
      selectCoordinatesToFly,
      isDistractionFreeModeActive,
      isCoordinateSearchActive,
      mouseEvents,
    } = this.props;
    const mapClasses = this.getMapClasses();
    return (
      <>
        <div
          id="wv-map"
          className={mapClasses}
        />
        {!isDistractionFreeModeActive && (
          <>
            <OlCoordinates
              mouseEvents={mouseEvents}
              selectCoordinatesToFly={selectCoordinatesToFly}
              isCoordinateSearchActive={isCoordinateSearchActive}
            />
          </>
        )}
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
  const { geosearch, map, ui } = state;
  const { isDistractionFreeModeActive } = ui;
  const { isCoordinateSearchActive } = geosearch;
  return {
    isShowingClick: map.isClickable,
    isDistractionFreeModeActive,
    isCoordinateSearchActive: !isDistractionFreeModeActive && isCoordinateSearchActive,
  };
}

const mapDispatchToProps = (dispatch) => ({
  selectCoordinatesToFly: (coordinates, reverseGeocodeResults) => {
    dispatch(selectCoordinatesToFly(coordinates, reverseGeocodeResults));
  },
});

MapInteractions.propTypes = {
  isDistractionFreeModeActive: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  isCoordinateSearchActive: PropTypes.bool,
  selectCoordinatesToFly: PropTypes.func,
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapInteractions);
