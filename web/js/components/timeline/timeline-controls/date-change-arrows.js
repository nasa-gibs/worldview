import React, { PureComponent } from 'react';

class DateChangeArrows extends PureComponent {
  render() {
    return (
      <div>
        {/* LEFT ARROW */}
        <div
          className={`button-action-group ${this.props.leftArrowDisabled ? 'button-disabled' : ''}`}
          id="left-arrow-group"
          title="Click and hold to animate backwards"
          onMouseDown={this.props.leftArrowDown}
          onMouseUp={this.props.leftArrowUp}
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
          className={`button-action-group ${this.props.rightArrowDisabled ? 'button-disabled' : ''}`}
          id="right-arrow-group"
          title="Click and hold to animate forwards"
          onMouseDown={this.props.rightArrowDown}
          onMouseUp={this.props.rightArrowUp}
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

export default DateChangeArrows;
