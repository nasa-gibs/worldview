import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * TimeScaleSelect for Custom Interval Selector
 * group. It is a child component.
 *
 * @class TimeScaleSelect
 */
class IntervalSelect extends PureComponent {
  handleChangeZoomLevel = (e) => {
    const { changeZoomLevel } = this.props;
    const zoomLevel = e.target.value;
    changeZoomLevel(zoomLevel);
  }

  handleSubmit = (e) => {
    e.preventDefault();
  }

  render() {
    const {
      zoomLevel,
      hasSubdailyLayers,
    } = this.props;
    return (
      <form
        className="custom-interval-timescale-select-form-container no-drag"
        onSubmit={this.handleSubmit}
      >
        <select
          className="custom-interval-timescale-select no-drag"
          value={zoomLevel}
          onChange={this.handleChangeZoomLevel}
        >
          <option className="custom-interval-timescale-select-option no-drag" value="year">year</option>
          <option className="custom-interval-timescale-select-option no-drag" value="month">month</option>
          <option className="custom-interval-timescale-select-option no-drag" value="day">day</option>
          {hasSubdailyLayers
            ? (
              <>
                <option className="custom-interval-timescale-select-option no-drag" value="hour">hour</option>
                <option className="custom-interval-timescale-select-option no-drag" value="minute">minute</option>
              </>
            )
            : null}
        </select>
      </form>
    );
  }
}

IntervalSelect.propTypes = {
  changeZoomLevel: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  zoomLevel: PropTypes.string,
};

export default IntervalSelect;
