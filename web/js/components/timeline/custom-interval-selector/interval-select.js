import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * TimeScaleSelect for Custom Interval Selector
 * group. It is a child component.
 *
 * @class TimeScaleSelect
 */
class TimeScaleSelect extends PureComponent {
  handleChangeZoomLevel = (e) => {
    let zoomLevel = e.target.value;
    this.props.changeZoomLevel(zoomLevel);
  }

  handleSubmit = (e) => {
    e.preventDefault();
  }

  render() {
    let {
      zoomLevel,
      subDailyMode
    } = this.props;
    return (
      <form
        className="custom-interval-timescale-select-form-container"
        onSubmit={this.handleSubmit}
      >
        <select
          className="custom-interval-timescale-select"
          value={zoomLevel}
          onChange={this.handleChangeZoomLevel}
        >
          <option className="custom-interval-timescale-select-option" value="year">year</option>
          <option className="custom-interval-timescale-select-option" value="month">month</option>
          <option className="custom-interval-timescale-select-option" value="day">day</option>
          {subDailyMode
            ? <React.Fragment>
              <option className="custom-interval-timescale-select-option" value="hour">hour</option>
              <option className="custom-interval-timescale-select-option" value="minute">minute</option>
            </React.Fragment>
            : null
          }
        </select>
      </form>
    );
  }
}

TimeScaleSelect.propTypes = {
  changeZoomLevel: PropTypes.func,
  subDailyMode: PropTypes.bool,
  zoomLevel: PropTypes.string
};

export default TimeScaleSelect;
