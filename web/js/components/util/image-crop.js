import React from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-image-crop';
import { Portal } from 'react-portal';

// https://stackoverflow.com/a/13139830
const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/*
 * A react reuseable list component
 *
 * @class List
 * @extends React.Component
 */
export default class Crop extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      crop: {
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
      },
    };
  }

  renderCoords() {
    const { coordinates, topRightStyle, bottomLeftStyle } = this.props;
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

  render() {
    const {
      onClose,
      onChange,
      onDragStop,
      maxWidth,
      maxHeight,
      showCoordinates,
      keepSelection,
      zIndex,
    } = this.props;
    const { crop } = this.state;
    return (
      <Portal node={document && document.getElementById('wv-content')}>
        {showCoordinates ? this.renderCoords() : ''}
        <Cropper
          crop={crop}
          src={TRANSPARENT_GIF}
          style={{
            background:
              crop.width && crop.height ? 'none' : 'rgba(0, 0, 0, 0.5)',
            zIndex,
          }}
          imageStyle={{
            width: maxWidth,
            height: maxHeight,
          }}
          keepSelection={keepSelection}
          onComplete={(crop) => {
            onDragStop(crop);
            if (!crop.width || !crop.height) {
              onClose();
            }
          }}
          onChange={(crop) => {
            this.setState({ crop });
            if (crop.width && crop.height) {
              onChange(crop);
            }
          }}
        />
      </Portal>
    );
  }
}
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
