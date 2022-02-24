import React from 'react';
import PropTypes from 'prop-types';

export default function FormattedDate({ date, children }) {
  return (
    <span className="monospace">
      {children}
      {date}
    </span>
  );
}
FormattedDate.propTypes = {
  children: PropTypes.object,
  date: PropTypes.string,
};
