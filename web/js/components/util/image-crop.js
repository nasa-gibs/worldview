import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-image-crop';
import { Portal } from 'react-portal';
import { pick, some } from 'lodash';

// https://stackoverflow.com/a/13139830
const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function RenderCoordinates(props) {
  const { coordinates, topRightStyle, bottomLeftStyle } = props;
  if (bottomLeftStyle.width < 50) {
    return '';
  }
  return (
    <>
      <div
        id="wv-image-top"
        className="wv-image-coords wv-image-top noselect"
        style={topRightStyle}
      >
        {coordinates.topRight}
      </div>
      <div
        id="wv-image-bottom"
        className="wv-image-coords wv-image-bottom noselect"
        style={bottomLeftStyle}
      >
        {coordinates.bottomLeft}
      </div>
    </>
  );
}

function Crop(props) {
  const {
    onClose,
    onChange,
    onDragStop,
    maxWidth,
    maxHeight,
    showCoordinates,
    keepSelection,
    zIndex,
    coordinates,
    topRightStyle,
    bottomLeftStyle,
    x,
    y,
    width,
    height,
  } = props;

  const [crop, setCrop] = useState({
    x,
    y,
    width,
    height,
  });
  const [loading, setLoaded] = useState(true);

  useEffect(() => {
    setCrop({
      x,
      y,
      width,
      height,
    });
  }, [x, y, width, height]);

  const onFinishDrag = (cropBoundaries) => {
    const { width: cWidth, height: cHeight } = cropBoundaries;
    if (loading) return setLoaded(false); // Hack -- prevent event from triggering onload

    // https://github.com/DominicTobias/react-image-crop/issues/397
    const changed = cWidth && cWidth > 0 && cHeight && cHeight > 0
        && some(
          pick(cropBoundaries, 'x', 'y', 'width', 'height'),
          (value, key) => value !== prevCrop.current[key],
        );
    if (changed) {
      onDragStop(cropBoundaries);
    } else {
      onClose();
    }
  };

  const onDrag = (cropBoundaries) => {
    if (loading) return;
    setCrop(cropBoundaries);
    if (cropBoundaries.width && cropBoundaries.height) {
      onChange(cropBoundaries);
    }
  };
  const prevCrop = useRef(crop);

  return (
    <Portal node={document && document.getElementById('wv-content')}>
      {showCoordinates && (
        <RenderCoordinates
          coordinates={coordinates}
          topRightStyle={topRightStyle}
          bottomLeftStyle={bottomLeftStyle}
        />
      )}

      <Cropper
        crop={crop}
        src={TRANSPARENT_GIF}
        style={{
          background: crop.width && crop.height ? 'none' : 'rgba(0, 0, 0, 0.5)',
          zIndex,
        }}
        imageStyle={{
          width: maxWidth,
          height: maxHeight,
        }}
        keepSelection={keepSelection}
        onComplete={onFinishDrag}
        onChange={onDrag}
      />
    </Portal>
  );
}
export default Crop;

Crop.defaultProps = {
  height: 10,
  maxHeight: window.innerWidth,
  maxWidth: window.innerHeight,
  onDragStop: () => {},
  keepSelection: false,
  width: 30,
  x: 20,
  y: 10,
  zIndex: 3,
};

RenderCoordinates.propTypes = {
  coordinates: PropTypes.object,
  topRightStyle: PropTypes.object,
  bottomLeftStyle: PropTypes.object,
};

Crop.propTypes = {
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDragStop: PropTypes.func,
  bottomLeftStyle: PropTypes.object,
  coordinates: PropTypes.object,
  height: PropTypes.number,
  maxHeight: PropTypes.number,
  maxWidth: PropTypes.number,
  keepSelection: PropTypes.bool,
  showCoordinates: PropTypes.bool,
  topRightStyle: PropTypes.object,
  width: PropTypes.number,
  x: PropTypes.number,
  y: PropTypes.number,
  zIndex: PropTypes.number,
};
