import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default function FilterChips(props) {
  const {
    filters,
    removeFilter,
  } = props;

  console.log(filters);

  return !filters.length ? null : (
    <div className="bag-o-chips">
      {filters.flatMap(({ field, values }) => values.map((filterVal) => (
        <div
          key={field + filterVal}
          className="filter-chip"
          onClick={() => removeFilter(field, filterVal)}
        >
          {filterVal}
          <FontAwesomeIcon
            icon={faTimes}
            fixedWidth
          />
        </div>
      )))}
    </div>
  );
}

FilterChips.propTypes = {
  filters: PropTypes.array,
  removeFilter: PropTypes.func,
};
