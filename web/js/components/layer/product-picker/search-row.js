import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'reactstrap';
import util from '../../../util/util.js';
import { getOrbitTrackTitle, dateOverlap } from '../../../modules/layers/util';
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
    let startDate, startDateId, endDate, endDateId;

    if (layer.startDate) {
      startDateId = layer.id + '-startDate';
      startDate = util.coverageDateFormatter('START-DATE', layer.startDate, layer.period);
    }

    if (layer.endDate) {
      endDateId = layer.id + '-endDate';
      endDate = util.parseDate(layer.endDate);

      if (endDate <= util.today() && !layer.inactive) {
        endDate = 'Present';
      } else {
        endDate = util.coverageDateFormatter('END-DATE', layer.endDate, layer.period);
      }
    } else {
      endDate = 'Present';
    }

    const dateRange =
    `
      Temporal coverage:
      <span class="layer-date-start" id='${startDateId}'> ${startDate} </span> -
      <span class="layer-end-date" id='${endDateId}'> ${endDate} </span>
    `;

    return dateRange;
  }

  getListItems(layer) {
    return layer.dateRanges
      .slice(0)
      .reverse()
      .map(l => {
        let listItemStartDate;
        let listItemEndDate;

        if (l.startDate) {
          listItemStartDate = util.coverageDateFormatter('START-DATE', l.startDate, layer.period);
        }

        if (l.endDate) {
          listItemEndDate = util.coverageDateFormatter('END-DATE', l.endDate, layer.period);
        }

        return (
          <ListGroupItem key={l.startDate + ' - ' + l.endDate}>
            {listItemStartDate + ' - ' + listItemEndDate}
          </ListGroupItem>
        );
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
    const { title, track, description, subtitle, metadata } = layer;
    let listItems;
    let headerClass = 'layers-all-header has-checkbox';

    if (layer.dateRanges && layer.dateRanges.length > 1) {
      var dateRanges = dateOverlap(layer.period, layer.dateRanges);
      if (dateRanges.overlap === false) {
        listItems = this.getListItems(layer);
      }
    }
    if (checked) headerClass += ' checked';
    const layerTitle = !track ? title : `${title} (${getOrbitTrackTitle(layer)})`;

    return (
      <div className="layers-all-layer">
        <div className={headerClass} onClick={() => this.toggleCheck()}>
          <h3>
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
