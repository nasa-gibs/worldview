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
      isHoveredDrag: false,
    };

    this.selectDragger = this.selectDragger.bind(this);
    this.handleDragDragger = this.handleDragDragger.bind(this);
    this.startShowDraggerTime = this.startShowDraggerTime.bind(this);
    this.stopShowDraggerTime = this.stopShowDraggerTime.bind(this);
  }

  /**
  * @desc Select between A 'selected' or B 'selectedB'
  * @param {Event} mouse event
  * @returns {void}
  */
  selectDragger = (e) => {
    const { draggerName, selectDragger } = this.props;
    selectDragger(draggerName, e);
  };

  /**
  * @desc Handles deltaX changes on dragging
  * @param {Event} mouse event
  * @param {Object} draggable delta object
  * @returns {void}
  */
  handleDragDragger = (e, d) => {
    const { axisWidth, draggerPosition, handleDragDragger } = this.props;
    const { deltaX, x } = d;
    const draggerAtStart = x <= -15;
    const draggerAtEnd = x + 36 >= axisWidth;

    const draggerWidth = 49;
    const leftAxisEdgeCutoff = -15;
    const rightAxisEdgeCutoff = draggerWidth + 36;

    const isDraggerLeftOfAxisBuffer = draggerPosition <= leftAxisEdgeCutoff;
    const isDraggerRightOfAxisBuffer = draggerPosition + rightAxisEdgeCutoff >= axisWidth;

    this.setState({
      isHoveredDragging: true,
    });

    // if dragger is positioned near axis edge from panning axis vs. dragging dragger
    if (isDraggerLeftOfAxisBuffer || isDraggerRightOfAxisBuffer) {
      handleDragDragger(e, d);
    }
    // if at start or end of axis, return false to stop dragger
    // which will initiate an axis update towards that drag direction
    if (deltaX < 0 && draggerAtStart) {
      return false;
    } if (deltaX > 0 && draggerAtEnd) {
      return false;
    }
    handleDragDragger(e, d);
  };

  /**
  * @desc Show dragger tooltip on start dragging
  * @returns {void}
  */
  startShowDraggerTime = () => {
    const { toggleShowDraggerTime } = this.props;
    toggleShowDraggerTime(true);
  };

  /**
  * @desc Hide dragger tooltip on stop dragging
  * @returns {void}
  */
  stopShowDraggerTime = () => {
    const { toggleShowDraggerTime } = this.props;
    this.setState({
      isHoveredDragging: false,
    });
    toggleShowDraggerTime(false);
  };

  /**
  * @desc Handle dragger hover mouseEnter for background color fill
  * @returns {void}
  */
  handleHoverMouseEnter = () => {
    this.setState({
      isHoveredDrag: true,
    });
  };

  /**
  * @desc Handle dragger hover mouseLeave for background color fill
  * @returns {void}
  */
  handleHoverMouseLeave = () => {
    this.setState({
      isHoveredDrag: false,
    });
  };

  render() {
    const {
      transformX,
      draggerPosition,
      draggerVisible,
      draggerName,
      isCompareModeActive,
      disabled,
    } = this.props;
    const {
      isHoveredDrag,
      isHoveredDragging,
    } = this.state;
    // handle isHovered that may include a mouse up event while not hovered over dragger
    const isHovered = !isHoveredDrag && !isHoveredDragging
      ? false
      : isHoveredDrag || isHoveredDragging;
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

    const draggerStroke = isHovered
      ? '#ccc'
      : '#333';
    const draggerRectFill = isHovered
      ? '#ccc'
      : '#515151';
    const draggerLetter = draggerName === 'selected'
      ? 'A'
      : 'B';
    return (
      draggerVisible
        ? (
          <Draggable
            axis="x"
            onMouseDown={this.selectDragger}
            onDrag={this.handleDragDragger}
            position={{ x: draggerPosition + 25, y: 0 }}
            onStart={this.startShowDraggerTime}
            onStop={this.stopShowDraggerTime}
            disabled={disabled}
          >
            <g
              style={{
                cursor: 'pointer',
              }}
              className={`timeline-dragger dragger${draggerLetter}`}
              transform={`translate(${transformX})`}
              onMouseEnter={this.handleHoverMouseEnter}
              onMouseLeave={this.handleHoverMouseLeave}
              clipPath={`url(#selectedDraggerClip${draggerLetter})`}
            >
              <path
                fill={draggerFill}
                stroke={draggerStroke}
                strokeWidth="1px"
                d="M5.706 47.781
              C2.77 47.781.39 45.402.39 42.467
              v-16.592
              l11.391-12.255 11.391-12.255 11.391 12.255 11.391 12.255
              v16.592
              c0 2.935-2.38 5.314-5.316 5.314
              h-34.932z"
              />
              {isCompareModeActive
                ? (
                  <text
                    fontSize="26px"
                    fontWeight="400"
                    x="14"
                    y="37"
                    fill={disabled ? '#ccc' : '#000'}
                    textRendering="optimizeLegibility"
                  >
                    {draggerLetter}
                  </text>
                )
                : (
                  <>
                    <rect
                      pointerEvents="none"
                      fill={draggerRectFill}
                      width="3"
                      height="20"
                      x="15"
                      y="18"
                    />
                    <rect
                      pointerEvents="none"
                      fill={draggerRectFill}
                      width="3"
                      height="20"
                      x="21"
                      y="18"
                    />
                    <rect
                      pointerEvents="none"
                      fill={draggerRectFill}
                      width="3"
                      height="20"
                      x="27"
                      y="18"
                    />
                  </>
                )}
            </g>
          </Draggable>
        )
        : null
    );
  }
}

Dragger.propTypes = {
  axisWidth: PropTypes.number,
  disabled: PropTypes.bool,
  draggerName: PropTypes.string,
  draggerPosition: PropTypes.number,
  draggerVisible: PropTypes.bool,
  handleDragDragger: PropTypes.func,
  isCompareModeActive: PropTypes.bool,
  selectDragger: PropTypes.func,
  toggleShowDraggerTime: PropTypes.func,
  transformX: PropTypes.number,
};

export default Dragger;
