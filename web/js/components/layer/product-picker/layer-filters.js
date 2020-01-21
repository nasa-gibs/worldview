import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Form, Tooltip } from 'reactstrap';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class ProductPickerHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipFilterAvailableOpen: false
    };
  }

  toggleTooltip() {
    this.setState({
      tooltipFilterAvailableOpen: !this.state.tooltipFilterAvailableOpen
    });
  }

  render() {
    const { tooltipFilterAvailableOpen } = this.state;
    const {
      selectedDate,
      numResults,
      filterByAvailable,
      toggleFilterByAvailable
    } = this.props;
    const diplayDate = moment(selectedDate).format('YYYY MMM DD');

    return (
      <div className="layer-filters-container">
        <div className="filter-controls">
          <h3>Filters</h3>
          <Form>
            <div className="custom-control custom-switch">
              <input
                id="unit-toggle"
                className="custom-control-input"
                type="checkbox"
                onChange={toggleFilterByAvailable}
                defaultChecked={filterByAvailable}/>
              <label className="custom-control-label" htmlFor="unit-toggle">
                Filter by availability
              </label>
              <i id="availability-filter" className="fa fa-info-circle" />
              <Tooltip
                placement="right"
                isOpen={tooltipFilterAvailableOpen}
                target="availability-filter"
                toggle={this.toggleTooltip.bind(this)}>
                  If enabled, only show results which would be visible at the
                  currently selected date: <br/>
                <span style={{ fontFamily: 'monospace' }}> {diplayDate} </span>
              </Tooltip>
            </div>
          </Form>
        </div>
        <div className="results-text">
          Showing {numResults} results
        </div>
      </div>
    );
  }
}

ProductPickerHeader.propTypes = {
  filterByAvailable: PropTypes.bool,
  numResults: PropTypes.number,
  selectedDate: PropTypes.object,
  toggleFilterByAvailable: PropTypes.func
};

export default ProductPickerHeader;
