import React, { Component } from 'react';
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
class DateSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: null
    };
    this.updateDate = this.updateDate.bind(this);
    this.setFocusedTab = this.setFocusedTab.bind(this);
    this.changeTab = this.changeTab.bind(this);
    this.blur = this.blur.bind(this);
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
    if (this.props.hasSubdailyLayers) {
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
  updateDate(date, type) {
    this.props.onDateChange(date, this.props.id);
  }
  shouldComponentUpdate(prevProps, prevState) {
    let {
      date,
      hasSubdailyLayers,
      maxDate,
      minDate
    } = this.props;

    let updateCheck = (
      this.state.tab === prevState.tab &&
      date.getTime() === prevProps.date.getTime() &&
      hasSubdailyLayers === prevProps.hasSubdailyLayers &&
      maxDate.getTime() === prevProps.maxDate.getTime() &&
      minDate.getTime() === prevProps.minDate.getTime()
    );
    if (updateCheck) {
      return false;
    }
    return true;
  }
  renderSubdaily() {
    const { date } = this.props;
    if (this.props.hasSubdailyLayers) {
      return (
        <React.Fragment>
          <DateInputColumn
            step={1}
            startDate={new Date(2000)}
            date={date}
            type="hour"
            inputId={this.props.idSuffix ? 'hour-' + this.props.idSuffix : ''}
            updateDate={this.updateDate}
            value={util.pad(date.getUTCHours(), 2, '0')}
            tabIndex={4}
            focused={this.state.tab === 4}
            setFocusedTab={this.setFocusedTab}
            changeTab={this.changeTab}
            maxDate={this.props.maxDate}
            minDate={this.props.minDate}
            blur={this.blur}
            fontSize={this.props.fontSize}
          />
          <div className="input-time-divider">:</div>
          <DateInputColumn
            step={10}
            startDate={new Date(2000)}
            date={date}
            type="minute"
            updateDate={this.updateDate}
            value={util.pad(date.getUTCMinutes(), 2, '0')}
            inputId={this.props.idSuffix ? 'minute-' + this.props.idSuffix : ''}
            tabIndex={5}
            focused={this.state.tab === 5}
            setFocusedTab={this.setFocusedTab}
            changeTab={this.changeTab}
            maxDate={this.props.maxDate}
            minDate={this.props.minDate}
            blur={this.blur}
            fontSize={this.props.fontSize}
          />
          <div className="input-time-zmark">Z</div>
        </React.Fragment>
      );
    }
  }
  render() {
    const {
      date,
      maxDate,
      minDate,
      fontSize,
      idSuffix
    } = this.props;
    const { tab } = this.state;
    return (
      <div className="wv-date-selector-widget">
        <DateInputColumn
          step={1}
          date={date}
          value={date.getUTCFullYear()}
          type="year"
          updateDate={this.updateDate}
          inputId={idSuffix ? 'year-' + idSuffix : ''}
          tabIndex={1}
          focused={tab === 1}
          setFocusedTab={this.setFocusedTab}
          changeTab={this.changeTab}
          maxDate={maxDate}
          minDate={minDate}
          blur={this.blur}
          fontSize={fontSize}
        />
        <DateInputColumn
          step={1}
          date={date}
          value={util.monthStringArray[date.getUTCMonth()]}
          type="month"
          inputId={idSuffix ? 'month-' + idSuffix : ''}
          updateDate={this.updateDate}
          tabIndex={2}
          focused={tab === 2}
          setFocusedTab={this.setFocusedTab}
          changeTab={this.changeTab}
          maxDate={maxDate}
          minDate={minDate}
          blur={this.blur}
          fontSize={fontSize}
        />
        <DateInputColumn
          step={1}
          date={date}
          type="day"
          updateDate={this.updateDate}
          value={util.pad(date.getUTCDate(), 2, '0')}
          tabIndex={3}
          inputId={idSuffix ? 'day-' + idSuffix : ''}
          focused={tab === 3}
          setFocusedTab={this.setFocusedTab}
          changeTab={this.changeTab}
          maxDate={maxDate}
          minDate={minDate}
          blur={this.blur}
          fontSize={fontSize}
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
  fontSize: PropTypes.number,
  hasSubdailyLayers: PropTypes.bool,
  id: PropTypes.string,
  idSuffix: PropTypes.string,
  maxDate: PropTypes.object,
  minDate: PropTypes.object,
  onDateChange: PropTypes.func
};

export default DateSelector;
