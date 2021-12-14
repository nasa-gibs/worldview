import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

export default function EventIcon ({
  id, category, title, hideTooltip,
}) {
  const slug = category.toLowerCase().split(' ').join('-');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggle = ({ buttons }) => {
    const open = buttons ? false : !tooltipOpen;
    setTooltipOpen(open);
  };

  return (
    <>
      <Tooltip
        placement="top"
        target={id + slug}
        delay={{ show: 50, hide: 0 }}
        toggle={toggle}
        isOpen={!hideTooltip && tooltipOpen}
      >
        {title || category}
      </Tooltip>
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
