import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class DateChangeArrows extends PureComponent {
  render() {
    let {
      leftArrowDisabled,
      leftArrowDown,
      leftArrowUp,
      rightArrowDisabled,
      rightArrowDown,
      rightArrowUp
    } = this.props;
    return (
      <div>
        {/* LEFT ARROW */}
        <div
          className={`button-action-group ${leftArrowDisabled ? 'button-disabled' : ''}`}
          id="left-arrow-group"
          title="Click and hold to animate backwards"
          onMouseDown={leftArrowDown}
          onMouseUp={leftArrowUp}
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
          onMouseDown={rightArrowDown}
          onMouseUp={rightArrowUp}
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
