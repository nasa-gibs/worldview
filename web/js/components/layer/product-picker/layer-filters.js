import React from 'react';
import PropTypes from 'prop-types';
import FilterUnavailable from './filterUnavailable';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
const LayerFilters = (props) => {
  const {
    selectedDate,
    filterByAvailable,
    toggleFilterByAvailable,
  } = props;

  return (
    <div className="layer-filters-container">
      <div className="filter-controls">
        <h3>Filters</h3>
        <FilterUnavailable
          selectedDate={selectedDate}
          filterByAvailable={filterByAvailable}
          toggleFilterByAvailable={toggleFilterByAvailable}
        />
      </div>
    </div>
  );
};

LayerFilters.propTypes = {
  filterByAvailable: PropTypes.bool,
  selectedDate: PropTypes.object,
  toggleFilterByAvailable: PropTypes.func,
};

export default LayerFilters;
