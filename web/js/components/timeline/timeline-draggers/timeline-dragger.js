import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

/*
 * Draggers used in default and A/B comparison
 *
 * @class Dragger
 * @extends PureComponent
 */
class Dragger extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isHoveredDragging: false,
      isHoveredDrag: false
    };

    this.selectDragger = this.selectDragger.bind(this);
    this.handleDragDragger = this.handleDragDragger.bind(this);
    this.startShowDraggerTime = this.startShowDraggerTime.bind(this);
    this.stopShowDraggerTime = this.stopShowDraggerTime.bind(this);
  };

  /**
  * @desc Select between A 'selected' or B 'selectedB'
  * @param {Event} mouse event
  * @returns {void}
  */
  selectDragger = (e) => {
    this.props.selectDragger(this.props.draggerName, e);
  };

  /**
  * @desc Handles deltaX changes on dragging
  * @param {Event} mouse event
  * @param {Object} draggable delta object
  * @returns {void}
  */
  handleDragDragger = (e, d) => {
    this.setState({
      isHoveredDragging: true
    });
    this.props.handleDragDragger(e, d);
  };

  /**
  * @desc Show dragger tooltip on start dragging
  * @returns {void}
  */
  startShowDraggerTime = () => {
    this.props.toggleShowDraggerTime(true);
  };

  /**
  * @desc Hide dragger tooltip on stop dragging
  * @returns {void}
  */
  stopShowDraggerTime = () => {
    this.setState({
      isHoveredDragging: false
    });
    this.props.toggleShowDraggerTime(false);
  };

  /**
  * @desc Handle dragger hover mouseEnter for background color fill
  * @returns {void}
  */
  handleHoverMouseEnter = () => {
    this.setState({
      isHoveredDrag: true
    });
  };

  /**
  * @desc Handle dragger hover mouseLeave for background color fill
  * @returns {void}
  */
  handleHoverMouseLeave = () => {
    this.setState({
      isHoveredDrag: false
    });
  };

  render() {
    let {
      transformX,
      draggerPosition,
      draggerVisible,
      draggerName,
      isCompareModeActive,
      disabled
    } = this.props;
    let {
      isHoveredDrag,
      isHoveredDragging
    } = this.state;
    // handle isHovered that may include a mouse up event while not hovered over dragger
    const isHovered = !isHoveredDrag && !isHoveredDragging ? false : isHoveredDrag || isHoveredDragging;
    // handle fill for hover vs non-hover and slightly different A/B draggers
    const draggerFill = disabled
      ? isHovered
        ? '#8e8e8e'
        : '#666666'
      : isHovered
        ? isCompareModeActive
          ? '#a3a3a3'
          : '#8e8e8e'
        : '#ccc';
    return (
      draggerVisible
        ? <Draggable
          axis='x'
          onMouseDown={this.selectDragger}
          onDrag={this.handleDragDragger}
          position={{ x: draggerPosition - 12, y: 0 }}
          onStart={this.startShowDraggerTime}
          onStop={this.stopShowDraggerTime}
          disabled={disabled}
        >
          <g
            style={{
              cursor: 'pointer',
              display: draggerVisible ? 'block' : 'none'
            }}
            className={`timeline-dragger dragger${draggerName === 'selected' ? 'A' : 'B'}`}
            transform={`translate(${transformX}, 0)`}
            onMouseEnter={this.handleHoverMouseEnter}
            onMouseLeave={this.handleHoverMouseLeave}
          >
            <polygon
              fill={draggerFill}
              stroke={isHovered ? '#ccc' : '#333'}
              strokeWidth='1px'
              points='60,20, 90,65, 30,65'>
            </polygon>
            {isCompareModeActive
              ? <text
                fontSize='30px'
                fontWeight='400'
                x='11'
                y='48'
                fill={disabled ? '#ccc' : '#000'}
                transform='translate(39, 10)'
                textRendering='optimizeLegibility'
                clipPath='url(#textDisplay)'>
                {draggerName === 'selected' ? 'A' : 'B'}
              </text>
              : <React.Fragment>
                <rect
                  pointerEvents='none' fill={isHovered ? '#ccc' : '#515151'}
                  width='3' height='20' x='52' y='39'></rect>
                <rect pointerEvents='none' fill={isHovered ? '#ccc' : '#515151'}
                  width='3' height='20' x='58' y='39'></rect>
                <rect pointerEvents='none' fill={isHovered ? '#ccc' : '#515151'}
                  width='3' height='20' x='64' y='39'></rect>
              </React.Fragment>
            }
          </g>
        </Draggable>
        : null
    );
  }
}

Dragger.propTypes = {
  disabled: PropTypes.bool,
  draggerName: PropTypes.string,
  draggerPosition: PropTypes.number,
  draggerVisible: PropTypes.bool,
  handleDragDragger: PropTypes.func,
  isCompareModeActive: PropTypes.bool,
  selectDragger: PropTypes.func,
  toggleShowDraggerTime: PropTypes.func,
  transformX: PropTypes.number
};

export default Dragger;
