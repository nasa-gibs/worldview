import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

const ANIMATION_DELAY = 200; // interval firing to trigger parent level arrow change
const CLICK_TIMEOUT_DELAY = 500; // wait before click becomes a delay

let mouseHoldCheckTimer = null;
let isMouseHolding = false;
// left/right arrow intervals
const intervals = {
  left: 0,
  right: 0,
};

class DateChangeArrows extends PureComponent {
  componentWillUnmount() {
    clearInterval(intervals.left);
    clearInterval(intervals.right);
  }

  /**
  * @desc repeatedly call while mouse down - decrement date
  * @returns {void}
  */
  leftArrowDown = () => {
    const { leftArrowDown } = this.props;
    leftArrowDown();
    mouseHoldCheckTimer = setTimeout(() => {
      mouseHoldCheckTimer = null;
      isMouseHolding = true;
      // set interval for holding arrow down
      intervals.left = setInterval(leftArrowDown, ANIMATION_DELAY);
    }, CLICK_TIMEOUT_DELAY);
  }

  /**
  * @desc repeatedly call while mouse down - decrement date
  * @returns {void}
  */
  rightArrowDown = () => {
    const { rightArrowDown } = this.props;
    rightArrowDown();
    mouseHoldCheckTimer = setTimeout(() => {
      mouseHoldCheckTimer = null;
      isMouseHolding = true;
      // set interval for holding arrow down
      intervals.right = setInterval(rightArrowDown, ANIMATION_DELAY);
    }, CLICK_TIMEOUT_DELAY);
  }

  /**
  * @desc stop animation from left arrow - clear timeout invocation
  * @returns {void}
  */
  leftArrowUp = () => {
    const { leftArrowUp } = this.props;
    if (mouseHoldCheckTimer) {
      clearTimeout(mouseHoldCheckTimer);
    } else if (isMouseHolding) {
      isMouseHolding = false;
    }
    clearInterval(intervals.left);
    leftArrowUp();
  }

  /**
  * @desc stop animation from right arrow - clear timeout invocation
  * @returns {void}
  */
  rightArrowUp = () => {
    const { rightArrowUp } = this.props;
    if (mouseHoldCheckTimer) {
      clearTimeout(mouseHoldCheckTimer);
    } else if (isMouseHolding) {
      isMouseHolding = false;
    }
    clearInterval(intervals.right);
    rightArrowUp();
  }

  render() {
    const {
      leftArrowDisabled,
      rightArrowDisabled,
    } = this.props;
    return (
      <div>
        {/* LEFT ARROW */}
        <div
          className={`button-action-group ${leftArrowDisabled ? 'button-disabled' : ''}`}
          id="left-arrow-group"
          title="Click and hold to animate backwards"
          onMouseDown={this.leftArrowDown}
          onMouseUp={this.leftArrowUp}
          onMouseLeave={this.leftArrowUp}
        >
          <svg width="24" height="30">
            <path
              d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
              className="arrow"
            />
          </svg>
        </div>

        {/* RIGHT ARROW */}
        <div
          className={`button-action-group ${rightArrowDisabled ? 'button-disabled' : ''}`}
          id="right-arrow-group"
          title="Click and hold to animate forwards"
          onMouseDown={this.rightArrowDown}
          onMouseUp={this.rightArrowUp}
          onMouseLeave={this.rightArrowUp}
        >
          <svg width="24" height="30">
            <path
              d="M 10.240764,0 24,15 10.240764,30 0,30 13.759236,15 0,0 10.240764,0 z"
              className="arrow"
            />
          </svg>
        </div>
      </div>
    );
  }
}

DateChangeArrows.propTypes = {
  leftArrowDisabled: PropTypes.bool,
  leftArrowDown: PropTypes.func,
  leftArrowUp: PropTypes.func,
  rightArrowDisabled: PropTypes.bool,
  rightArrowDown: PropTypes.func,
  rightArrowUp: PropTypes.func,
};

export default DateChangeArrows;
