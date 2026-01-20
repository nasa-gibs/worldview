import React from 'react';
import PropTypes from 'prop-types';

export default function MonospaceDate({ date, children }) {
  return (
    <span className="monospace">
      {children}
      {date}
    </span>
  );
}
MonospaceDate.propTypes = {
  children: PropTypes.shape,
  date: PropTypes.string,
};
