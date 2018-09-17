import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import lodashRound from 'lodash/round';

/*
 * A react component, is a draggable svg
 * group
 *
 * @class TimelineDragger
 * @extends React.Component
 */
class TimelineDragger extends React.Component {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      position: props.position,
      backgroundColor: props.backgroundColor,
      textColor: props.textColor,
      max: props.max
    };
  }
  /**
   * Update state if position has changed
   * @param {object} props
   */
  componentWillReceiveProps(props) {
    const { position, max } = this.state;
    if (props.position !== position) {
      this.setState({ position: props.position });
    }
    if (props.max !== max) {
      this.setState({ max: props.max });
    }
  }
  getDefaultDragger(visibility) {
    return (
      <React.Fragment>
        <rect
          width={this.props.width}
          height={this.props.height}
          style={{
            fill: this.props.color,
            visibility: visibility
          }}
        />
        {/*
              * this polygon element builds a triangle
              * based on the width and height of the
              * rectangle element
              */}
        <polygon
          points={
            '0,0,' +
            this.props.height / 1.5 +
            ',0 ' +
            this.props.height / 3 +
            ', ' +
            this.props.height / 1.5
          }
          transform={
            'translate(' +
            -this.props.width * 2.45 +
            ', ' +
            -this.props.height / 2 +
            ')'
          }
          id={this.props.draggerID}
          style={{
            fill: this.state.backgroundColor,
            visibility: visibility,
            stroke: '#000',
            cursor: 'pointer'
          }}
        />
        {this.getText(-1, -12, visibility)}
      </React.Fragment>
    );
  }
  /**
   * Get custom path object which is a
   * guitar pick in this case
   * @param {String} visibility
   * @returns JSX element
   */
  getCustomDragger(visibility) {
    return (
      <React.Fragment>
        <path
          style={{
            fill: this.props.color ? this.props.color : null,
            visibility: visibility
          }}
          d={this.props.path}
          transform={
            'translate(' +
            -this.props.width / 2 +
            ', ' +
            -this.props.height / 4 +
            ')'
          }
        />
        {this.getText(-5, lodashRound(this.props.height / 6, 4))}
      </React.Fragment>
    );
  }
  /**
   * Return visibility style string
   */
  getVisibility() {
    var visibility = 'visible';
    if (this.state.position < 0 || this.state.position > this.state.max) {
      visibility = 'hidden';
    }
    return visibility;
  }
  /**
   * Return text el to show over dragger
   * @param {number} x | x offset
   * @param {number} y | y offset
   */
  getText(x, y) {
    var visibility = this.getVisibility();
    if (this.props.text) {
      return (
        <text
          x={x}
          y={y}
          alignmentBaseline="middle"
          textAnchor="middle"
          style={{
            fill: this.state.textColor ? this.state.textColor : null,
            visibility: visibility || null
          }}
        >
          {this.props.text}
        </text>
      );
    }
  }
  /*
   * When the component is dragged,
   * this function passes the id
   * and change-in-x of the drag
   * to onDrag callback
   *
   * @method handleDrag
   *
   * @return {void}
   */
  handleDrag(e, d) {
    e.stopPropagation();
    e.preventDefault();
    var deltaX = e.movementX || d.deltaX;
    var position = this.state.position + deltaX;
    this.props.onDrag(d.deltaX, this.props.id, d.x);
    this.setState({ position: position });
  }

  /*
   * @method render
   */
  render() {
    var visibility = this.getVisibility();
    return (
      <Draggable
        onDrag={this.handleDrag.bind(this)}
        position={{ x: this.state.position, y: this.props.yOffset }}
        onStop={() => {
          this.props.onStop(this.props.id, this.state.position);
        }}
        axis="x"
      >
        <g>
          {!this.props.path
            ? this.getDefaultDragger(visibility)
            : this.getCustomDragger(visibility)}
        </g>
      </Draggable>
    );
  }
}
TimelineDragger.defaultProps = {
  visible: true,
  height: 45,
  width: 5,
  color: '#fff',
  position: 0,
  visibility: 'visible',
  yOffset: 0,
  path: null,
  textColor: '#000'
};

TimelineDragger.propTypes = {
  opacity: PropTypes.number,
  max: PropTypes.number,
  height: PropTypes.number,
  onDrag: PropTypes.func,
  onClick: PropTypes.func,
  color: PropTypes.string,
  position: PropTypes.number,
  id: PropTypes.string,
  onStop: PropTypes.func,
  width: PropTypes.number,
  backgroundColor: PropTypes.string,
  draggerID: PropTypes.string,
  yOffset: PropTypes.number,
  path: PropTypes.string,
  textColor: PropTypes.string,
  text: PropTypes.string,
  onMouseDown: PropTypes.func
};

export default TimelineDragger;
