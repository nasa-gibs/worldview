import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mapUtilZoomAction } from '../../map/util';

function Zoom({
  map, zoomLevel, numZoomLevels, isDistractionFreeModeActive,
}) {
  if (!map) return null;

  return !isDistractionFreeModeActive && (
    <>
      <button
        type="button"
        disabled={zoomLevel === numZoomLevels}
        className="wv-map-zoom wv-map-zoom-in"
        title="Zoom in view."
        onClick={() => { mapUtilZoomAction(map, 1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <FontAwesomeIcon icon="plus" />
      </button>
      <button
        type="button"
        disabled={zoomLevel === 0}
        className="wv-map-zoom wv-map-zoom-out"
        title="Zoom out view."
        onClick={() => { mapUtilZoomAction(map, -1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <FontAwesomeIcon icon="minus" />
      </button>
    </>
  );
}

const mapStateToProps = (state) => {
  const { map, proj, ui } = state;
  const activeMap = map.ui.selected;
  return {
    map: activeMap,
    zoomLevel: activeMap && activeMap.getView().getZoom(),
    numZoomLevels: proj.selected.numZoomLevels,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
  };
};

Zoom.propTypes = {
  map: PropTypes.object,
  isDistractionFreeModeActive: PropTypes.bool,
  numZoomLevels: PropTypes.number,
  zoomLevel: PropTypes.number,
};

export default connect(
  mapStateToProps,
)(Zoom);
