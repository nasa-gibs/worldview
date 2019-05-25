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
    let { zoomLevel, hasSubdailyLayers } = this.props;
    return (
      <form className="interval-timescale-select" onSubmit={this.handleSubmit}>
        <label>
          <select value={zoomLevel} onChange={this.handleChangeZoomLevel}>
            <option value="year">year</option>
            <option value="month">month</option>
            <option value="day">day</option>
            {hasSubdailyLayers
              ? <React.Fragment>
                <option value="hour">hour</option>
                <option value="minute">minute</option>
              </React.Fragment>
              : null
            }
          </select>
        </label>
      </form>
    );
  }
}

TimeScaleSelect.propTypes = {
  changeZoomLevel: PropTypes.func,
  zoomLevel: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool
};

export default TimeScaleSelect;
