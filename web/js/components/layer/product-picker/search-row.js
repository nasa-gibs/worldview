import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'reactstrap';
import util from '../../../util/util.js';
/**
 * A single layer search result row
 * @class LayerRow
 * @extends React.Component
 */
class LayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.isEnabled,
      isMetadataExpanded: props.isMetadataExpanded,
      isDateRangesExpanded: props.isDateRangesExpanded
    };
  }

  /**
   * Toggle layer checked state
   * @method toggleCheck
   * @return {void}
   */
  toggleCheck() {
    var { checked } = this.state;
    var { onState, offState, layer } = this.props;
    if (checked) offState(layer.id);
    if (!checked) onState(layer.id);
    this.setState({ checked: !checked });
  }

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @param {e} event
   * @return {void}
   */
  toggleMetadataButtons(e) {
    e.stopPropagation(); // Prevent layer from being activated
    var { layer, toggleMetadataExpansion } = this.props;
    this.setState({ isMetadataExpanded: !this.state.isMetadataExpanded });
    toggleMetadataExpansion(layer.id);
  }

  /**
   * Toggle switch for the metadata info button and close arrow
   * @method toggleMetadataButtons
   * @param {e} event
   * @return {void}
   */
  toggleDateRanges(e) {
    e.stopPropagation(); // Prevent layer from being activated
    var { layer, toggleDateRangesExpansion } = this.props;
    this.setState({ isDateRangesExpanded: !this.state.isDateRangesExpanded });
    toggleDateRangesExpansion(layer.id);
  }

  /**
   * dateRangeText - Return text with the temporal range based on layer start
   * and end dates
   *
   * @method toggleMetadataButtons
   * @param  {object} layer the layer object
   * @return {string}       Return a string with temporal range information
   */
  dateRangeText(layer) {
    var startDate, startDateId, endDate, endDateId;
    var dateRange = '';
    if (layer.startDate) {
      startDate = util.parseDate(layer.startDate);
      if (layer.period === 'subdaily') {
        startDate =
          startDate.getDate() +
          ' ' +
          util.giveMonth(startDate) +
          ' ' +
          startDate.getFullYear() +
          ' ' +
          util.pad(startDate.getHours(), 2, '0') +
          ':' +
          util.pad(startDate.getMinutes(), 2, '0');
      } else if (layer.period === 'yearly') {
        startDate = startDate.getFullYear();
      } else if (layer.period === 'monthly') {
        startDate = util.giveMonth(startDate) + ' ' + startDate.getFullYear();
      } else {
        startDate =
          startDate.getDate() +
          ' ' +
          util.giveMonth(startDate) +
          ' ' +
          startDate.getFullYear();
      }
      if (layer.id) startDateId = layer.id + '-startDate';

      if (layer.endDate) {
        endDate = util.parseDate(layer.endDate);
        if (endDate <= util.today() && !layer.inactive) {
          endDate = 'Present';
        } else {
          if (layer.period === 'subdaily') {
            endDate =
              endDate.getDate() +
              ' ' +
              util.giveMonth(endDate) +
              ' ' +
              endDate.getFullYear() +
              ' ' +
              util.pad(endDate.getHours(), 2, '0') +
              ':' +
              util.pad(endDate.getMinutes(), 2, '0');
          } else if (layer.period === 'yearly') {
            endDate = new Date(endDate.setFullYear(endDate.getFullYear() - 1));
            endDate = endDate.getFullYear();
          } else if (layer.period === 'monthly') {
            endDate = new Date(endDate.setMonth(endDate.getMonth() - 1));
            endDate = util.giveMonth(endDate) + ' ' + endDate.getFullYear();
          } else {
            if (
              layer.dateRanges &&
              layer.dateRanges.slice(-1)[0].dateInterval !== '1'
            ) {
              endDate = new Date(endDate.setTime(endDate.getTime() - 86400000));
            }
            endDate =
              endDate.getDate() +
              ' ' +
              util.giveMonth(endDate) +
              ' ' +
              endDate.getFullYear();
          }
        }
      } else {
        endDate = 'Present';
      }
      if (layer.id) endDateId = layer.id + '-endDate';
      dateRange =
        'Temporal coverage: <span class="layer-date-start" id=' +
        startDateId +
        '>' +
        startDate +
        '</span> - <span class="layer-end-date" id=' +
        endDateId +
        '>' +
        endDate +
        '</span>';
    }

    return dateRange;
  }

  // this function takes an array of date ranges in this format:
  // [{ layer.period, dateRanges.startDate: Date, dateRanges.endDate: Date, dateRanges.dateInterval: Number}]
  // the array is first sorted, and then checked for any overlap
  dateOverlap(period, dateRanges) {
    var sortedRanges = dateRanges.sort((previous, current) => {
      // get the start date from previous and current
      var previousTime = util.parseDate(previous.startDate);
      previousTime = previousTime.getTime();
      var currentTime = util.parseDate(current.startDate);
      currentTime = currentTime.getTime();

      // if the previous is earlier than the current
      if (previousTime < currentTime) {
        return -1;
      }

      // if the previous time is the same as the current time
      if (previousTime === currentTime) {
        return 0;
      }

      // if the previous time is later than the current time
      return 1;
    });

    var result = sortedRanges.reduce(
      (result, current, idx, arr) => {
        // get the previous range
        if (idx === 0) {
          return result;
        }
        var previous = arr[idx - 1];

        // check for any overlap
        var previousEnd = util.parseDate(previous.endDate);
        // Add dateInterval
        if (previous.dateInterval > 1 && period === 'daily') {
          previousEnd = new Date(
            previousEnd.setTime(
              previousEnd.getTime() +
                (previous.dateInterval * 86400000 - 86400000)
            )
          );
        }
        if (period === 'monthly') {
          previousEnd = new Date(
            previousEnd.setMonth(
              previousEnd.getMonth() + (previous.dateInterval - 1)
            )
          );
        } else if (period === 'yearly') {
          previousEnd = new Date(
            previousEnd.setFullYear(
              previousEnd.getFullYear() + (previous.dateInterval - 1)
            )
          );
        }
        previousEnd = previousEnd.getTime();

        var currentStart = util.parseDate(current.startDate);
        currentStart = currentStart.getTime();

        var overlap = previousEnd >= currentStart;
        // store the result
        if (overlap) {
          // yes, there is overlap
          result.overlap = true;
          // store the specific ranges that overlap
          result.ranges.push({
            previous: previous,
            current: current
          });
        }

        return result;
      },
      {
        overlap: false,
        ranges: []
      }
    );

    // return the final results
    return result;
  }

  getListItems(layer, firstDateRange) {
    return layer.dateRanges
      .slice(0)
      .reverse()
      .map(l => {
        const startDate = util.parseDate(l.startDate);
        const endDate = util.parseDate(l.endDate);
        let listItemStartDate;
        let listItemEndDate;

        if (layer.period === 'subdaily') {
          listItemStartDate =
            startDate.getDate() +
            ' ' +
            util.giveMonth(startDate) +
            ' ' +
            startDate.getFullYear() +
            ' ' +
            util.pad(startDate.getHours(), 2, '0') +
            ':' +
            util.pad(startDate.getMinutes(), 2, '0');

          listItemEndDate =
            endDate.getDate() +
            ' ' +
            util.giveMonth(endDate) +
            ' ' +
            endDate.getDate() +
            ' ' +
            util.giveMonth(endDate) +
            ' ' +
            endDate.getFullYear() +
            ' ' +
            util.pad(endDate.getHours(), 2, '0') +
            ':' +
            util.pad(endDate.getMinutes(), 2, '0');

          if (firstDateRange) {
            if (layer.endDate === undefined) {
              listItemEndDate = 'Present';
            } else if (
              util.parseDate(layer.endDate) <= util.today() &&
              !layer.inactive
            ) {
              listItemEndDate = 'Present';
            }
            firstDateRange = false;
          }

          return (
            <ListGroupItem key={l.startDate + ' - ' + l.endDate}>
              {listItemStartDate + ' - ' + listItemEndDate}
            </ListGroupItem>
          );
        } else if (layer.period === 'yearly') {
          if (l.dateInterval === '1' && l.startDate === l.endDate) {
            listItemStartDate = startDate.getFullYear();

            return (
              <ListGroupItem key={l.startDate}>
                {listItemStartDate}
              </ListGroupItem>
            );
          } else {
            listItemStartDate = startDate.getFullYear();
            if (l.dateInterval !== '1') {
              listItemEndDate = new Date(
                endDate.setFullYear(endDate.getFullYear() - 1 + l.dateInterval)
              );
            }
            listItemEndDate = endDate.getFullYear();

            if (firstDateRange) {
              if (layer.endDate === undefined) {
                listItemEndDate = 'Present';
              } else if (
                util.parseDate(layer.endDate) <= util.today() &&
                !layer.inactive
              ) {
                listItemEndDate = 'Present';
              }
              firstDateRange = false;
            }

            return (
              <ListGroupItem key={l.startDate}>
                {listItemStartDate + ' - ' + listItemEndDate}
              </ListGroupItem>
            );
          }
        } else if (layer.period === 'monthly') {
          if (l.dateInterval === '1' && l.startDate === l.endDate) {
            listItemStartDate =
              util.giveMonth(startDate) + ' ' + startDate.getFullYear();

            return (
              <ListGroupItem key={l.startDate}>
                {listItemStartDate}
              </ListGroupItem>
            );
          } else {
            listItemStartDate =
              util.giveMonth(startDate) + ' ' + startDate.getFullYear();
            if (l.dateInterval !== '1') {
              listItemEndDate = new Date(
                endDate.setMonth(endDate.getMonth() - 1 + l.dateInterval)
              );
            }
            listItemEndDate =
              util.giveMonth(endDate) + ' ' + endDate.getFullYear();

            if (firstDateRange) {
              if (layer.endDate === undefined) {
                listItemEndDate = 'Present';
              } else if (
                util.parseDate(layer.endDate) <= util.today() &&
                !layer.inactive
              ) {
                listItemEndDate = 'Present';
              }
              firstDateRange = false;
            }

            return (
              <ListGroupItem key={l.startDate}>
                {listItemStartDate + ' - ' + listItemEndDate}
              </ListGroupItem>
            );
          }
        } else if (layer.period) {
          if (l.dateInterval === '1' && l.startDate === l.endDate) {
            const listItemStartDate =
              startDate.getDate() +
              ' ' +
              util.giveMonth(startDate) +
              ' ' +
              startDate.getFullYear();

            return (
              <ListGroupItem key={l.startDate + ' - ' + l.endDate}>
                {listItemStartDate}
              </ListGroupItem>
            );
          } else {
            const listItemStartDate =
              startDate.getDate() +
              ' ' +
              util.giveMonth(startDate) +
              ' ' +
              startDate.getFullYear();
            if (l.dateInterval !== '1') {
              listItemEndDate = new Date(
                endDate.setTime(
                  endDate.getTime() - 86400000 + l.dateInterval * 86400000
                )
              );
            }
            listItemEndDate =
              endDate.getDate() +
              ' ' +
              util.giveMonth(endDate) +
              ' ' +
              endDate.getFullYear();

            if (firstDateRange) {
              if (layer.endDate === undefined) {
                listItemEndDate = 'Present';
              } else if (
                util.parseDate(layer.endDate) <= util.today() &&
                !layer.inactive
              ) {
                listItemEndDate = 'Present';
              }
              firstDateRange = false;
            }

            return (
              <ListGroupItem key={l.startDate + ' - ' + l.endDate}>
                {listItemStartDate + ' - ' + listItemEndDate}
              </ListGroupItem>
            );
          }
        }
      });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      checked: nextProps.isEnabled,
      isMetadataExpanded: nextProps.isMetadataExpanded,
      isDateRangesExpanded: nextProps.isDateRangesExpanded
    });
  }

  render() {
    const { checked, isMetadataExpanded, isDateRangesExpanded } = this.state;
    const { layer } = this.props;
    const { title, track, daynight, description, subtitle, metadata } = layer;
    let listItems;
    let headerClass = 'layers-all-header has-checkbox';
    const isTrackLayer = track && daynight;

    if (layer.dateRanges && layer.dateRanges.length > 1) {
      const firstDateRange = true;
      var dateRanges = this.dateOverlap(layer.period, layer.dateRanges);
      if (dateRanges.overlap === false) {
        listItems = this.getListItems(layer, firstDateRange);
      }
    }
    if (checked) headerClass += ' checked';

    const layerTitle = isTrackLayer
      ? `${title} (${track}/${daynight})`
      : title;

    return (
      <div className="layers-all-layer">
        <div className={headerClass} onClick={() => this.toggleCheck()}>
          <h3 className={isTrackLayer ? 'capitalize' : ''}>
            {layerTitle}
            {description && (
              <i
                className="fa fa-info-circle"
                onClick={e => this.toggleMetadataButtons(e)}
              />
            )}
          </h3>
          {subtitle && <h5>{subtitle}</h5>}
        </div>
        {isMetadataExpanded && (
          <div className="source-metadata visible">
            {layer.startDate && (
              <p className="layer-date-range">
                <span
                  dangerouslySetInnerHTML={{
                    __html: this.dateRangeText(layer)
                  }}
                />
                {layer.dateRanges &&
                  layer.dateRanges.length > 1 &&
                  dateRanges.overlap === false && (
                  <a
                    id="layer-date-ranges-button"
                    title="View all date ranges"
                    className="layer-date-ranges-button"
                    onClick={e => this.toggleDateRanges(e)}
                  >
                    {' '}
                    <sup>*View Dates</sup>
                  </a>
                )}
              </p>
            )}
            {isDateRangesExpanded && (
              <div className="layer-date-wrap">
                <p>Date Ranges:</p>
                <ListGroup className="layer-date-ranges">{listItems}</ListGroup>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: metadata }} />
            <div
              className="metadata-more"
              onClick={e => this.toggleMetadataButtons(e)}
            >
              <span className="ellipsis up">^</span>
            </div>
          </div>
        )}
      </div>
    );
  }
}
LayerRow.propTypes = {
  isDateRangesExpanded: PropTypes.bool,
  isEnabled: PropTypes.bool,
  isMetadataExpanded: PropTypes.bool,
  layer: PropTypes.object,
  offState: PropTypes.func,
  onState: PropTypes.func,
  toggleDateRangesExpansion: PropTypes.func,
  toggleMetadataExpansion: PropTypes.func
};

export default LayerRow;
