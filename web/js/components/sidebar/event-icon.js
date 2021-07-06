import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

export default function EventIcon ({
  id, category, title, hideTooltip,
}) {
  const slug = category.toLowerCase().split(' ').join('-');
  return (
    <>
      {!hideTooltip && (
      <UncontrolledTooltip
        placement="top"
        target={id + slug}
        delay={{ show: 50, hide: 0 }}
      >
        {title || category}
      </UncontrolledTooltip>
      )}
      <i
        id={id + slug}
        className={`event-icon event-icon-${slug}`}
      />
    </>
  );
}

EventIcon.propTypes = {
  id: PropTypes.string,
  category: PropTypes.string,
  hideTooltip: PropTypes.bool,
  title: PropTypes.string,
};
