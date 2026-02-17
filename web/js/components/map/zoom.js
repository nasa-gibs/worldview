import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mapUtilZoomAction } from '../../map/util';
import HoverTooltip from '../util/hover-tooltip';

function Zoom({
  map, zoomLevel, numZoomLevels, isDistractionFreeModeActive, isMobile, isChartingActive,
}) {
  const zoomInDisabled = zoomLevel === numZoomLevels;
  const zoomOutDisabled = zoomLevel === 0;
  if (!map) return null;

  const zoomButtonClass = isMobile ? 'wv-zoom-buttons-mobile' : 'wv-zoom-buttons';

  return !isDistractionFreeModeActive && !isChartingActive && (
    <div className={zoomButtonClass}>
      <button
        type="button"
        disabled={zoomInDisabled}
        className="wv-map-zoom wv-map-zoom-in"
        onClick={() => { mapUtilZoomAction(map, 1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        {!zoomInDisabled && (
        <HoverTooltip
          isMobile={isMobile}
          labelText="Zoom in view"
          placement="left"
          target=".wv-map-zoom-in"
        />
        )}
        <FontAwesomeIcon icon="plus" widthAuto />
      </button>
      <button
        type="button"
        disabled={zoomOutDisabled}
        className="wv-map-zoom wv-map-zoom-out"
        onClick={() => { mapUtilZoomAction(map, -1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        {!zoomOutDisabled && (
        <HoverTooltip
          isMobile={isMobile}
          labelText="Zoom out view"
          placement="left"
          target=".wv-map-zoom-out"
        />
        )}
        <FontAwesomeIcon icon="minus" widthAuto />
      </button>
    </div>
  );
}

const mapStateToProps = (state) => {
  const {
    screenSize, map, proj, ui, charting,
  } = state;
  const activeMap = map.ui.selected;
  const isMobile = screenSize.isMobileDevice;
  return {
    map: activeMap,
    zoomLevel: activeMap && activeMap.getView().getZoom(),
    numZoomLevels: proj.selected.numZoomLevels,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isMobile,
    isChartingActive: charting.active,
  };
};

Zoom.propTypes = {
  map: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isChartingActive: PropTypes.bool,
  numZoomLevels: PropTypes.number,
  zoomLevel: PropTypes.number,
};

export default connect(
  mapStateToProps,
)(Zoom);
