import React, { PureComponent } from 'react';
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
class TimelineDragger extends PureComponent {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      position: props.position,
      backgroundColor: props.backgroundColor,
      textColor: props.textColor,
      max: props.max,
    };

    this.handleDrag = this.handleDrag.bind(this);
  }

  /**
   * Update state if position has changed
   * @param {object} props
   */
  UNSAFE_componentWillReceiveProps(props) {
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
      <>
        <rect
          width={this.props.width}
          height={52}
          style={{
            fill: this.props.color,
            visibility,
          }}
        />
        {/*
         * this polygon element builds a triangle
         * based on the width and height of the
         * rectangle element
         */}
        <polygon
          points={
            `0,0,${
              this.props.height / 1.5
            },0 ${
              this.props.height / 3
            }, ${
              this.props.height / 1.5}`
          }
          transform={
            `translate(${
              -this.props.width * 2.45
            }, ${
              -this.props.height / 2
            })`
          }
          id={this.props.draggerID}
          style={{
            fill: this.state.backgroundColor,
            visibility,
            stroke: '#000',
            cursor: 'pointer',
          }}
        />
        {this.getText(-1, -12, visibility)}
      </>
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
      <>
        <path
          style={{
            fill: this.props.color ? this.props.color : null,
            visibility,
          }}
          d={this.props.path}
          transform={
            `translate(${
              -this.props.width / 2
            }, ${
              -this.props.height / 4
            })`
          }
        />
        {this.getText(-5, lodashRound(this.props.height / 6, 4))}
      </>
    );
  }

  /**
   * Return visibility style string
   */
  getVisibility() {
    let visibility = 'visible';
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
    const visibility = this.getVisibility();
    if (this.props.text) {
      return (
        <text
          x={x}
          y={y}
          alignmentBaseline="middle"
          textAnchor="middle"
          style={{
            fill: this.state.textColor ? this.state.textColor : null,
            visibility: visibility || null,
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
    const deltaX = e.movementX || d.deltaX;
    const position = this.state.position + deltaX;
    this.props.onDrag(d.deltaX, this.props.id, d.x);
    this.setState({ position });
  }

  /*
   * @method render
   */
  render() {
    const visibility = this.getVisibility();
    return (
      <Draggable
        onDrag={this.handleDrag}
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
  color: '#fff',
  height: 45,
  path: null,
  position: 0,
  textColor: '#000',
  visibility: 'visible',
  visible: true,
  width: 5,
  yOffset: 23,
};

TimelineDragger.propTypes = {
  backgroundColor: PropTypes.string,
  color: PropTypes.string,
  draggerID: PropTypes.string,
  height: PropTypes.number,
  id: PropTypes.string,
  max: PropTypes.number,
  onDrag: PropTypes.func,
  onStop: PropTypes.func,
  path: PropTypes.string,
  position: PropTypes.number,
  text: PropTypes.string,
  textColor: PropTypes.string,
  width: PropTypes.number,
  yOffset: PropTypes.number,
};

export default TimelineDragger;
