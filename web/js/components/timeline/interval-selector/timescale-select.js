import React, { PureComponent } from 'react';

class TimeScaleSelect extends PureComponent {
  handleChangeZoomLevel = (e) => {
    let zoomLevel = e.target.value;
    this.props.changeZoomLevel(zoomLevel);
  }

  handleSubmit = (e) => {
    e.preventDefault();
  }

  render() {
    console.log(this.props.hasSubdailyLayers)
    return (
      <form className="interval-timescale-select" onSubmit={this.handleSubmit}>
        <label>
          <select value={this.props.zoomLevel} onChange={this.handleChangeZoomLevel}>
            <option value="year">year</option>
            <option value="month">month</option>
            <option value="day">day</option>
            {this.props.hasSubdailyLayers ?
            <React.Fragment>
              <option value="hour">hour</option>
              <option value="minute">minute</option>
            </React.Fragment>
            :
              null
            }
          </select>
        </label>
      </form>
    );
  }
}

export default TimeScaleSelect;
