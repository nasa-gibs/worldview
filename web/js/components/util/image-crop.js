import React from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-image-crop';
import { Portal } from 'react-portal';

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
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height
    };
  }
  render() {
    return (
      <Portal node={document && document.getElementById('wv-map')}>
        <Cropper
          crop={this.state}
          src={null}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            background: 'none'
          }}
          onChange={crop => {
            this.setState({ crop });
          }}
        />
      </Portal>
    );
  }
}
Crop.defaultProps = {
  x: 20,
  y: 10,
  width: 30,
  height: 10
};
Crop.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number
};
