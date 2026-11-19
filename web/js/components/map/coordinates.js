import PropTypes from 'prop-types';
import util from '../../util/util';

// previous : next
const formatOrder = {
  'latlon-dd': 'latlon-dm',
  'latlon-dm': 'latlon-dms',
  'latlon-dms': 'latlon-dd',
};

export default function Coordinates({ latitude, longitude, format, crs, onFormatChange }) {
  const changeFormat = () => {
    const nextFormat = formatOrder[format];
    onFormatChange(nextFormat);
  };

  if (latitude === null || longitude === null) {
    return null;
  }

  const coords = util.formatCoordinate(
    [longitude, latitude],
    format,
  );

  return (
    <button
      type="button"
      id="coords-panel"
      className="wv-coords-map wv-coords-map-btn"
      onClick={changeFormat}
    >
      <span className="map-coord">
        {coords}
      </span>
      <div className="map-coord-format">
        <span className="map-coord">
          {crs}
        </span>
        <div aria-label="Change coordinates format" className="coord-btn">
          <i className="coord-switch" />
        </div>
      </div>
    </button>
  );
}

Coordinates.propTypes = {
  onFormatChange: PropTypes.func.isRequired,
  crs: PropTypes.string,
  format: PropTypes.string,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
};
