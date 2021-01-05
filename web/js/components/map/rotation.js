import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { saveRotation } from '../../map/util';

const duration = 500;

class Rotation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      intervalId: null,
    };
    this.rotateOnClick = this.rotateOnClick.bind(this);
    this.clearInterval = this.clearInterval.bind(this);
    this.resetRotation = this.resetRotation.bind(this);
  }

  componentDidUpdate() {
    // const { rotatation } = this.props;

    // Clear interval if being reset?
  }

  clearInterval() {
    const { intervalId } = this.state;
    clearInterval(intervalId);
  }

  /**
   *
   * @param {*} radians
   */
  rotate(radians) {
    const { map, updateRotationState } = this.props;
    const mapView = map.ui.selected.getView();
    const currentDeg = mapView.getRotation() * (180.0 / Math.PI);
    saveRotation(currentDeg, mapView);
    mapView.animate({
      rotation: mapView.getRotation() - Math.PI / radians,
      duration,
    });
    updateRotationState(radians);
  }

  /**
   * @param {*} radians
   */
  rotateOnClick = (radians) => {
    const newIntervalId = setInterval(() => {
      this.rotate(radians);
    }, duration);
    this.rotate(radians);
    this.setState({ intervalId: newIntervalId });
  };

  resetRotation() {
    const { map } = this.props;
    this.clearInterval();
    map.ui.selected.getView().animate({
      duration: 500,
      rotation: 0,
    });
  }

  render() {
    const { rotation, proj } = this.props;
    const currentRotation = Number(rotation * (180 / Math.PI)).toFixed();

    return proj.id !== 'geographic' && proj.id !== 'webmerc' && (
      <>
        <button
          type="button"
          className="wv-map-rotate-left wv-map-zoom ui-button ui-corner-all ui-widget"
          title="You may also rotate by holding Alt and dragging the mouse"
          onMouseDown={() => { this.rotateOnClick(10); }}
          onMouseUp={this.clearInterval}
          onMouseOut={this.clearInterval}
          onMouseMove={(e) => { e.stopPropagation(); }}
        >
          <FontAwesomeIcon icon="undo" className="cursor-pointer" />
        </button>

        <button
          type="button"
          className="wv-map-reset-rotation wv-map-zoom ui-button ui-corner-all ui-widget"
          title="Reset rotation"
          onMouseDown={this.resetRotation}
          onMouseUp={this.clearInterval}
          onMouseOut={this.clearInterval}
          onMouseMove={(e) => { e.stopPropagation(); }}
        >
          {currentRotation}
        </button>

        <button
          type="button"
          className="wv-map-rotate-right wv-map-zoom ui-button ui-corner-all ui-widget"
          title="You may also rotate by holding Alt and dragging the mouse"
          onMouseDown={() => { this.rotateOnClick(-10); }}
          onMouseUp={this.clearInterval}
          onMouseOut={this.clearInterval}
          onMouseMove={(e) => { e.stopPropagation(); }}
        >
          <FontAwesomeIcon icon="redo" className="cursor-pointer" />
        </button>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const { map, proj } = state;
  return {
    map,
    proj,
    rotation: map.rotation,
  };
};

const mapDispatchToProps = (dispatch) => ({
  updateRotationState: debounce((radians) => {
    dispatch({
      type: 'MAP/UPDATE_ROTATION',
      rotation: radians,
    });
  }, 100),
});

Rotation.propTypes = {
  map: PropTypes.object,
  rotation: PropTypes.number,
  proj: PropTypes.object,
  updateRotationState: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Rotation);
