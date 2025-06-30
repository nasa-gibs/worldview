import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

export default function EventIcon (props) {
  const {
    id,
    category,
    title,
    hideTooltip,
  } = props;

  return (
    <div>
      <i
        id={id + category}
        className={`event-icon event-icon-${category}`}
      />
      {!hideTooltip && (
        <UncontrolledTooltip
          id={`center-align-tooltip ${category}-${id}`}
          placement="top"
          target={id + category}
          fade={false}
        >
          {title || category}
        </UncontrolledTooltip>
      )}
    </div>
  );
}

EventIcon.propTypes = {
  id: PropTypes.string,
  category: PropTypes.string,
  hideTooltip: PropTypes.bool,
  title: PropTypes.string,
};
