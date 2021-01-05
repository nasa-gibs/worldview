import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mapUtilZoomAction } from '../../map/util';

function Zoom({ map, proj }) {
  if (!map) return null;
  const zoomLevel = map.getView().getZoom();
  const { numZoomLevels } = proj;

  return (
    <>
      <button
        type="button"
        disabled={zoomLevel === numZoomLevels}
        className="wv-map-zoom wv-map-zoom-in ui-button ui-corner-all ui-widget"
        title="Zoom in view."
        onClick={() => { mapUtilZoomAction(map, 1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <FontAwesomeIcon icon="plus" />
      </button>
      <div
        type="button"
        disabled={zoomLevel === 0}
        className="wv-map-zoom wv-map-zoom-out ui-button ui-corner-all ui-widget"
        title="Zoom out view."
        onClick={() => { mapUtilZoomAction(map, -1); }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <FontAwesomeIcon icon="minus" />
      </div>
    </>
  );
}

const mapStateToProps = (state) => {
  const { map, proj } = state;
  return {
    map: map.ui.selected,
    proj,
  };
};

Zoom.propTypes = {
  map: PropTypes.object,
  proj: PropTypes.object,
};

export default connect(
  mapStateToProps,
)(Zoom);
