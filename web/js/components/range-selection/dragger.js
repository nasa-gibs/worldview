import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import lodashRound from 'lodash/round';

/*
 * A react component, is a draggable svg
 * group
 *
 * @class Dragger
 * @extends React.Component
 */
class Dragger extends PureComponent {
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
    const {
      draggerID, width, color, height,
    } = this.props;
    const { backgroundColor } = this.state;
    return (
      <>
        <rect
          width={width}
          height={52}
          style={{
            fill: color,
            visibility,
          }}
        />
        {/*
         * this polygon element builds a triangle
         * based on the width and height of the
         * rectangle element
         */}
        <polygon
          points={`0,0,${height / 1.5},0 ${height / 3}, ${height / 1.5}`}
          transform={`translate(${-width * 2.45}, ${-height / 2})`}
          id={draggerID}
          style={{
            fill: backgroundColor,
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
    const {
      color, height, width, path,
    } = this.props;
    return (
      <>
        <path
          style={{
            fill: color || null,
            visibility,
          }}
          d={path}
          transform={`translate(${-width / 2}, ${-height / 4})`}
        />
        {this.getText(-5, lodashRound(height / 6, 4))}
      </>
    );
  }

  /**
   * Return visibility style string
   */
  getVisibility() {
    const { position, max } = this.state;
    let visibility = 'visible';
    if (position < 0 || position > max) {
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
    const { text } = this.props;
    const { textColor } = this.state;
    const visibility = this.getVisibility();
    if (text) {
      return (
        <text
          x={x}
          y={y}
          alignmentBaseline="middle"
          textAnchor="middle"
          style={{
            fill: textColor || null,
            visibility: visibility || null,
          }}
        >
          {text}
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
    const { onDrag, id } = this.props;
    e.stopPropagation();
    e.preventDefault();
    const deltaX = e.movementX || d.deltaX;
    onDrag(d.deltaX, id, d.x);
    this.setState((prevState) => ({
      position: prevState.position + deltaX,
    }));
  }

  /*
   * @method render
   */
  render() {
    const visibility = this.getVisibility();
    const {
      id, path, onStop, yOffset,
    } = this.props;
    const { position } = this.state;
    return (
      <Draggable
        onDrag={this.handleDrag}
        position={{ x: position, y: yOffset }}
        onStop={() => {
          onStop(id, position);
        }}
        axis="x"
      >
        <g>
          {!path
            ? this.getDefaultDragger(visibility)
            : this.getCustomDragger(visibility)}
        </g>
      </Draggable>
    );
  }
}
Dragger.defaultProps = {
  color: '#fff',
  height: 45,
  path: null,
  position: 0,
  textColor: '#000',
  width: 5,
  yOffset: 23,
};

Dragger.propTypes = {
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

export default Dragger;
