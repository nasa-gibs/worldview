import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default function FilterChips(props) {
  const {
    filters,
    removeFilter,
    facetConfig,
  } = props;

  const filterValues = filters.flatMap(({ field, values }) => {
    const config = facetConfig.find((conf) => conf.field === field);
    return values.map((value) => ({
      field,
      displayValue: config.useLabelForValue ? config.label : value,
      value,
    }));
  });

  return !filters.length ? null : (
    <div className="bag-o-chips">
      {filterValues.map(({
        field, displayValue, value,
      }) => (
        <div
          key={field + value}
          className="filter-chip"
          onClick={() => removeFilter(field, value)}
        >
          {displayValue}
          <FontAwesomeIcon
            icon={faTimes}
            fixedWidth
          />
        </div>
      ))}
    </div>
  );
}

FilterChips.propTypes = {
  filters: PropTypes.array,
  removeFilter: PropTypes.func,
  facetConfig: PropTypes.array,
};
