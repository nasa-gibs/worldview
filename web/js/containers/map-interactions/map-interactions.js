import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../../components/map/ol-coordinates';
import OlVectorInteractions from './ol-vector-interactions';
import OlMeasureTool from '../../components/map/ol-measure-tool';
import { selectCoordinatesToFly } from '../../modules/geosearch/actions';

class MapInteractions extends React.PureComponent {
  render() {
    const {
      selectCoordinatesToFly,
      isDistractionFreeModeActive,
      isCoordinateSearchActive,
      isShowingClick,
      mouseEvents,
    } = this.props;
    let mapClasses = isShowingClick
      ? 'wv-map cursor-pointer'
      : 'wv-map';
    mapClasses = isDistractionFreeModeActive
      ? `${mapClasses} distraction-free-active`
      : mapClasses;

    return (
      <>
        <div
          id="wv-map"
          className={mapClasses}
          style={{ cursor: isCoordinateSearchActive ? 'crosshair' : 'default' }}
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
      </>
    );
  }
}
function mapStateToProps(state) {
  const { geosearch, map, ui } = state;
  const { isCoordinateSearchActive } = geosearch;
  return {
    isShowingClick: map.isClickable,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isCoordinateSearchActive,
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
