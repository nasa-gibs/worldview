import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mapUtilZoomAction } from '../../map/util';
import HoverTooltip from '../util/hover-tooltip';

function Zoom({
  map, zoomLevel, numZoomLevels, isDistractionFreeModeActive, isMobile,
}) {
  if (!map) return null;

  return !isDistractionFreeModeActive && (
    <div className="wv-zoom-buttons">
      <button
        type="button"
        disabled={zoomLevel === numZoomLevels}
        className="wv-map-zoom wv-map-zoom-in"
        onClick={() => { mapUtilZoomAction(map, 1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText="Zoom in view"
          placement="left"
          target=".wv-map-zoom-in"
        />
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
        <HoverTooltip
          isMobile={isMobile}
          labelText="Zoom out view"
          placement="left"
          target=".wv-map-zoom-out"
        />
        <FontAwesomeIcon icon="minus" />
      </button>
    </div>
  );
}

const mapStateToProps = (state) => {
  const {
    browser, map, proj, ui,
  } = state;
  const activeMap = map.ui.selected;
  const isMobile = browser.lessThan.medium;
  return {
    map: activeMap,
    zoomLevel: activeMap && activeMap.getView().getZoom(),
    numZoomLevels: proj.selected.numZoomLevels,
    isDistractionFreeModeActive: ui.isDistractionFreeModeActive,
    isMobile,
  };
};

Zoom.propTypes = {
  map: PropTypes.object,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  numZoomLevels: PropTypes.number,
  zoomLevel: PropTypes.number,
};

export default connect(
  mapStateToProps,
)(Zoom);
