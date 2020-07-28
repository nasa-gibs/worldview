import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../../components/map/ol-coordinates';
import OlVectorInteractions from './ol-vector-interactions';
import OlMeasureTool from '../../components/map/ol-measure-tool';

class MapInteractions extends React.PureComponent {
  render() {
    const {
      isDistractionFreeModeActive,
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
        <div id="wv-map" className={mapClasses} />
        {!isDistractionFreeModeActive && (
          <>
            <OlCoordinates
              mouseEvents={mouseEvents}
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
  return {
    isShowingClick: state.map.isClickable,
  };
}
MapInteractions.propTypes = {
  isDistractionFreeModeActive: PropTypes.bool.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  mouseEvents: PropTypes.object.isRequired,
};
export default connect(
  mapStateToProps,
)(MapInteractions);
