import React from 'react';
import PropTypes from 'prop-types';

/*
 *
 * @class Selector
 * @extends React.Component
 */
export default function Selector (props) {
  const {
    onChange, optionName, optionArray, id, value,
  } = props;

  const handleChange = (event) => {
    onChange(optionName, event.target.value);
  };

  return (
    <select
      value={value}
      id={id}
      onChange={handleChange}
    >
      {optionArray.values.map((dataEl, i) => (
        /* eslint react/no-array-index-key: 1 */
        <option key={`${dataEl.value}-${i}`} value={dataEl.value}>
          {dataEl.text}
        </option>
      ))}
    </select>
  );
}

Selector.propTypes = {
  id: PropTypes.string,
  onChange: PropTypes.func,
  optionArray: PropTypes.object,
  optionName: PropTypes.string,
  value: PropTypes.string,
};
