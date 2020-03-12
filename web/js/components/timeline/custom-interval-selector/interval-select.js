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
    const zoomLevel = e.target.value;
    this.props.changeZoomLevel(zoomLevel);
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
          {hasSubdailyLayers
            ? (
              <>
                <option className="custom-interval-timescale-select-option" value="hour">hour</option>
                <option className="custom-interval-timescale-select-option" value="minute">minute</option>
              </>
            )
            : null}
        </select>
      </form>
    );
  }
}

TimeScaleSelect.propTypes = {
  changeZoomLevel: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  zoomLevel: PropTypes.string,
};

export default TimeScaleSelect;
