import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

export default function EventIcon ({ id, category, title }) {
  const slug = category.toLowerCase().split(' ').join('-');
  return (
    <>
      <UncontrolledTooltip
        placement="top"
        target={id + slug}
      >
        {title || category}
      </UncontrolledTooltip>
      <i
        id={id + slug}
        className={`event-icon event-icon-${slug}`}
      />
    </>
  );
}

EventIcon.propTypes = {
  category: PropTypes.string,
  title: PropTypes.string,
};
