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
      hasSubdailyLayers
    } = this.props;
    return (
      <form
        className="interval-timescale-select-form-container"
        onSubmit={this.handleSubmit}
      >
        <select
          className="interval-timescale-select"
          value={zoomLevel}
          onChange={this.handleChangeZoomLevel}
        >
          <option className="interval-timescale-select-option" value="year">year</option>
          <option className="interval-timescale-select-option" value="month">month</option>
          <option className="interval-timescale-select-option" value="day">day</option>
          {hasSubdailyLayers
            ? <React.Fragment>
              <option className="interval-timescale-select-option" value="hour">hour</option>
              <option className="interval-timescale-select-option" value="minute">minute</option>
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
  hasSubdailyLayers: PropTypes.bool,
  zoomLevel: PropTypes.string
};

export default TimeScaleSelect;
