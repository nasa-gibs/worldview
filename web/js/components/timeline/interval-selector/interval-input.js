import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * A react component, is a draggable svg
 * group. It is a parent component that
 * rerenders when child elements are dragged
 *
 * @class TimelineRangeSelector
 */
class IntervalInput extends PureComponent {
  onKeyInput = (e) => {
    const regex = /^[0-9\b]+$/;
    const value = e.target.value;
    if (value === '' || regex.test(value)) {
      this.props.changeInterval(Number(value));
    }
  }
  onClickUp = () => {
    let value = this.props.intervalValue;
    if (value < 1000) {
      this.props.changeInterval(value + 1);
    }
  }

  onClickDown = () => {
    let value = this.props.intervalValue;
    if (value > 1) {
      this.props.changeInterval(value - 1);
    }
  }
  render() {
    return (
      <div className="date-arrow-wrapper">
        <div
          onClick={this.onClickUp}
          className="date-arrows date-arrow-up"
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="uparrow" />
          </svg>
        </div>
        <input className="interval-input" type="text"
          min="1" step="1" value={this.props.intervalValue}
          onChange={this.onKeyInput} />
        <div
          onClick={this.onClickDown}
          className="date-arrows date-arrow-down"
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="downarrow" />
          </svg>
        </div>
      </div>

    );
  }
}

IntervalInput.propTypes = {
  intervalValue: PropTypes.number,
  changeInterval: PropTypes.func
};

export default IntervalInput;
