import PropTypes from 'prop-types';
import React from 'react';
import SelectedDate from '../../../selected-date';

function AvailableFacet({
  className,
  label,
  options,
  onChange,
  onRemove,
  values,
}) {
  const trueOptions = options.find((option) => option.value === 'true');
  if (!trueOptions) return null;
  const isSelected = values.includes('true');

  const apply = () => onChange('true');
  const remove = () => onRemove('true');
  const toggle = () => {
    // eslint-disable-next-line no-unused-expressions
    isSelected ? remove() : apply();
  };

  return (
    <fieldset className="sui-facet">
      <legend className="sui-facet__title">
        Visible on &nbsp;
        <SelectedDate />
      </legend>
      <div className="sui-boolean-facet">
        <div className="sui-boolean-facet__option-input-wrapper">
          <label className="sui-boolean-facet__option-label">
            <div className="sui-boolean-facet__option-input-wrapper">
              <input
                className="sui-boolean-facet__checkbox"
                type="checkbox"
                checked={isSelected}
                onChange={toggle}
              />
              <span className="sui-boolean-facet__input-text">{label}</span>
            </div>
            <span className="sui-boolean-facet__option-count">
              {trueOptions.count}
            </span>
          </label>
        </div>
      </div>
    </fieldset>
  );
}

AvailableFacet.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  options: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  values: PropTypes.array,
};

export default AvailableFacet;
