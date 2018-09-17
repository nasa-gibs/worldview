import React from 'react';
import PropTypes from 'prop-types';
import DateInputColumn from './input';
import util from '../../util/util';

/*
 * A react component, is a draggable svg
 * group. It is a parent component that
 * rerenders when child elements are dragged
 *
 * @class TimelineRangeSelector
 */
class DateSelector extends React.Component {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      date: props.date,
      maxDate: props.maxDate,
      minDate: props.minDate,
      tab: null,
      maxZoom: props.maxZoom
    };
  }
  componentWillReceiveProps(props) {
    this.setState({
      date: props.date,
      maxDate: props.maxDate,
      minDate: props.minDate,
      maxZoom: props.maxZoom
    });
  }
  blur() {
    this.setState({ tab: null });
  }
  setFocusedTab(tab) {
    this.setState({ tab: tab });
  }
  changeTab(index) {
    var nextTab = index;
    var maxTab;
    if (this.state.maxZoom >= 4) {
      maxTab = 5;
    } else {
      maxTab = 3;
    }
    if (index > this.state.tab) {
      // past max tab
      if (index > maxTab) {
        nextTab = 1;
      }
    } else {
      // below min tab
      if (index < 1) {
        nextTab = maxTab;
      }
    }
    this.setState({
      tab: nextTab
    });
  }
  updateDate(date) {
    this.setState({
      date: date
    });
    this.props.onDateChange(date, this.props.id);
  }
  renderSubdaily() {
    if (this.state.maxZoom >= 4) {
      return (
        <React.Fragment>
          <DateInputColumn
            step={1}
            startDate={new Date(2000)}
            today={new Date()}
            date={this.state.date}
            type="hour"
            inputId={this.props.idSuffix ? 'hour-' + this.props.idSuffix : ''}
            height={this.props.height}
            width={this.props.width}
            updateDate={this.updateDate.bind(this)}
            value={util.pad(this.state.date.getUTCHours(), 2, '0')}
            tabIndex={4}
            focused={this.state.tab === 4}
            setFocusedTab={this.setFocusedTab.bind(this)}
            changeTab={this.changeTab.bind(this)}
            maxDate={this.props.maxDate}
            minDate={this.props.minDate}
            blur={this.blur.bind(this)}
            fontSize={this.props.fontSize}
          />
          <div className="input-time-divider">:</div>
          <DateInputColumn
            step={10}
            startDate={new Date(2000)}
            today={new Date()}
            date={this.state.date}
            type="minute"
            height={this.props.height}
            width={this.props.width}
            updateDate={this.updateDate.bind(this)}
            value={util.pad(this.state.date.getUTCMinutes(), 2, '0')}
            inputId={this.props.idSuffix ? 'minute-' + this.props.idSuffix : ''}
            tabIndex={5}
            focused={this.state.tab === 5}
            setFocusedTab={this.setFocusedTab.bind(this)}
            changeTab={this.changeTab.bind(this)}
            maxDate={this.props.maxDate}
            minDate={this.props.minDate}
            blur={this.blur.bind(this)}
            fontSize={this.props.fontSize}
          />
          <div className="input-time-zmark">Z</div>
        </React.Fragment>
      );
    }
  }
  render() {
    return (
      <div className="wv-date-selector-widget">
        <DateInputColumn
          step={1}
          startDate={new Date(2000)}
          today={new Date()}
          date={this.state.date}
          value={this.state.date.getUTCFullYear()}
          type="year"
          height={this.props.height}
          width={this.props.width}
          updateDate={this.updateDate.bind(this)}
          inputId={this.props.idSuffix ? 'year-' + this.props.idSuffix : ''}
          tabIndex={1}
          focused={this.state.tab === 1}
          setFocusedTab={this.setFocusedTab.bind(this)}
          changeTab={this.changeTab.bind(this)}
          maxDate={this.props.maxDate}
          minDate={this.props.minDate}
          blur={this.blur.bind(this)}
          fontSize={this.props.fontSize}
        />
        <DateInputColumn
          step={1}
          startDate={new Date(2000)}
          today={new Date()}
          date={this.state.date}
          value={util.monthStringArray[this.state.date.getUTCMonth()]}
          type="month"
          inputId={this.props.idSuffix ? 'month-' + this.props.idSuffix : ''}
          height={this.props.height}
          width={this.props.width}
          updateDate={this.updateDate.bind(this)}
          tabIndex={2}
          focused={this.state.tab === 2}
          setFocusedTab={this.setFocusedTab.bind(this)}
          changeTab={this.changeTab.bind(this)}
          maxDate={this.props.maxDate}
          minDate={this.props.minDate}
          blur={this.blur.bind(this)}
          fontSize={this.props.fontSize}
        />
        <DateInputColumn
          step={1}
          startDate={new Date(2000)}
          today={new Date()}
          date={this.state.date}
          type="day"
          height={this.props.height}
          width={this.props.width}
          updateDate={this.updateDate.bind(this)}
          value={util.pad(this.state.date.getUTCDate(), 2, '0')}
          tabIndex={3}
          inputId={this.props.idSuffix ? 'day-' + this.props.idSuffix : ''}
          focused={this.state.tab === 3}
          setFocusedTab={this.setFocusedTab.bind(this)}
          changeTab={this.changeTab.bind(this)}
          maxDate={this.props.maxDate}
          minDate={this.props.minDate}
          blur={this.blur.bind(this)}
          fontSize={this.props.fontSize}
        />
        {this.renderSubdaily()}
      </div>
    );
  }
}
DateSelector.defaultProps = {
  fontSize: 15
};
DateSelector.propTypes = {
  date: PropTypes.object,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  maxZoom: PropTypes.number,
  onDateChange: PropTypes.func,
  id: PropTypes.string,
  height: PropTypes.string,
  width: PropTypes.string,
  idSuffix: PropTypes.string,
  fontSize: PropTypes.number
};

export default DateSelector;
