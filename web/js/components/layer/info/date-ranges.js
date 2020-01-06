import React from 'react';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import { ListGroup, ListGroupItem } from 'reactstrap';
import Scrollbar from '../../util/scrollbar';

export class DateRanges extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showRanges: false
    };
  }

  renderYearlyListItem(
    dateRange,
    index,
    rangeStartDate,
    rangeEndDate,
    firstDateRange,
    layer
  ) {
    if (
      dateRange.dateInterval === '1' &&
      dateRange.startDate === dateRange.endDate
    ) {
      rangeStartDate = rangeStartDate.getFullYear();
      return rangeStartDate;
    } else {
      rangeStartDate = rangeStartDate.getFullYear();
      if (dateRange.dateInterval !== '1') {
        rangeEndDate = new Date(
          rangeEndDate.setFullYear(
            rangeEndDate.getFullYear() + (dateRange.dateInterval - 1)
          )
        );
      }
      rangeEndDate = rangeEndDate.getFullYear();
      if (firstDateRange) {
        if (layer.endDate === undefined) {
          rangeEndDate = 'Present';
        } else if (
          util.parseDate(layer.endDate) <= util.today() &&
          !layer.inactive
        ) {
          rangeEndDate = 'Present';
        }
        firstDateRange = false;
      }
      return rangeStartDate + ' - ' + rangeEndDate;
    }
  }

  renderMonthlyListItem(
    dateRange,
    index,
    rangeStartDate,
    rangeEndDate,
    firstDateRange,
    layer
  ) {
    if (
      dateRange.dateInterval === '1' &&
      dateRange.startDate === dateRange.endDate
    ) {
      rangeStartDate =
        util.giveMonth(rangeStartDate) + ' ' + rangeStartDate.getFullYear();
      return renderListGroupItem(rangeStartDate);
    } else {
      rangeStartDate =
        util.giveMonth(rangeStartDate) + ' ' + rangeStartDate.getFullYear();
      if (dateRange.dateInterval !== '1') {
        rangeEndDate = new Date(
          rangeEndDate.setMonth(
            rangeEndDate.getMonth() + (dateRange.dateInterval - 1)
          )
        );
      }
      rangeEndDate =
        util.giveMonth(rangeEndDate) + ' ' + rangeEndDate.getFullYear();
      if (firstDateRange) {
        if (layer.endDate === undefined) {
          rangeEndDate = 'Present';
        } else if (
          util.parseDate(layer.endDate) <= util.today() &&
          !layer.inactive
        ) {
          rangeEndDate = 'Present';
        }
        firstDateRange = false;
      }
      return rangeStartDate + ' - ' + rangeEndDate;
    }
  }

  renderDailyListItem(
    dateRange,
    index,
    rangeStartDate,
    rangeEndDate,
    firstDateRange,
    layer
  ) {
    if (
      dateRange.dateInterval === '1' &&
      dateRange.startDate === dateRange.endDate
    ) {
      rangeStartDate =
        rangeStartDate.getDate() +
        ' ' +
        util.giveMonth(rangeStartDate) +
        ' ' +
        rangeStartDate.getFullYear();
      return renderListGroupItem(rangeStartDate);
    } else {
      rangeStartDate =
        rangeStartDate.getDate() +
        ' ' +
        util.giveMonth(rangeStartDate) +
        ' ' +
        rangeStartDate.getFullYear();
      if (dateRange.dateInterval !== '1') {
        rangeEndDate = new Date(
          rangeEndDate.setTime(
            rangeEndDate.getTime() +
              (dateRange.dateInterval * 86400000 - 86400000)
          )
        );
      }
      rangeEndDate =
        rangeEndDate.getDate() +
        ' ' +
        util.giveMonth(rangeEndDate) +
        ' ' +
        rangeEndDate.getFullYear();
      if (firstDateRange) {
        if (layer.endDate === undefined) {
          rangeEndDate = 'Present';
        } else if (
          util.parseDate(layer.endDate) <= util.today() &&
          !layer.inactive
        ) {
          rangeEndDate = 'Present';
        }
        firstDateRange = false;
      }
      return rangeStartDate + ' - ' + rangeEndDate;
    }
  }

  renderSubdailyListItem(
    dateRange,
    index,
    rangeStartDate,
    rangeEndDate,
    firstDateRange,
    layer
  ) {
    rangeStartDate =
      rangeStartDate.getDate() +
      ' ' +
      util.giveMonth(rangeStartDate) +
      ' ' +
      rangeStartDate.getFullYear() +
      ' ' +
      util.pad(rangeStartDate.getHours(), 2, '0') +
      ':' +
      util.pad(rangeStartDate.getMinutes(), 2, '0');
    rangeEndDate =
      rangeEndDate.getDate() +
      ' ' +
      util.giveMonth(rangeEndDate) +
      ' ' +
      rangeEndDate.getFullYear() +
      ' ' +
      util.pad(rangeEndDate.getHours(), 2, '0') +
      ':' +
      util.pad(rangeEndDate.getMinutes(), 2, '0');
    if (firstDateRange) {
      if (layer.endDate === undefined) {
        rangeEndDate = 'Present';
      } else if (
        util.parseDate(layer.endDate) <= util.today() &&
        !layer.inactive
      ) {
        rangeEndDate = 'Present';
      }
      firstDateRange = false;
    }
    return rangeStartDate + ' - ' + rangeEndDate;
  }

  renderListItem(layer, dateRange, index) {
    const rangeStartDate = util.parseDate(dateRange.startDate);
    const rangeEndDate = util.parseDate(dateRange.endDate);
    const firstDateRange = index === 0;
    switch (layer.period) {
      case 'yearly':
        return this.renderYearlyListItem(
          dateRange,
          index,
          rangeStartDate,
          rangeEndDate,
          firstDateRange,
          layer
        );
      case 'monthly':
        return this.renderMonthlyListItem(
          dateRange,
          index,
          rangeStartDate,
          rangeEndDate,
          firstDateRange,
          layer
        );
      case 'daily':
        return this.renderDailyListItem(
          dateRange,
          index,
          rangeStartDate,
          rangeEndDate,
          firstDateRange,
          layer
        );
      case 'subdaily':
        return this.renderSubdailyListItem(
          dateRange,
          index,
          rangeStartDate,
          rangeEndDate,
          firstDateRange,
          layer
        );
      default:
        return renderListGroupItem('No period');
    }
  }

  render() {
    const { layer, screenHeight } = this.props;
    const { showRanges } = this.state;
    const style = showRanges ? { display: 'block' } : { display: 'none' };
    return (
      <React.Fragment>
        <sup
          className="layer-date-ranges-button"
          onClick={() => {
            this.setState({ showRanges: !showRanges });
          }}
        >
          *View Dates
        </sup>
        <div
          style={style}
          id="layer-date-range-list-wrap"
          className="layer-date-wrap"
        >
          <div>
            <p>Date Ranges:</p>
          </div>
          <Scrollbar style={{ maxHeight: screenHeight - 400 + 'px' }}>
            <ListGroup
              className="layer-date-ranges"
              id="layer-settings-date-range-list"
            >
              {layer.dateRanges.map((dateRange, i) => (
                <ListGroupItem key={i + layer.id + '-range-item'}>
                  {this.renderListItem(layer, dateRange, i)}
                </ListGroupItem>
              ))}
            </ListGroup>
          </Scrollbar>
        </div>
      </React.Fragment>
    );
  }
}
const renderListGroupItem = function(range) {
  return range;
};

DateRanges.propTypes = {
  dateRanges: PropTypes.object,
  layer: PropTypes.object,
  screenHeight: PropTypes.number
};
