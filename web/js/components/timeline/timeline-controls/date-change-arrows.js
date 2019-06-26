import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

const ANIMATION_DELAY = 500;

class DateChangeArrows extends PureComponent {
  constructor(props) {
    super(props);
    this.leftInterval = 0;
    this.rightInterval = 0;
  }
  /**
  * @desc repeatedly call while mouse down - decrement date
  * @returns {void}
  */
  leftArrowDown = () => {
    this.props.leftArrowDown();
    this.leftInterval = setTimeout(this.leftArrowDown, ANIMATION_DELAY);
  }
  /**
  * @desc repeatedly call while mouse down - decrement date
  * @returns {void}
  */
  rightArrowDown = () => {
    this.props.rightArrowDown();
    this.rightInterval = setTimeout(this.rightArrowDown, ANIMATION_DELAY);
  }
  /**
  * @desc stop animation from left arrow - clear timeout invocation
  * @returns {void}
  */
  leftArrowUp = () => {
    clearTimeout(this.leftInterval);
    this.props.leftArrowUp();
  }
  /**
  * @desc stop animation from right arrow - clear timeout invocation
  * @returns {void}
  */
  rightArrowUp = () => {
    clearTimeout(this.rightInterval);
    this.props.rightArrowUp();
  }

  render() {
    let {
      leftArrowDisabled,
      rightArrowDisabled
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
          <svg id="timeline-svg" width="24" height="30">
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
  rightArrowUp: PropTypes.func
};

export default DateChangeArrows;
