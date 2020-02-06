import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Switch from '../../util/switch';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
const LayerFilters = (props) => {
  const {
    selectedDate,
    filterByAvailable,
    toggleFilterByAvailable
  } = props;
  const diplayDate = moment.utc(selectedDate).format('YYYY MMM DD');
  const tooltipContent =
    <div className="filter-tooltip">
      If enabled, only show results which would be visible
      at the currently selected date: <br />
      <div className="display-date"> {diplayDate} </div>
    </div>;

  return (
    <div className="layer-filters-container">
      <div className="filter-controls">
        <h3>Filters</h3>
        <Switch
          id="unavailable-toggle"
          label="Hide unavailable"
          active={filterByAvailable}
          toggle={toggleFilterByAvailable}
          tooltip={tooltipContent}>
        </Switch>
      </div>
    </div>
  );
};

LayerFilters.propTypes = {
  filterByAvailable: PropTypes.bool,
  numResults: PropTypes.number,
  selectedDate: PropTypes.object,
  toggleFilterByAvailable: PropTypes.func
};

export default LayerFilters;
